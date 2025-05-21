import { PrismaClient, Prisma } from '@prisma/client';
import type { conversations } from '@prisma/client';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { WhatsAppCloudApiService } from './whatsapp-cloud-api';
import { WhatsAppCloudImageProcessor } from './whatsapp-cloud-image-processor';
import { WhatsAppCloudAudioProcessor } from './whatsapp-cloud-audio-processor';
import { WhatsAppCloudTextProcessor } from './whatsapp-cloud-text-processor';
import { structuredLog } from './whatsapp-cloud-logger';
import { splitTextIntoBlocks } from './whatsapp-cloud-formatter';
import { 
  getCachedMediaUrl,
  isMessageProcessed,
  processedMessagesCache
} from './whatsapp-cloud-cache';
import { WhatsAppCloudConversationManager } from './whatsapp-cloud-conversation';
import { whatsapp_cloud_connections, agents, leads } from '@prisma/client';
import fetch from 'node-fetch';
import NodeCache from 'node-cache';
import { getSupabaseClient } from '../supabase';
import { LRUCache } from 'lru-cache';
import { WhatsAppCloudMessageDuplicityChecker } from './whatsapp-cloud-message-duplicity-checker';
import { WhatsAppCloudResponseSender } from './whatsapp-cloud-response-sender';
import { WhatsAppCloudMessageStorage, SimpleLogger } from './whatsapp-cloud-message-storage';
import {
  WhatsAppMessage,
  WhatsAppImageMessage,
  WhatsAppAudioMessage,
  WhatsAppCloudConnectionWithAgent,
  ProcessMessageParams,
  ChatMessageContent,
  ImageUrlContent,
  ChatContent,
  ChatMessage,
  ConversationCreateInput,
  MessageCreateInput,
  MessageUncheckedCreateInput,
  MessageWhereInput,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_AUDIO_MIME_TYPES
} from './whatsapp-cloud-types';
import { WhatsAppCloudHumanMessageHandler } from './whatsapp-cloud-human-message-handler';

/**
 * Ajusta o fuso horário para compensar a conversão automática para UTC
 * Subtrai 3 horas para o fuso horário Brasil (UTC-3)
 */
function adjustTimezoneBR(): Date {
  const date = new Date();
  date.setHours(date.getHours() - 3);
  return date;
}

/**
 * Processador principal de mensagens do WhatsApp Cloud.
 * Atua como um orquestrador coordenando os diferentes componentes especializados.
 */
export class WhatsAppCloudMessageProcessor {
  private whatsappCloud: WhatsAppCloudApiService;
  private prisma: PrismaClient;
  private openai: OpenAI;
  private connection!: WhatsAppCloudConnectionWithAgent;
  private readonly BLOCK_DELAY = 3000; // 3 segundos entre blocos
  private processedMessageIds = new Set<string>();
  private imageProcessor: WhatsAppCloudImageProcessor;
  private audioProcessor: WhatsAppCloudAudioProcessor;
  private textProcessor: WhatsAppCloudTextProcessor;
  private conversationManager: WhatsAppCloudConversationManager;
  private duplicityChecker: WhatsAppCloudMessageDuplicityChecker;
  private responseSender: WhatsAppCloudResponseSender;
  private messageStorage: WhatsAppCloudMessageStorage;
  private humanMessageHandler: WhatsAppCloudHumanMessageHandler;

  constructor(
    whatsappCloud: WhatsAppCloudApiService, 
    prisma: PrismaClient, 
    connection: WhatsAppCloudConnectionWithAgent,
    openai: OpenAI
  ) {
    this.whatsappCloud = whatsappCloud;
    this.prisma = prisma;
    this.connection = connection;
    this.openai = openai;
    
    // Inicializar os processadores de mídia
    this.imageProcessor = new WhatsAppCloudImageProcessor({
      prisma: this.prisma,
      openai: this.openai,
      accessToken: this.connection.accessToken,
      workspaceId: this.connection.workspaceId,
      assistant_id: this.connection.assistant_id
    });
    
    this.audioProcessor = new WhatsAppCloudAudioProcessor({
      prisma: this.prisma,
      openai: this.openai,
      accessToken: this.connection.accessToken,
      workspaceId: this.connection.workspaceId,
      assistant_id: this.connection.assistant_id
    });
    
    this.textProcessor = new WhatsAppCloudTextProcessor({
      prisma: this.prisma,
      openai: this.openai,
      accessToken: this.connection.accessToken,
      workspaceId: this.connection.workspaceId,
      assistant_id: this.connection.assistant_id
    });
    
    // Inicializar os componentes de suporte
    this.conversationManager = new WhatsAppCloudConversationManager({
      prisma: this.prisma,
      openai: this.openai,
      workspaceId: this.connection.workspaceId
    });
    
    this.duplicityChecker = new WhatsAppCloudMessageDuplicityChecker(this.prisma);
    this.responseSender = new WhatsAppCloudResponseSender(this.prisma, this.whatsappCloud);
    
    // Criar um logger estruturado para o messageStorage
    const logger: SimpleLogger = {
      info: (message: string, context?: any) => structuredLog(context || {}, 'info', message),
      warn: (message: string, context?: any) => structuredLog(context || {}, 'warn', message),
      error: (message: string, context?: any) => structuredLog(context || {}, 'error', message)
    };
    
    this.messageStorage = new WhatsAppCloudMessageStorage(this.prisma, logger);
    
    // Inicializar o manipulador de mensagens humanas
    this.humanMessageHandler = new WhatsAppCloudHumanMessageHandler(this.openai, logger);
  }

  /**
   * Processa uma mensagem recebida do WhatsApp Cloud
   */
  async processIncomingMessage({ leadId, message, connectionId, messageId, phone }: ProcessMessageParams): Promise<string> {
    const correlationId = uuidv4();
    const logContext = { correlationId, messageId, phone };
    
    try {
      structuredLog(logContext, 'info', '=== PROCESSANDO MENSAGEM DO WHATSAPP CLOUD ===');
      structuredLog(logContext, 'info', 'Detalhes da mensagem recebida', {
        messageId,
        type: message.type,
        hasText: !!message.text,
        hasAudio: !!message.audio,
        timestamp: message.timestamp
      });
      
      // Validar se a mensagem já foi processada
      if (!messageId) {
        structuredLog(logContext, 'warn', 'MessageId não fornecido, ignorando mensagem');
        return 'Mensagem sem ID ignorada';
      }

      // Verificar se a mensagem é duplicada
      const isDuplicate = await this.duplicityChecker.isMessageDuplicate(
        messageId,
        message.audio?.id,
        message.image?.id,
        logContext
      );
      
      if (isDuplicate) {
        return 'Mensagem já processada';
      }

      // Verificar se a mensagem é muito antiga
      if (this.duplicityChecker.isMessageTooOld(message.timestamp, 900, logContext)) {
        return 'Mensagem muito antiga ignorada';
      }

      // Obter ou criar uma conversa
      const conversation = await this.conversationManager.getOrCreateConversation(phone);
      if (!conversation) {
        throw new Error('Não foi possível criar ou recuperar a conversa');
      }

      // Processar a mensagem baseado no tipo
      let response: string;
      try {
        // Verificar se a mensagem já foi processada (verificação secundária por conteúdo)
        structuredLog(logContext, 'info', '🔍 Verificando se a mensagem já foi processada...');
        
        // Criar identificadores únicos para a mensagem
        const cacheKeySender = `${phone}_${message.timestamp}`;
        const cacheKeyContent = `${phone}_${this.getMessageContent(message)}`;
        let cacheKeyMedia = '';
        
        if (message.type === 'image' && message.image?.id) {
          cacheKeyMedia = `image_${message.image.id}`;
        } else if (message.type === 'audio' && message.audio?.id) {
          cacheKeyMedia = `audio_${message.audio.id}`;
        }
        
        const cacheKeys = [cacheKeySender, cacheKeyContent];
        if (cacheKeyMedia) cacheKeys.push(cacheKeyMedia);
        
        // Verificar se a mensagem já foi processada pelo conteúdo
        // Usar messageId como ID principal e cacheKeys como chaves adicionais
        const additionalIds = cacheKeys.map(key => ({ type: 'message', id: key }));
        if (messageId && isMessageProcessed(messageId, additionalIds)) {
          structuredLog(logContext, 'info', '🔄 Mensagem já processada anteriormente', { messageId, additionalIds });
          return 'Mensagem já processada anteriormente';
        }

        // Verificar se a mensagem já foi processada (verificação secundária por conteúdo)
        structuredLog(logContext, 'info', '🔍 Verificando se a mensagem já foi processada...');
        
        // Uma verificação primária já foi feita através do duplicityChecker.isMessageDuplicate()
        // Não precisamos fazer uma segunda verificação com chaves similares
        // que pode causar falsos positivos para mensagens diferentes
        
        // Vamos prosseguir com o processamento da mensagem

        switch (message.type) {
          case 'text':
            response = await this.handleTextMessage(message, conversation as conversations, messageId, correlationId);
            break;

          case 'audio':
            response = await this.handleAudioMessage(message, conversation as conversations, correlationId);
            break;

          case 'image':
            response = await this.handleImageMessage(message, conversation as conversations, correlationId);
            break;

          default:
            structuredLog(logContext, 'warn', 'Tipo de mensagem não suportado', { type: message.type });
            response = 'Desculpe, este tipo de mensagem não é suportado. Por favor, envie texto, áudio ou imagem.';
        }

        // Salvar e enviar a resposta
        if (response) {
          await this.responseSender.saveAndSendResponse(response, conversation.id, phone, correlationId);
          
          // Apenas adicionar o ID da mensagem ao cache, não as chaves de conteúdo ou timestamp
          // que podem causar falsos positivos
          processedMessagesCache.set(messageId, true);
          
          // Se a mensagem tem mídias, adicionar seus IDs também
          if (message.audio?.id) {
            processedMessagesCache.set(`audio_${message.audio.id}`, true);
          }
          
          if (message.image?.id) {
            processedMessagesCache.set(`image_${message.image.id}`, true);
          }
          
          structuredLog(logContext, 'info', '=== PROCESSAMENTO DE MENSAGEM CONCLUÍDO ===');
          return response;
        }
        
        // Return padrão para o caso de switch não definir uma resposta
        return 'Processamento concluído sem resposta definida';

      } catch (error) {
        structuredLog(logContext, 'error', 'Erro ao processar mensagem', error);
        return 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';
      }

    } catch (error) {
      structuredLog({ correlationId, messageId, phone }, 'error', 'Erro no processamento da mensagem', error);
      return 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';
    }
  }

  /**
   * Processa mensagens de texto
   */
  private async handleTextMessage(
    message: WhatsAppMessage,
    conversation: conversations,
    messageId: string | undefined,
    correlationId: string
  ): Promise<string> {
    if (!message.text) {
      structuredLog({ correlationId, messageId, phone: '' }, 'warn', 'Mensagem de texto sem conteúdo');
      return 'Por favor, envie uma mensagem com conteúdo.';
    }
    
    const logContext = { correlationId, messageId, phone: '' };
    structuredLog(logContext, 'info', 'Processando mensagem de texto...');
    
    // Salvar mensagem de texto
    const now = adjustTimezoneBR(); // Usando a função de ajuste de fuso horário
    
    const messageData = {
      content: message.text,
      sender: 'user',
      read: true,
      type: 'text',
      external_id: messageId,
      created_at: now, // Timestamp com ajuste de fuso horário
      updated_at: now,  // Timestamp com ajuste de fuso horário
      conversations: {
        connect: { id: conversation.id }
      }
    };
    const newMessage = await this.prisma.messages.create({ data: messageData });
    
    let response = await this.textProcessor.processTextMessage(
      message.text, 
      conversation.thread_id,
      correlationId
    );
    
    return response;
  }

  /**
   * Processa mensagens de áudio
   */
  private async handleAudioMessage(
    message: WhatsAppMessage,
    conversation: conversations,
    correlationId: string
  ): Promise<string> {
    if (!message.audio?.id) {
      structuredLog({ correlationId, messageId: '', phone: '' }, 'warn', 'Mensagem de áudio sem ID');
      return 'Desculpe, não foi possível processar o áudio. Por favor, tente novamente.';
    }
    
    structuredLog({ correlationId, messageId: '', phone: '' }, 'info', 'Processando mensagem de áudio...');
    
    // Obter URL da mídia
    let mediaUrl;
    try {
      mediaUrl = await this.getCachedMediaUrl(message.audio.id, 'audio');
      structuredLog({ correlationId, messageId: '', phone: '' }, 'info', 'URL do áudio obtida', { mediaUrl });
    } catch (mediaUrlError) {
      structuredLog({ correlationId, messageId: '', phone: '' }, 'error', 'Erro ao obter URL da mídia', mediaUrlError);
      return 'Desculpe, não foi possível obter o áudio. Por favor, tente novamente.';
    }
    
    // URL pública para armazenamento do áudio (inicialmente a mesma do WhatsApp)
    let publicAudioUrl = mediaUrl;
    let transcription = '';
    
    try {
      // Primeiro, tentar fazer o upload para o Supabase para obter a URL pública
      try {
        // Obter URL pública do Supabase
        if (message.audio?.id) {
          structuredLog({ correlationId, messageId: '', phone: '' }, 'info', '🔄 Processando upload para Supabase...');
          const supabaseUrl = await this.audioProcessor.validateAndProcessAudio(
            mediaUrl,
            message.audio.id,
            message.audio.mime_type,
            message.audio.duration
          );
          
          if (supabaseUrl) {
            publicAudioUrl = supabaseUrl;
            structuredLog({ correlationId, messageId: '', phone: '' }, 'info', '✅ URL pública do Supabase obtida', { publicAudioUrl });
          }
        }
      } catch (supabaseError) {
        structuredLog({ correlationId, messageId: '', phone: '' }, 'warn', '⚠️ Erro ao processar áudio para Supabase, usando URL original', supabaseError);
        // Continuar com a URL original
      }
      
      // Em seguida, tentar fazer a transcrição e o processamento completo
      try {
        structuredLog({ correlationId, messageId: '', phone: '' }, 'info', '🔄 Processando transcrição com Whisper...');
        const response = await this.audioProcessor.processAudioMessage(
          message, 
          conversation.thread_id, 
          mediaUrl,
          correlationId
        );
        
        structuredLog({ correlationId, messageId: '', phone: '' }, 'info', '✅ Áudio processado com sucesso');
        return response;
      } catch (audioProcessingError) {
        // Se o processamento completo falhar, ainda tentar salvar a mensagem de áudio
        structuredLog(
          { correlationId, messageId: '', phone: '' }, 
          'warn', 
          'Erro no processamento de transcrição, salvando apenas o áudio', 
          audioProcessingError
        );
        
        // Salvar a mensagem de áudio sem transcrição
        await this.messageStorage.saveAudioMessage(
          conversation.id,
          message.audio.id,
          publicAudioUrl,
          { 
            duration: message.audio.duration, 
            mimeType: message.audio.mime_type,
            logContext: { correlationId, messageId: message.audio.id, phone: '' }
          }
        );
        
        structuredLog({ correlationId, messageId: '', phone: '' }, 'info', '✅ Mensagem de áudio salva sem transcrição');
        return 'Recebi seu áudio. Infelizmente, não foi possível transcrever o conteúdo. Você pode enviar uma mensagem de texto?';
      }
    } catch (finalError) {
      structuredLog({ correlationId, messageId: '', phone: '' }, 'error', '❌ Erro fatal no processamento de áudio', finalError);
      try {
        // Última tentativa de salvar algo
        await this.messageStorage.saveAudioMessage(
          conversation.id,
          message.audio.id,
          mediaUrl,
          { logContext: { correlationId, messageId: message.audio.id, phone: '' } }
        );
      } catch (saveError) {
        structuredLog({ correlationId, messageId: '', phone: '' }, 'error', '❌ Não foi possível salvar a mensagem de áudio', saveError);
      }
      return 'Desculpe, houve um erro ao processar seu áudio. Por favor, tente novamente mais tarde.';
    }
  }

  /**
   * Processa mensagens de imagem
   */
  private async handleImageMessage(
    message: WhatsAppMessage,
    conversation: conversations,
    correlationId: string
  ): Promise<string> {
    if (!message.image?.id) {
      structuredLog({ correlationId, messageId: '', phone: '' }, 'warn', 'Mensagem de imagem sem ID');
      return 'Desculpe, não foi possível processar a imagem. Por favor, tente novamente.';
    }
    
    structuredLog({ correlationId, messageId: '', phone: '' }, 'info', 'Processando mensagem de imagem...');
    const imageUrl = await this.getCachedMediaUrl(message.image.id, 'image');
    
    // Processar e salvar imagem
    const mediaUrlToSave = await this.imageProcessor.validateAndProcessImage(
      imageUrl,
      message.image.id,
      message.image.mime_type
    );
    
    // Salvar a mensagem de imagem
    const now = adjustTimezoneBR(); // Usando a função de ajuste de fuso horário
    
    const imageMessageData = {
      content: message.image.caption || '',
      sender: 'user',
      read: true,
      type: 'image',
      media_url: mediaUrlToSave,
      external_id: message.image.id,
      created_at: now, // Timestamp com ajuste de fuso horário
      updated_at: now,  // Timestamp com ajuste de fuso horário
      conversations: {
        connect: { id: conversation.id }
      }
    };
    await this.prisma.messages.create({ data: imageMessageData });
    
    return this.imageProcessor.processImageMessage({
      message, 
      threadId: conversation.thread_id, 
      mediaUrl: imageUrl,
      correlationId
    });
  }

  /**
   * Obtém o conteúdo da mensagem para geração de cache key
   */
  private getMessageContent(message: WhatsAppMessage): string {
    switch (message.type) {
      case 'text':
        return `text_${message.text || 'empty'}`;
      case 'image':
        // Use o ID da imagem para garantir unicidade
        return `image_${message.image?.id}_${message.image?.caption || 'no_caption'}`;
      case 'audio':
        // Use o ID do áudio para garantir unicidade
        return `audio_${message.audio?.id || 'unknown'}`;
      default:
        return `${message.type}_${message.timestamp}`;
    }
  }

  /**
   * Obtém a URL de mídia do cache ou da API do WhatsApp
   */
  private async getCachedMediaUrl(mediaId: string, type: string = 'image'): Promise<string> {
    const fetchFn = async () => {
      return await this.whatsappCloud.getMediaUrl(mediaId);
    };
    
    return getCachedMediaUrl(
      mediaId,
      type,
      fetchFn,
      { correlationId: '', messageId: '', phone: '' }
    );
  }

  /**
   * Adiciona uma mensagem enviada pelo operador humano ao thread do OpenAI Assistant
   * @param threadId ID do thread no OpenAI Assistant
   * @param content Conteúdo da mensagem
   * @param correlationId ID de correlação para logging
   * @returns Informação sobre sucesso ou falha da operação
   */
  async addHumanMessageToThread(
    threadId: string,
    content: string,
    correlationId: string = uuidv4()
  ): Promise<{ success: boolean; message: string }> {
    return this.humanMessageHandler.addMessageToThread(threadId, content, correlationId);
  }
} 
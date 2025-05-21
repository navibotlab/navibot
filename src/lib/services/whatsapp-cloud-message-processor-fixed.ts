import { PrismaClient, Prisma, Conversation } from '@prisma/client';
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
  markMessageAsProcessed,
  processedMessagesCache
} from './whatsapp-cloud-cache';
import { WhatsAppCloudConversationManager } from './whatsapp-cloud-conversation';
import { WhatsAppCloudConnection, Agent, Lead } from '@prisma/client';
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
        if (isMessageProcessed(cacheKeys)) {
          structuredLog(logContext, 'info', '🔄 Mensagem já processada anteriormente', { cacheKeys });
          return 'Mensagem já processada anteriormente';
        }

        switch (message.type) {
          case 'text':
            response = await this.handleTextMessage(message, conversation, messageId, correlationId);
            break;

          case 'audio':
            response = await this.handleAudioMessage(message, conversation, correlationId);
            break;

          case 'image':
            response = await this.handleImageMessage(message, conversation, correlationId);
            break;

          default:
            structuredLog(logContext, 'warn', 'Tipo de mensagem não suportado', { type: message.type });
            response = 'Desculpe, este tipo de mensagem não é suportado. Por favor, envie texto, áudio ou imagem.';
        }

        // Salvar e enviar a resposta
        if (response) {
          await this.responseSender.saveAndSendResponse(response, conversation.id, phone, correlationId);
        }

        // No final do processamento bem-sucedido, adicionar ao cache
        if (response) {
          // Adicionar todas as chaves ao cache
          markMessageAsProcessed(cacheKeys);
          
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
    conversation: Conversation,
    messageId: string | undefined,
    correlationId: string
  ): Promise<string> {
    if (!message.text) {
      structuredLog({ correlationId, messageId, phone: '' }, 'warn', 'Mensagem de texto sem conteúdo');
      return 'Por favor, envie uma mensagem com conteúdo.';
    }
    
    structuredLog({ correlationId, messageId, phone: '' }, 'info', 'Processando mensagem de texto...');
    
    // Salvar mensagem de texto usando o messageStorage
    await this.messageStorage.saveTextMessage(
      conversation.id,
      message.text,
      messageId,
      { correlationId, messageId, phone: '' }
    );
    
    return this.textProcessor.processTextMessage(
      message.text, 
      conversation.threadId,
      correlationId
    );
  }

  /**
   * Processa mensagens de áudio
   */
  private async handleAudioMessage(
    message: WhatsAppMessage,
    conversation: Conversation,
    correlationId: string
  ): Promise<string> {
    if (!message.audio?.id) {
      structuredLog({ correlationId, messageId: '', phone: '' }, 'warn', 'Mensagem de áudio sem ID');
      return 'Desculpe, não foi possível processar o áudio. Por favor, tente novamente.';
    }
    
    structuredLog({ correlationId, messageId: '', phone: '' }, 'info', 'Processando mensagem de áudio...');
    const mediaUrl = await this.getCachedMediaUrl(message.audio.id);
    structuredLog({ correlationId, messageId: '', phone: '' }, 'info', 'URL do áudio obtida', { mediaUrl });
    
    // Salvar mensagem de áudio usando o messageStorage
    await this.messageStorage.saveAudioMessage(
      conversation.id,
      message.audio.id,
      mediaUrl,
      { correlationId, messageId: message.audio.id, phone: '' }
    );
    
    return this.audioProcessor.processAudioMessage(
      message, 
      conversation.threadId, 
      mediaUrl,
      correlationId
    );
  }

  /**
   * Processa mensagens de imagem
   */
  private async handleImageMessage(
    message: WhatsAppMessage,
    conversation: Conversation,
    correlationId: string
  ): Promise<string> {
    if (!message.image?.id) {
      structuredLog({ correlationId, messageId: '', phone: '' }, 'warn', 'Mensagem de imagem sem ID');
      return 'Desculpe, não foi possível processar a imagem. Por favor, tente novamente.';
    }
    
    structuredLog({ correlationId, messageId: '', phone: '' }, 'info', 'Processando mensagem de imagem...');
    const imageUrl = await this.getCachedMediaUrl(message.image.id);
    
    // Processar e salvar imagem
    const mediaUrlToSave = await this.imageProcessor.validateAndProcessImage(
      imageUrl,
      message.image.id,
      message.image.mime_type
    );
    
    // Salvar a mensagem de imagem usando o messageStorage
    await this.messageStorage.saveImageMessage(
      conversation.id,
      message.image.caption || '',
      mediaUrlToSave,
      message.image.id,
      { correlationId, messageId: message.image.id, phone: '' }
    );
    
    return this.imageProcessor.processImageMessage({
      message, 
      threadId: conversation.threadId, 
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
        return message.text || 'Mensagem de texto vazia';
      case 'image':
        return message.image?.caption || 'Imagem recebida';
      case 'audio':
        return 'Mensagem de áudio recebida';
      default:
        return `Mensagem do tipo ${message.type} recebida`;
    }
  }

  /**
   * Obtém a URL de mídia do cache ou da API do WhatsApp
   */
  private async getCachedMediaUrl(mediaId: string): Promise<string> {
    return getCachedMediaUrl(
      mediaId, 
      () => this.whatsappCloud.getMediaUrl(mediaId),
      { correlationId: '', messageId: '', phone: '' }
    );
  }
} 
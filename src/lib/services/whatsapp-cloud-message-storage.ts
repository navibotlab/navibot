import { PrismaClient, Prisma } from '@prisma/client';
import { structuredLog } from './whatsapp-cloud-logger';

// Interface simplificada do logger
export interface SimpleLogger {
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
}

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
 * Classe responsável por gerenciar o armazenamento de mensagens do WhatsApp Cloud
 */
export class WhatsAppCloudMessageStorage {
  private prisma: PrismaClient;
  private logger: SimpleLogger;
  private messageCache: Set<string> = new Set();

  constructor(prisma: PrismaClient, logger: SimpleLogger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  /**
   * Verifica se uma mensagem já foi processada anteriormente
   * @param messageId ID da mensagem a ser verificada
   * @returns Verdadeiro se a mensagem já foi processada
   */
  public async isMessageProcessed(messageId: string): Promise<boolean> {
    // Verificar primeiro no cache de memória
    if (this.messageCache.has(messageId)) {
      return true;
    }
    
    // Se não estiver no cache, verificar no banco de dados
    const message = await this.prisma.messages.findFirst({
      where: {
        external_id: messageId
      }
    });
    
    // Se a mensagem existir, adicionar ao cache
    if (message) {
      this.messageCache.add(messageId);
      return true;
    }
    
    return false;
  }

  /**
   * Salva uma mensagem de texto no banco de dados
   * @param conversationId ID da conversa
   * @param content Conteúdo da mensagem
   * @param messageId ID externo da mensagem
   * @param logContext Contexto para logging
   * @returns A mensagem criada
   */
  public async saveTextMessage(conversationId: string, content: string, messageId: string | undefined, logContext: any = {}) {
    // Usar timestamp ajustado para compensar a conversão automática para UTC
    const now = adjustTimezoneBR();
    
    const messageData = {
      conversation_id: conversationId,
      content,
      sender: 'user',
      read: true,
      type: 'text',
      external_id: messageId,
      created_at: now, // Timestamp com ajuste de fuso horário
      updated_at: now  // Timestamp com ajuste de fuso horário
    };

    this.logger.info(`Salvando mensagem de texto: ${messageId}`, logContext);
    const message = await this.prisma.messages.create({ data: messageData });
    
    // Adicionar ao cache de memória
    if (messageId) {
      this.messageCache.add(messageId);
    }
    
    return message;
  }

  /**
   * Salva uma mensagem de imagem no banco de dados
   * @param conversationId ID da conversa
   * @param caption Legenda da imagem (opcional)
   * @param mediaUrl URL da mídia
   * @param messageId ID externo da mensagem
   * @param logContext Contexto para logging
   * @returns A mensagem criada
   */
  public async saveImageMessage(
    conversationId: string,
    caption: string = '',
    mediaUrl: string,
    messageId: string,
    logContext: any = {}
  ) {
    // Usar timestamp ajustado para compensar a conversão automática para UTC
    const now = adjustTimezoneBR();
    
    const messageData = {
      conversation_id: conversationId,
      content: caption,
      sender: 'user',
      read: true,
      type: 'image',
      media_url: mediaUrl,
      external_id: messageId,
      created_at: now, // Timestamp com ajuste de fuso horário
      updated_at: now  // Timestamp com ajuste de fuso horário
    };

    this.logger.info(`Salvando mensagem de imagem: ${messageId}`, logContext);
    const message = await this.prisma.messages.create({ data: messageData });
    
    // Adicionar ao cache de memória
    if (messageId) {
      this.messageCache.add(messageId);
    }
    
    return message;
  }

  /**
   * Salva uma mensagem de áudio no banco de dados
   * @param conversationId ID da conversa
   * @param messageId ID externo da mensagem
   * @param mediaUrl URL da mídia
   * @param logContextOrOptions Contexto para logging ou opções adicionais
   * @returns A mensagem criada
   */
  public async saveAudioMessage(
    conversationId: string,
    messageId: string,
    mediaUrl: string,
    logContextOrOptions: any = {}
  ) {
    // Verificar se estamos recebendo options ou apenas logContext
    let mediaDuration = null;
    let mediaType = 'audio/ogg'; 
    let logContext = logContextOrOptions;
    
    // Se o parâmetro for um objeto com duration ou mimeType, é o novo formato
    if (logContextOrOptions && 
       (logContextOrOptions.duration !== undefined || 
        logContextOrOptions.mimeType !== undefined)) {
      mediaDuration = logContextOrOptions.duration || null;
      mediaType = logContextOrOptions.mimeType || 'audio/ogg';
      logContext = logContextOrOptions.logContext || {};
    }

    // Usar timestamp ajustado para compensar a conversão automática para UTC
    const now = adjustTimezoneBR();

    const messageData: any = {
      conversation_id: conversationId,
      content: '',
      sender: 'user',
      read: true,
      type: 'audio',
      media_url: mediaUrl,
      external_id: messageId,
      created_at: now, // Timestamp com ajuste de fuso horário
      updated_at: now  // Timestamp com ajuste de fuso horário
    };
    
    // Adicionar campos com os nomes corretos do Prisma, apenas se tiverem valores
    if (mediaDuration !== null && mediaDuration !== undefined) {
      // Converter para número se for string
      const durationValue = typeof mediaDuration === 'string' 
        ? parseInt(mediaDuration, 10) 
        : mediaDuration;
        
      if (!isNaN(durationValue)) {
        messageData.media_duration = durationValue;
      }
    }
    
    if (mediaType) {
      messageData.media_type = mediaType;
    }

    this.logger.info(`Salvando mensagem de áudio: ${messageId}`, logContext);
    const message = await this.prisma.messages.create({ data: messageData });
    
    // Adicionar ao cache de memória
    if (messageId) {
      this.messageCache.add(messageId);
    }
    
    return message;
  }

  /**
   * Salva uma mensagem de resposta (assistente) no banco de dados
   * @param conversationId ID da conversa
   * @param content Conteúdo da mensagem
   * @returns A mensagem criada
   */
  public async saveAssistantMessage(conversationId: string, content: string) {
    // Usar timestamp ajustado para compensar a conversão automática para UTC
    const now = adjustTimezoneBR();
    
    const messageData = {
      conversation_id: conversationId,
      content,
      sender: 'assistant',
      read: false,
      type: 'text',
      created_at: now, // Timestamp com ajuste de fuso horário
      updated_at: now  // Timestamp com ajuste de fuso horário
    };

    this.logger.info(`Salvando mensagem do assistente para a conversa ${conversationId}`);
    return await this.prisma.messages.create({ data: messageData });
  }
  
  /**
   * Salva uma resposta do agente no banco de dados
   * @param conversationId ID da conversa
   * @param content Conteúdo da mensagem
   * @param messageId ID externo da mensagem (opcional)
   * @param logContext Contexto para logging (opcional)
   * @returns A mensagem criada
   */
  public async saveAgentResponse(
    conversationId: string,
    content: string,
    messageId?: string,
    logContext: any = {}
  ) {
    // Usar timestamp ajustado para compensar a conversão automática para UTC
    const now = adjustTimezoneBR();
    
    const messageData = {
      conversation_id: conversationId,
      content,
      sender: 'assistant',
      read: true,
      type: 'text',
      external_id: messageId,
      created_at: now, // Timestamp com ajuste de fuso horário
      updated_at: now  // Timestamp com ajuste de fuso horário
    };

    this.logger.info(`Salvando resposta do agente: ${messageId || 'sem ID'}`, logContext);
    const message = await this.prisma.messages.create({ data: messageData });
    
    // Adicionar ao cache de memória se tiver ID
    if (messageId) {
      this.messageCache.add(messageId);
    }
    
    return message;
  }
} 
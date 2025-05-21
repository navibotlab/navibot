/**
 * API Unificada do WhatsApp Cloud
 * 
 * Este módulo contém a implementação unificada das funcionalidades do WhatsApp Cloud API,
 * consolidando as duas interfaces anteriores (WhatsAppCloudAPI e WhatsAppCloudApiService)
 * em uma única implementação para manter a consistência e facilitar a manutenção.
 * 
 * As classes originais foram mantidas como wrappers desta implementação unificada
 * para garantir compatibilidade com o código existente.
 * 
 * @see WhatsAppCloudApiService em whatsapp-cloud-api.ts
 * @see WhatsAppCloudAPI em whatsapp-cloud.ts
 */

import { PrismaClient } from '@prisma/client';
import { WhatsAppCloudCore, WhatsAppMessageParams, WhatsAppMessageResult } from './whatsapp-cloud-unified';
import { structuredLog, LogContext } from './whatsapp-cloud-logger';

interface SendMessageParams {
  recipient: string;
  message: string;
  type?: 'text' | 'media' | 'document' | 'template';
  mediaUrl?: string;
  mediaType?: string;
  documentUrl?: string;
  documentName?: string;
  templateName?: string;
  languageCode?: string;
  components?: any[];
}

export class WhatsAppCloudAPIUnified extends WhatsAppCloudCore {
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly prisma?: PrismaClient;
  private readonly INTER_BLOCK_DELAY = 1000; // 1 segundo entre blocos

  constructor(accessToken: string, phoneNumberId: string, prisma?: PrismaClient) {
    super();
    
    if (!accessToken) {
      throw new Error('Token de acesso não fornecido');
    }
    if (!phoneNumberId) {
      throw new Error('ID do número de telefone não fornecido');
    }
    
    // Remover possíveis espaços em branco e garantir formato correto
    const token = accessToken.trim();
    this.accessToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    this.phoneNumberId = phoneNumberId.trim();
    this.prisma = prisma;
  }

  private validateToken() {
    if (!this.accessToken || this.accessToken.length < 16) { // "Bearer " + pelo menos 10 caracteres
      throw new Error('Token de acesso inválido');
    }
  }

  // Extrair o token sem o prefixo "Bearer "
  private getTokenWithoutPrefix(): string {
    return this.accessToken.startsWith('Bearer ') 
      ? this.accessToken.substring(7) 
      : this.accessToken;
  }

  // Sobrescrita do método da classe base para compatibilidade
  async sendMessage(params: WhatsAppMessageParams): Promise<WhatsAppMessageResult>;
  // Novo método com parâmetros específicos desta implementação
  async sendMessage(params: SendMessageParams): Promise<WhatsAppMessageResult>;
  // Implementação unificada
  async sendMessage(params: any): Promise<WhatsAppMessageResult> {
    try {
      this.validateToken();
      
      // Se estiver no formato da interface base (WhatsAppMessageParams)
      if ('phoneNumberId' in params && 'accessToken' in params && 'to' in params && 'messageType' in params) {
        return super.sendMessage(params);
      }

      const logContext: LogContext = {
        correlationId: '',
        messageId: '',
        phone: params.recipient,
        type: 'general'
      };
      
      structuredLog(logContext, 'info', '[WhatsAppCloudAPI] Enviando mensagem:', {
        recipientLength: params.recipient.length,
        messageType: params.type,
        hasMedia: !!params.mediaUrl,
        hasDocument: !!params.documentUrl,
        hasTemplate: !!params.templateName
      });

      // Transformar os parâmetros para o formato unificado
      let messageType = 'text';
      const content: any = {};

      // Configurar o tipo de mensagem e conteúdo
      switch (params.type) {
        case 'media':
          if (params.mediaType === 'image' || !params.mediaType) {
            messageType = 'image';
          } else {
            messageType = params.mediaType as any;
          }
          content.url = params.mediaUrl;
          content.caption = params.message;
          break;
        case 'document':
          messageType = 'document';
          content.url = params.documentUrl;
          content.caption = params.message;
          content.filename = params.documentName;
          break;
        case 'template':
          messageType = 'template';
          content.templateName = params.templateName;
          content.languageCode = params.languageCode;
          content.components = params.components;
          break;
        default:
          messageType = 'text';
          content.body = params.message;
      }

      return await super.sendMessage({
        phoneNumberId: this.phoneNumberId,
        accessToken: this.getTokenWithoutPrefix(),
        to: params.recipient,
        messageType: messageType as any,
        content
      });
    } catch (error) {
      const logContext: LogContext = {
        correlationId: '',
        messageId: '',
        phone: params.recipient || '',
        type: 'general'
      };
      structuredLog(logContext, 'error', '[WhatsAppCloudAPI] Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async sendText(recipient: string, message: string) {
    try {
      // Divide a mensagem em blocos se necessário
      const messageBlocks = this.splitMessageIntoBlocks(message);
      const logContext: LogContext = {
        correlationId: '',
        messageId: '',
        phone: recipient,
        type: 'general'
      };
      
      structuredLog(logContext, 'info', `[WhatsAppCloudAPI] Mensagem dividida em ${messageBlocks.length} blocos`);

      let lastResult;
      // Envia cada bloco como uma mensagem separada
      for (const block of messageBlocks) {
        structuredLog(logContext, 'info', `[WhatsAppCloudAPI] Enviando bloco de ${block.length} caracteres...`);

        lastResult = await this.sendMessage({
          recipient,
          message: block,
          type: 'text'
        });

        // Adiciona um pequeno delay entre as mensagens para manter a ordem
        if (messageBlocks.length > 1) {
          await new Promise(resolve => setTimeout(resolve, this.INTER_BLOCK_DELAY));
        }
      }

      return lastResult;
    } catch (error) {
      const logContext: LogContext = {
        correlationId: '',
        messageId: '',
        phone: recipient,
        type: 'general'
      };
      structuredLog(logContext, 'error', '[WhatsAppCloudAPI] Erro ao enviar mensagem de texto:', error);
      throw error;
    }
  }

  async sendMedia(recipient: string, mediaUrl: string, caption: string = '', mediaType: string = 'image') {
    return this.sendMessage({
      recipient,
      message: caption,
      type: 'media',
      mediaUrl,
      mediaType
    });
  }

  async sendDocument(recipient: string, documentUrl: string, documentName: string, caption: string = '') {
    return this.sendMessage({
      recipient,
      message: caption,
      type: 'document',
      documentUrl,
      documentName
    });
  }

  async sendTemplate(recipient: string, templateName: string, languageCode: string, components: any[] = []) {
    return this.sendMessage({
      recipient,
      message: '',
      type: 'template',
      templateName,
      languageCode,
      components
    });
  }

  async markAsRead(messageId: string) {
    try {
      this.validateToken();
      return await super.markMessageAsRead(
        this.phoneNumberId, 
        this.getTokenWithoutPrefix(), 
        messageId
      );
    } catch (error) {
      const logContext: LogContext = {
        correlationId: '',
        messageId,
        phone: '',
        type: 'general'
      };
      structuredLog(logContext, 'error', '[WhatsAppCloudAPI] Erro ao marcar mensagem como lida:', error);
      throw error;
    }
  }

  async getMediaUrl(mediaId: string): Promise<string> {
    try {
      this.validateToken();
      return await super.getMediaUrl(
        this.phoneNumberId, 
        this.accessToken, // Mantém o prefixo Bearer aqui pois o método base espera neste formato
        mediaId
      );
    } catch (error) {
      const logContext: LogContext = {
        correlationId: '',
        messageId: mediaId,
        phone: '',
        type: 'general'
      };
      structuredLog(logContext, 'error', '[WhatsAppCloudAPI] Erro ao obter URL da mídia:', error);
      throw error;
    }
  }

  async downloadMedia(mediaId: string): Promise<Buffer> {
    try {
      this.validateToken();
      
      // Primeiro obter a URL
      const mediaUrl = await this.getMediaUrl(mediaId);
      
      // Em seguida, baixar o conteúdo
      return await super.downloadMedia(
        mediaUrl, 
        this.getTokenWithoutPrefix()
      );
    } catch (error) {
      const logContext: LogContext = {
        correlationId: '',
        messageId: mediaId,
        phone: '',
        type: 'general'
      };
      structuredLog(logContext, 'error', '[WhatsAppCloudAPI] Erro ao baixar mídia:', error);
      throw error;
    }
  }
} 
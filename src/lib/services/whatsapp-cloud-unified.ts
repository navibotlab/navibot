/**
 * Implementação unificada das APIs do WhatsApp Cloud
 * 
 * Este módulo contém a implementação compartilhada das funcionalidades do WhatsApp,
 * servindo como base para as duas interfaces públicas (WhatsAppCloudAPI e WhatsAppCloudApiService).
 * 
 * IMPORTANTE: Este módulo NÃO deve ser importado diretamente pelos consumidores.
 * Use sempre um dos módulos originais: whatsapp-cloud.ts ou whatsapp-cloud-api.ts
 */

import axios from 'axios';
import { structuredLog, LogContext } from './whatsapp-cloud-logger';

// Interfaces
export interface WhatsAppMessageResult {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export interface WhatsAppMessageParams {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  messageType: 'text' | 'image' | 'audio' | 'document' | 'video' | 'template';
  content: any;
}

/**
 * Implementação compartilhada das funcionalidades do WhatsApp Cloud API
 */
export class WhatsAppCloudCore {
  protected baseUrl = 'https://graph.facebook.com/v19.0';

  /**
   * Prepara o token de acesso no formato correto
   */
  protected formatAccessToken(token: string): string {
    return token.startsWith('Bearer ') ? token.slice(7) : token;
  }

  /**
   * Divide uma mensagem longa em blocos menores
   */
  protected splitMessageIntoBlocks(message: string, maxLength: number = 1000): string[] {
    if (!message || message.length <= maxLength) {
      return [message];
    }

    const blocks: string[] = [];
    let currentBlock = '';
    
    // Divide o texto em linhas
    const lines = message.split('\n');
    
    for (const line of lines) {
      // Se a linha atual + bloco atual exceder o tamanho máximo
      if (currentBlock.length + line.length + 1 > maxLength) {
        // Se o bloco atual não estiver vazio, adiciona aos blocos
        if (currentBlock) {
          blocks.push(currentBlock.trim());
          currentBlock = '';
        }
        
        // Se a linha for muito grande, divide em partes menores
        if (line.length > maxLength) {
          const parts = line.match(new RegExp(`.{1,${maxLength}}`, 'g')) || [];
          parts.forEach(part => blocks.push(part.trim()));
        } else {
          currentBlock = line;
        }
      } else {
        // Adiciona a linha ao bloco atual
        currentBlock = currentBlock ? `${currentBlock}\n${line}` : line;
      }
    }
    
    // Adiciona o último bloco se houver
    if (currentBlock) {
      blocks.push(currentBlock.trim());
    }
    
    return blocks;
  }

  /**
   * Envia mensagem para a API do WhatsApp
   */
  async sendMessage(params: WhatsAppMessageParams): Promise<WhatsAppMessageResult> {
    const { phoneNumberId, accessToken, to, messageType, content } = params;
    
    let payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: messageType
    };
    
    // Configurar payload baseado no tipo de mensagem
    switch (messageType) {
      case 'text':
        payload.text = { body: content.body };
        break;
      case 'template':
        payload.template = {
          name: content.templateName,
          language: {
            code: content.languageCode
          },
          components: content.components
        };
        break;
      case 'image':
      case 'video':
      case 'audio':
      case 'document':
        payload[messageType] = {
          link: content.url,
          caption: content.caption
        };
        break;
    }
    
    try {
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/${phoneNumberId}/messages`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: payload
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Erro no envio da mensagem: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Marca uma mensagem como lida
   */
  async markMessageAsRead(phoneNumberId: string, accessToken: string, messageId: string): Promise<any> {
    try {
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/${phoneNumberId}/messages`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        }
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Erro ao marcar mensagem como lida: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Obtém a URL de mídia
   */
  protected async getMediaUrl(phoneNumberId: string, accessToken: string, mediaId: string): Promise<string> {
    try {
      const logContext: LogContext = { 
        correlationId: '', 
        messageId: mediaId, 
        phone: '', 
        type: 'general' 
      };
      structuredLog(logContext, 'info', '🔍 Obtendo URL de mídia:', { mediaId });
      
      const response = await fetch(
        `${this.baseUrl}/${mediaId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': accessToken
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        structuredLog(logContext, 'error', '❌ Erro ao obter URL de mídia:', error);
        throw new Error(error.error?.message || 'Erro ao obter URL de mídia');
      }

      const result = await response.json();
      structuredLog(logContext, 'info', '✅ URL de mídia obtida com sucesso');
      
      return result.url;
    } catch (error) {
      const logContext: LogContext = { 
        correlationId: '', 
        messageId: mediaId, 
        phone: '', 
        type: 'general' 
      };
      structuredLog(logContext, 'error', '❌ Erro ao obter URL de mídia:', error);
      throw error;
    }
  }

  /**
   * Baixa o conteúdo de mídia
   */
  async downloadMedia(mediaUrl: string, accessToken: string): Promise<Buffer> {
    try {
      const response = await axios({
        method: 'GET',
        url: mediaUrl,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        responseType: 'arraybuffer'
      });
      
      return Buffer.from(response.data);
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Erro ao baixar mídia: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
} 
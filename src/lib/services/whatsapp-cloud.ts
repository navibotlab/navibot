import { WhatsAppCloudAPIUnified } from './whatsapp-cloud-api-unified';

export class WhatsAppCloudAPI {
  private api: WhatsAppCloudAPIUnified;

  constructor(phoneNumberId: string, accessToken: string) {
    this.api = new WhatsAppCloudAPIUnified(accessToken, phoneNumberId);
  }

  async sendTextMessage(to: string, message: string) {
    try {
      return await this.api.sendText(to, message);
    } catch (error) {
      console.error('[WhatsApp Cloud API] Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async sendTemplate(to: string, templateName: string, languageCode: string, components: any[]) {
    try {
      return await this.api.sendTemplate(to, templateName, languageCode, components);
    } catch (error) {
      console.error('[WhatsApp Cloud API] Erro ao enviar template:', error);
      throw error;
    }
  }

  async sendMedia(to: string, mediaType: 'image' | 'video' | 'document', mediaUrl: string, caption?: string) {
    try {
      return await this.api.sendMedia(to, mediaUrl, caption || '', mediaType);
    } catch (error) {
      console.error('[WhatsApp Cloud API] Erro ao enviar mídia:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: string) {
    try {
      return await this.api.markAsRead(messageId);
    } catch (error) {
      console.error('[WhatsApp Cloud API] Erro ao marcar mensagem como lida:', error);
      throw error;
    }
  }
} 
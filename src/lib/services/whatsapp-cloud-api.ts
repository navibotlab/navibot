import { WhatsAppCloudAPIUnified } from './whatsapp-cloud-api-unified';

export class WhatsAppCloudApiService {
  private api: WhatsAppCloudAPIUnified;

  constructor(accessToken: string, phoneNumberId: string) {
    this.api = new WhatsAppCloudAPIUnified(accessToken, phoneNumberId);
  }

  async sendText(recipient: string, message: string) {
    return this.api.sendText(recipient, message);
  }

  async sendMedia(recipient: string, mediaUrl: string, caption: string) {
    return this.api.sendMedia(recipient, mediaUrl, caption);
  }

  async sendDocument(recipient: string, documentUrl: string, documentName: string) {
    return this.api.sendDocument(recipient, documentUrl, documentName);
  }

  async markAsRead(messageId: string) {
    return this.api.markAsRead(messageId);
  }

  async getMediaUrl(mediaId: string): Promise<string> {
    return this.api.getMediaUrl(mediaId);
  }

  async downloadMedia(mediaId: string): Promise<Buffer> {
    return this.api.downloadMedia(mediaId);
  }
} 
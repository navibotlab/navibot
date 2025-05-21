/**
 * Tipos para as mensagens do WhatsApp Cloud API
 */

export interface WhatsAppCloudTextMessage {
  messaging_product: string;
  contacts: Array<{
    profile: {
      name: string;
    };
    wa_id: string;
  }>;
  messages: Array<{
    from: string;
    id: string;
    timestamp: string;
    text: {
      body: string;
    };
    type: 'text';
  }>;
}

export interface WhatsAppCloudImageMessage {
  messaging_product: string;
  contacts: Array<{
    profile: {
      name: string;
    };
    wa_id: string;
  }>;
  messages: Array<{
    from: string;
    id: string;
    timestamp: string;
    image: {
      caption?: string;
      mime_type: string;
      sha256: string;
      id: string;
    };
    type: 'image';
  }>;
}

export interface WhatsAppCloudAudioMessage {
  messaging_product: string;
  contacts: Array<{
    profile: {
      name: string;
    };
    wa_id: string;
  }>;
  messages: Array<{
    from: string;
    id: string;
    timestamp: string;
    audio: {
      mime_type: string;
      sha256: string;
      id: string;
      voice: boolean;
    };
    type: 'audio';
  }>;
}

export type WhatsAppCloudMessage = 
  | WhatsAppCloudTextMessage
  | WhatsAppCloudImageMessage
  | WhatsAppCloudAudioMessage;

export type WhatsAppCloudMessageType = 'text' | 'image' | 'audio';

export interface WhatsAppImageData {
  caption?: string;
  mime_type: string;
  sha256: string;
  id: string;
}

export interface WhatsAppAudioData {
  mime_type: string;
  sha256: string;
  id: string;
  voice: boolean;
}

export interface WhatsAppTextData {
  body: string;
}

export interface ProcessedWhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  type: WhatsAppCloudMessageType;
  text?: string;
  image?: WhatsAppImageData;
  audio?: WhatsAppAudioData;
} 
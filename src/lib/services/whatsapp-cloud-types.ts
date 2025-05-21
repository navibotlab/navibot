import { Prisma } from '@prisma/client';

/**
 * Tipos e interfaces compartilhados para os serviços do WhatsApp Cloud.
 * Este módulo centraliza as definições de tipos para evitar duplicação e
 * facilitar a manutenção.
 */

/**
 * Parâmetros de entrada para o processamento de mensagens
 */
export interface ProcessMessageParams {
  leadId: string;
  message: WhatsAppMessage;
  connectionId: string;
  messageId?: string;
  phone: string;
}

/**
 * Estrutura de uma mensagem do WhatsApp Cloud
 */
export interface WhatsAppMessage {
  type: string;
  text?: string;
  timestamp: string;
  image?: WhatsAppImageMessage;
  audio?: WhatsAppAudioMessage;
}

/**
 * Estrutura de uma mensagem de imagem do WhatsApp
 */
export interface WhatsAppImageMessage {
  id: string;
  caption?: string;
  mime_type?: string;
  url?: string;
}

/**
 * Estrutura de uma mensagem de áudio do WhatsApp
 */
export interface WhatsAppAudioMessage {
  id: string;
  mime_type?: string;
  voice?: boolean;
  duration?: number;
}

/**
 * Conteúdo de uma mensagem de texto para o chat do OpenAI
 */
export interface ChatMessageContent {
  type: 'text';
  text: string;
}

/**
 * Conteúdo de imagem via URL para o chat do OpenAI
 */
export interface ImageUrlContent {
  type: 'image_url';
  image_url: {
    url: string;
    detail: 'low' | 'high' | 'auto';
  };
}

/**
 * Tipo de conteúdo para o chat do OpenAI
 */
export type ChatContent = ChatMessageContent | ImageUrlContent;

/**
 * Mensagem completa para o chat do OpenAI
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: ChatContent[];
}

/**
 * Estrutura do objeto de conexão com o WhatsApp Cloud
 */
export interface WhatsAppCloudConnectionWithAgent {
  id: string;
  phoneNumberId: string;
  accessToken: string;
  agentId: string;
  workspaceId: string;
  status: string;
  assistant_id: string;
}

/**
 * Dados para criação de uma nova conversa
 */
export interface ConversationCreateInput {
  threadId: string;
  leadId: string;
  workspaceId: string;
}

/**
 * Dados para criação de uma mensagem
 */
export interface MessageCreateInput {
  conversationId: string;
  content: string;
  sender?: string;
  read?: boolean;
  type?: string;
  mediaUrl?: string;
  external_id?: string;
}

// Tipos do Prisma para mensagens
export type MessageUncheckedCreateInput = Prisma.MessageUncheckedCreateInput;
export type MessageWhereInput = Prisma.MessageWhereInput;

/**
 * Tipos MIME permitidos para imagens
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

/**
 * Tipos MIME permitidos para áudios
 */
export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/ogg',
  'audio/mpeg',
  'audio/mp4',
  'audio/webm',
  'audio/wav'
];

/**
 * Tipos de mensagem suportados
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio'
}

/**
 * Origem da mensagem (quem enviou)
 */
export enum MessageSender {
  USER = 'user',
  AGENT = 'agent',
  SYSTEM = 'system'
} 
import { CACHE_KEY_PREFIXES } from './whatsapp-cloud-constants';

/**
 * Classe responsável por gerar chaves de cache padronizadas para os diversos
 * elementos do sistema WhatsApp Cloud API.
 * 
 * Esta classe centraliza a lógica de geração de chaves para evitar inconsistências
 * e facilitar a manutenção.
 */
export class WhatsAppCloudCacheKeyGenerator {
  /**
   * Gera uma chave de cache para mensagens
   * @param messageId ID da mensagem do WhatsApp
   * @returns Chave de cache formatada
   */
  static getMessageKey(messageId: string): string {
    return `${CACHE_KEY_PREFIXES.MESSAGE}${messageId}`;
  }

  /**
   * Gera uma chave de cache para imagens
   * @param imageId ID da imagem do WhatsApp
   * @returns Chave de cache formatada
   */
  static getImageKey(imageId: string): string {
    return `${CACHE_KEY_PREFIXES.IMAGE}${imageId}`;
  }

  /**
   * Gera uma chave de cache para áudios
   * @param audioId ID do áudio do WhatsApp
   * @returns Chave de cache formatada
   */
  static getAudioKey(audioId: string): string {
    return `${CACHE_KEY_PREFIXES.AUDIO}${audioId}`;
  }

  /**
   * Gera uma chave de cache para conversas
   * @param conversationId ID da conversa
   * @returns Chave de cache formatada
   */
  static getConversationKey(conversationId: string): string {
    return `${CACHE_KEY_PREFIXES.CONVERSATION}${conversationId}`;
  }

  /**
   * Gera uma chave de cache composta para mensagens de mídia
   * @param type Tipo de mídia ('image', 'audio', etc)
   * @param mediaId ID da mídia
   * @returns Chave de cache formatada
   */
  static getMediaKey(type: string, mediaId: string): string {
    const prefix = type === 'image' 
      ? CACHE_KEY_PREFIXES.IMAGE 
      : type === 'audio' 
        ? CACHE_KEY_PREFIXES.AUDIO 
        : CACHE_KEY_PREFIXES.MESSAGE;
    
    return `${prefix}${mediaId}`;
  }
  
  /**
   * Gera uma chave de cache para verificação de duplicidade
   * @param messageId ID da mensagem do WhatsApp
   * @param timestamp Timestamp da mensagem
   * @returns Chave de cache formatada
   */
  static getDuplicityCheckKey(messageId: string, timestamp?: string): string {
    const baseKey = `${CACHE_KEY_PREFIXES.MESSAGE}${messageId}`;
    return timestamp ? `${baseKey}:${timestamp}` : baseKey;
  }
} 
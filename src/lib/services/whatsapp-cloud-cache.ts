/**
 * Sistema de cache centralizado para os serviços do WhatsApp Cloud API
 * 
 * Este módulo centraliza todos os caches utilizados pelos processadores
 * de mensagens do WhatsApp, evitando duplicação e garantindo consistência.
 */

import NodeCache from 'node-cache';
import { LRUCache } from 'lru-cache';
import { structuredLog, LogContext } from './whatsapp-cloud-logger';
import { TIME_CONSTANTS } from './whatsapp-cloud-constants';
import { WhatsAppCloudCacheKeyGenerator } from './whatsapp-cloud-cache-key-generator';

// Cache para URLs de mídia
export const mediaUrlCache = new NodeCache({ stdTTL: TIME_CONSTANTS.MESSAGE_PROCESSING_WAIT / 1000 });

// Cache para imagens processadas
export const imageCache = new NodeCache({ stdTTL: TIME_CONSTANTS.IMAGE_CACHE_TTL });

// Cache para áudios processados
export const audioCache = new NodeCache({ stdTTL: TIME_CONSTANTS.IMAGE_CACHE_TTL });

// Cache para textos processados
export const textCache = new Map<string, string>();

// Cache LRU para mensagens já processadas
export const processedMessagesCache = new LRUCache<string, boolean>({
  max: 1000,
  ttl: TIME_CONSTANTS.PROCESSED_MESSAGES_TTL
});

/**
 * Obtém uma URL de mídia do cache ou da origem, salvando no cache quando obtida
 * 
 * @param mediaId ID da mídia a ser obtida
 * @param mediaType Tipo de mídia ('image', 'audio', etc)
 * @param fetchFn Função que obtém a URL da origem quando não está no cache
 * @param context Contexto para log (opcional)
 * @returns URL da mídia
 */
export async function getCachedMediaUrl(
  mediaId: string,
  mediaType: string,
  fetchFn: () => Promise<string>,
  context?: Partial<LogContext>
): Promise<string> {
  const cacheKey = WhatsAppCloudCacheKeyGenerator.getMediaKey(mediaType, mediaId);
  const cachedUrl = mediaUrlCache.get<string>(cacheKey);
  
  if (cachedUrl) {
    if (context && context.correlationId) {
      structuredLog({ 
        correlationId: context.correlationId, 
        messageId: context.messageId || '', 
        phone: context.phone || '',
        type: 'general' 
      }, 'info', '📥 URL encontrada no cache:', { mediaId, mediaType, cacheKey });
    } else {
      console.log('📥 URL encontrada no cache:', mediaId, mediaType, cacheKey);
    }
    return cachedUrl;
  }

  if (context && context.correlationId) {
    structuredLog({ 
      correlationId: context.correlationId, 
      messageId: context.messageId || '', 
      phone: context.phone || '',
      type: 'general' 
    }, 'info', '🔄 Obtendo URL da mídia:', { mediaId, mediaType });
  } else {
    console.log('🔄 Obtendo URL da mídia:', mediaId, mediaType);
  }
  
  // Obter URL da origem
  const url = await fetchFn();
  
  // Salvar no cache
  mediaUrlCache.set(cacheKey, url);
  
  return url;
}

/**
 * Verifica se uma mensagem já foi processada, usando diferentes chaves de identificação
 * 
 * @param messageId ID principal da mensagem
 * @param additionalIds IDs adicionais, como audioId ou imageId
 * @param timestamp Timestamp opcional da mensagem
 * @returns true se a mensagem já foi processada, false caso contrário
 */
export function isMessageProcessed(
  messageId: string, 
  additionalIds: { type: string, id: string }[] = [],
  timestamp?: string
): boolean {
  // Verificar pelo ID principal da mensagem
  const messageKey = WhatsAppCloudCacheKeyGenerator.getDuplicityCheckKey(messageId, timestamp);
  if (processedMessagesCache.get(messageKey)) {
    return true;
  }
  
  // Verificar pelos IDs adicionais
  for (const { type, id } of additionalIds) {
    const mediaKey = WhatsAppCloudCacheKeyGenerator.getMediaKey(type, id);
    if (processedMessagesCache.get(mediaKey)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Marca uma mensagem como processada
 * 
 * @param messageId ID principal da mensagem
 * @param additionalIds IDs adicionais, como audioId ou imageId
 * @param timestamp Timestamp opcional da mensagem
 */
export function markMessageAsProcessed(
  messageId: string, 
  additionalIds: { type: string, id: string }[] = [],
  timestamp?: string
): void {
  // Marcar o ID principal da mensagem
  const messageKey = WhatsAppCloudCacheKeyGenerator.getDuplicityCheckKey(messageId, timestamp);
  processedMessagesCache.set(messageKey, true);
  
  // Marcar os IDs adicionais
  for (const { type, id } of additionalIds) {
    const mediaKey = WhatsAppCloudCacheKeyGenerator.getMediaKey(type, id);
    processedMessagesCache.set(mediaKey, true);
  }
}

/**
 * Limpa todos os caches
 */
export function clearAllCaches(): void {
  mediaUrlCache.flushAll();
  imageCache.flushAll();
  audioCache.flushAll();
  textCache.clear();
  processedMessagesCache.clear();
} 
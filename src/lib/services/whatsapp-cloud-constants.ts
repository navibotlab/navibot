/**
 * Arquivo de constantes para os serviços do WhatsApp Cloud.
 * Este arquivo centraliza todas as constantes utilizadas nos serviços
 * para facilitar a manutenção e evitar duplicação.
 */

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
 * Configurações de timeouts e delays
 */
export const TIME_CONSTANTS = {
  // Delays para simular comportamento humano
  BLOCK_DELAY: 3000, // 3 segundos entre blocos de mensagem
  MIN_RESPONSE_DELAY: 7000, // Mínimo de 7 segundos antes de enviar resposta
  MAX_RESPONSE_DELAY: 12000, // Máximo de 12 segundos antes de enviar resposta
  
  // Timeouts para operações assíncronas
  THREAD_CHECK_INTERVAL: 2000, // 2 segundos para verificar status da thread
  MESSAGE_PROCESSING_WAIT: 1000, // 1 segundo para processamento de mensagem
  
  // Timeouts para idade das mensagens
  MAX_MESSAGE_AGE_SECONDS: 900, // 15 minutos (usado no WhatsAppCloudMessageDuplicityChecker)
  
  // Cache timeouts
  IMAGE_CACHE_TTL: 3600, // 1 hora para cache de imagens
  PROCESSED_MESSAGES_TTL: 86400, // 24 horas para cache de mensagens processadas
};

/**
 * Limites e configurações de tamanho
 */
export const SIZE_CONSTANTS = {
  MAX_TEXT_BLOCK_SIZE: 4096, // Tamanho máximo de um bloco de texto
  MAX_AUDIO_SIZE_MB: 16, // Tamanho máximo de arquivo de áudio em MB
  MAX_IMAGE_SIZE_MB: 5, // Tamanho máximo de imagem em MB
};

/**
 * Constantes para geração de chaves de cache
 */
export const CACHE_KEY_PREFIXES = {
  MESSAGE: 'whatsapp:message:',
  IMAGE: 'whatsapp:image:',
  AUDIO: 'whatsapp:audio:',
  CONVERSATION: 'whatsapp:conversation:'
};

/**
 * Constantes para logs
 */
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
}; 
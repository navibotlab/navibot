/**
 * Sistema de log estruturado para os serviços do WhatsApp Cloud API
 * 
 * Este módulo centraliza todas as funções de log utilizadas pelos
 * processadores de mensagens do WhatsApp, garantindo uma formatação
 * consistente e permitindo extensões futuras como envio para
 * serviços de monitoramento externos.
 */

// Interface do contexto de log
export interface LogContext {
  correlationId: string;
  messageId?: string;
  phone?: string;
  type?: 'text' | 'image' | 'audio' | 'general';
}

// Níveis de log suportados
export type LogLevel = 'info' | 'warn' | 'error';

// Ícones para os diferentes níveis de log
const LOG_ICONS = {
  info: '📝',
  warn: '⚠️',
  error: '❌'
};

// Ícones específicos por tipo de conteúdo
const CONTENT_ICONS = {
  text: '💬',
  image: '🖼️',
  audio: '🔊',
  general: '📦'
};

/**
 * Gera um log estruturado com formatação consistente
 * 
 * @param context Contexto do log (correlationId, messageId, etc.)
 * @param level Nível do log (info, warn, error)
 * @param message Mensagem a ser logada
 * @param data Dados adicionais (opcional)
 * @returns Objeto com os detalhes do log
 */
export function structuredLog(
  context: LogContext,
  level: LogLevel,
  message: string,
  data?: any
) {
  const timestamp = new Date().toISOString();
  const contentType = context.type || 'general';
  
  // Criar entrada de log com todos os metadados
  const logEntry = {
    timestamp,
    correlationId: context.correlationId,
    messageId: context.messageId,
    phone: context.phone,
    level,
    contentType,
    message,
    data
  };
  
  // Formatar a mensagem para o console com ícones e cores
  const icon = LOG_ICONS[level];
  const contentIcon = CONTENT_ICONS[contentType];
  const correlationSuffix = context.correlationId ? `[${context.correlationId.slice(-6)}]` : '';
  
  const formattedMessage = `${icon} ${contentIcon} ${correlationSuffix} ${message}`;
  
  // Log no console com formatação apropriada para cada nível
  if (level === 'info') {
    console.log(formattedMessage, data || '');
  } else if (level === 'warn') {
    console.warn(formattedMessage, data || '');
  } else {
    console.error(formattedMessage, data || '');
  }
  
  // Aqui poderíamos enviar o log para um sistema centralizado como 
  // CloudWatch, Datadog, Sentry, etc. se necessário
  
  return logEntry;
}

/**
 * Versão específica para logs relacionados a texto
 */
export function structuredTextLog(
  context: { correlationId: string; messageId?: string },
  level: LogLevel,
  message: string,
  data?: any
) {
  return structuredLog({ ...context, type: 'text' }, level, message, data);
}

/**
 * Versão específica para logs relacionados a imagens
 */
export function structuredImageLog(
  context: { correlationId: string; messageId?: string },
  level: LogLevel,
  message: string, 
  data?: any
) {
  return structuredLog({ ...context, type: 'image' }, level, message, data);
}

/**
 * Versão específica para logs relacionados a áudio
 */
export function structuredAudioLog(
  context: { correlationId: string; messageId?: string },
  level: LogLevel,
  message: string,
  data?: any
) {
  return structuredLog({ ...context, type: 'audio' }, level, message, data);
} 
/**
 * Módulo de logger para a aplicação
 * Centraliza os logs e permite configuração futura com serviços externos
 */

// Níveis de log
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Função para formatar a data atual
const getTimestamp = (): string => {
  return new Date().toISOString();
};

// Função para formatar a mensagem de log
const formatLogMessage = (level: LogLevel, message: string, ...args: any[]): string => {
  const timestamp = getTimestamp();
  return `[${timestamp}] [${level.toUpperCase()}] ${message} ${args.length ? JSON.stringify(args) : ''}`;
};

// Implementação do logger
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLogMessage('debug', message, ...args));
    }
  },
  
  info: (message: string, ...args: any[]) => {
    console.info(formatLogMessage('info', message, ...args));
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(formatLogMessage('warn', message, ...args));
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(formatLogMessage('error', message, ...args));
  }
}; 
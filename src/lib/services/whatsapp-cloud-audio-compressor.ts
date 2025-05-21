import { structuredLog, LogContext } from './whatsapp-cloud-logger';
import { randomUUID } from 'crypto';

// Verificar se estamos em ambiente de servidor (Node.js)
const isServer = typeof window === 'undefined';

// Variável para controlar se FFMPEG está disponível
let ffmpegAvailable = false;
let ffmpegInstance: any = null;

// Tenta importar o ffmpeg apenas no servidor, de forma bem simplificada
if (isServer) {
  try {
    // Tentativa simplificada de importação do ffmpeg
    ffmpegInstance = require('fluent-ffmpeg');
    if (typeof ffmpegInstance === 'function') {
      ffmpegAvailable = true;
      console.log('✅ Fluent-FFMPEG carregado com sucesso');
    } else {
      console.warn('⚠️ Fluent-FFMPEG importado, mas não é uma função válida');
      ffmpegAvailable = false;
      ffmpegInstance = null;
    }
  } catch (error) {
    console.warn('⚠️ Não foi possível carregar fluent-ffmpeg, áudios não serão comprimidos');
    ffmpegAvailable = false;
    ffmpegInstance = null;
  }
}

/**
 * Interface para as opções de compressão de áudio
 */
interface AudioCompressionOptions {
  bitrate?: string;  // ex: '64k'
  channels?: number; // 1 = mono, 2 = stereo
  sampleRate?: number; // ex: 22050, 44100
  format?: string; // ex: 'ogg', 'mp3'
}

/**
 * Mapeia tipos MIME para extensões de arquivo
 */
const mimeToExtension = (mimeType: string): string => {
  const mime = mimeType.toLowerCase();
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mp3') || mime.includes('mpeg')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('mp4') || mime.includes('m4a')) return 'mp4';
  if (mime.includes('aac')) return 'aac';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('flac')) return 'flac';
  return 'ogg'; // Padrão para casos não mapeados
};

/**
 * Implementação simplificada de compressão de áudio
 * Quando o FFMPEG não está disponível, apenas retorna o buffer original
 * 
 * @param buffer Buffer do áudio a ser comprimido
 * @param mimeType Tipo MIME do áudio
 * @param options Opções de compressão (não utilizadas se FFMPEG não estiver disponível)
 * @param logContext Contexto para logs estruturados
 * @returns Buffer do áudio comprimido ou o original
 */
export const compressAudio = async (
  buffer: ArrayBuffer, 
  mimeType: string,
  options: AudioCompressionOptions = {},
  logContext?: LogContext
): Promise<Buffer> => {
  const logMessage = (level: string, message: string, data?: any) => {
    if (logContext) {
      structuredLog(logContext, level as any, message, data);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`, data || '');
    }
  };

  logMessage('info', '🔄 Iniciando processamento de áudio...', { 
    size: buffer.byteLength, 
    mimeType,
    options
  });

  // Se FFMPEG não está disponível, retornar o buffer original
  if (!isServer || !ffmpegAvailable || !ffmpegInstance) {
    logMessage('warn', '⚠️ FFMPEG não disponível, usando áudio original sem compressão');
    return Buffer.from(buffer);
  }

  // Se chegou aqui, o FFMPEG está disponível, mas vamos fazer uma abordagem simplificada
  // para evitar problemas com o Next.js
  
  // Por ora, vamos apenas retornar o buffer original como solução segura
  // até que possamos resolver os problemas com o FFMPEG de forma mais adequada
  logMessage('info', '🔄 FFMPEG disponível, mas usando passthrough por segurança');
  
  // Criar estatísticas de "compressão" (mesmo que não esteja comprimindo)
  logMessage('info', '📊 Estatísticas de áudio:', {
    originalSize: buffer.byteLength,
    processedSize: buffer.byteLength,
    reductionPercent: 0
  });

  return Buffer.from(buffer);
};

/**
 * Verifica se um tipo MIME de áudio é suportado
 * 
 * @param mimeType Tipo MIME a ser verificado
 * @param allowedTypes Lista de tipos MIME permitidos
 * @returns Verdadeiro se o tipo é suportado
 */
export const isAudioMimeTypeSupported = (
  mimeType: string | null | undefined, 
  allowedTypes: string[]
): boolean => {
  if (!mimeType) return false;

  const normalizedMimeType = mimeType.toLowerCase().trim();
  
  return allowedTypes.some(type => normalizedMimeType.includes(type.toLowerCase()));
}; 
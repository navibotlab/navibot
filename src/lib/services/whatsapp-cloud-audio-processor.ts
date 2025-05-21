import { PrismaClient, Prisma } from '@prisma/client';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import { structuredAudioLog } from './whatsapp-cloud-logger';
import { formatAudioTranscription } from './whatsapp-cloud-formatter';
import { audioCache } from './whatsapp-cloud-cache';
import { getSupabaseClient } from '../supabase';
import { compressAudio, isAudioMimeTypeSupported } from './whatsapp-cloud-audio-compressor';
import { LogContext } from './whatsapp-cloud-logger';

/**
 * Ajusta o fuso horário para compensar a conversão automática para UTC
 * Subtrai 3 horas para o fuso horário Brasil (UTC-3)
 */
function adjustTimezoneBR(): Date {
  const date = new Date();
  date.setHours(date.getHours() - 3);
  return date;
}

// Tipos MIME de áudio permitidos
const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/ogg',
  'audio/mpeg',
  'audio/mp4',
  'audio/webm',
  'audio/wav',
  'audio/m4a',
  'audio/aac',
  'audio/flac',
  'audio/mp3',
  'audio/mp4',
  'audio/oga'
  
];

// Define a interface para parâmetros de processamento de áudio
interface ProcessAudioParams {
  message: {
    type: string;
    audio?: {
      id: string;
      mime_type?: string;
      voice?: boolean;
      duration?: number;
    };
  };
  threadId: string | null;
  mediaUrl: string;
  correlationId: string;
}

// Interface para o contexto de execução
interface WhatsAppCloudProcessorContext {
  prisma: PrismaClient;
  openai: OpenAI;
  accessToken: string;
  workspaceId: string;
  assistant_id?: string;
}

/**
 * Classe responsável pelo processamento de áudios do WhatsApp Cloud API
 */
export class WhatsAppCloudAudioProcessor {
  private prisma: PrismaClient;
  private openai: OpenAI;
  private accessToken: string;
  private workspaceId: string;
  private assistant_id?: string;

  constructor(context: WhatsAppCloudProcessorContext) {
    this.prisma = context.prisma;
    this.openai = context.openai;
    this.accessToken = context.accessToken;
    this.workspaceId = context.workspaceId;
    this.assistant_id = context.assistant_id;
  }

  /**
   * Valida e processa um áudio, armazenando-o no Supabase
   * Retorna a URL pública do áudio armazenado
   */
  async validateAndProcessAudio(mediaUrl: string, mediaId: string, mimeType?: string, duration?: number): Promise<string> {
    const logContext: LogContext = {
      correlationId: mediaId,
      messageId: mediaId,
      phone: '',
      type: 'audio'
    };

    try {
      // Verificar cache primeiro
      const cachedAudio = audioCache.get<string>(mediaId);
      if (cachedAudio) {
        structuredAudioLog(logContext, 'info', '🎯 Áudio encontrado no cache');
        return cachedAudio;
      }

      // Gerar nome de arquivo e caminho
      const contentType = mimeType || 'audio/ogg';
      const extension = contentType.split('/')[1]?.split(';')[0] || 'ogg';
      const fileName = `whatsapp_${mediaId}.${extension}`;
      const filePath = `${this.workspaceId}/${fileName}`;
      
      // Verificar se o arquivo já existe no Supabase
      try {
        const supabase = getSupabaseClient();
        const { data: existingFile } = await supabase.storage
          .from('audios')
          .list(this.workspaceId, { 
            search: fileName,
            limit: 1
          });
          
        if (existingFile && existingFile.length > 0) {
          structuredAudioLog(logContext, 'info', '🎯 Arquivo encontrado no Supabase, gerando URL');
          const { data: { publicUrl } } = supabase.storage
            .from('audios')
            .getPublicUrl(filePath);
            
          // Armazenar no cache
          audioCache.set(mediaId, publicUrl);
          return publicUrl;
        }
      } catch (existingCheckError) {
        structuredAudioLog(logContext, 'warn', '⚠️ Erro ao verificar existência do arquivo no Supabase, continuando');
      }

      // Baixar áudio do WhatsApp
      structuredAudioLog(logContext, 'info', '📥 Baixando áudio do WhatsApp...');
      let audioBuffer: ArrayBuffer;
      let finalContentType = contentType;
      
      try {
        const response = await fetch(mediaUrl, {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        });

        if (!response.ok) {
          throw new Error(`Erro ao baixar áudio: ${response.statusText}`);
        }

        // Obter tipo MIME e validar
        finalContentType = response.headers.get('content-type') || contentType;
        structuredAudioLog(logContext, 'info', '📦 Tipo MIME detectado:', finalContentType);
        
        if (!isAudioMimeTypeSupported(finalContentType, ALLOWED_AUDIO_MIME_TYPES)) {
          throw new Error(`Tipo de áudio não suportado: ${finalContentType}`);
        }

        // Obter o buffer do áudio
        audioBuffer = await response.arrayBuffer();
        structuredAudioLog(logContext, 'info', '✅ Áudio baixado com sucesso:', { 
          size: audioBuffer.byteLength, 
          type: finalContentType 
        });
      } catch (downloadError) {
        structuredAudioLog(logContext, 'error', '❌ Erro fatal ao baixar áudio:', downloadError);
        throw downloadError; // Não pode continuar sem o buffer
      }
      
      // "Compressão" do áudio (pode ser apenas passagem direta)
      let processedBuffer: Buffer;
      try {
        structuredAudioLog(logContext, 'info', '🔄 Processando áudio...');
        processedBuffer = await compressAudio(audioBuffer, finalContentType, {
          bitrate: '64k',
          channels: 1,
          sampleRate: 22050
        }, logContext);
        
        if (processedBuffer.length < audioBuffer.byteLength) {
          structuredAudioLog(logContext, 'info', '✅ Áudio comprimido com sucesso', {
            originalSize: audioBuffer.byteLength,
            compressedSize: processedBuffer.length,
            reduction: `${Math.round((1 - processedBuffer.length / audioBuffer.byteLength) * 100)}%`
          });
        } else {
          structuredAudioLog(logContext, 'info', 'ℹ️ Usando áudio original sem compressão');
        }
      } catch (compressionError) {
        // Se a compressão falhar, usamos o buffer original
        structuredAudioLog(logContext, 'warn', '⚠️ Erro ao processar áudio, usando buffer original:', compressionError);
        processedBuffer = Buffer.from(audioBuffer);
      }

      // Upload para o Supabase
      let publicUrl = '';
      try {
        structuredAudioLog(logContext, 'info', '📤 Fazendo upload para o Supabase...');
        const supabase = getSupabaseClient();
        
        const { data, error } = await supabase.storage
          .from('audios')
          .upload(filePath, processedBuffer, {
            contentType: finalContentType,
            upsert: true
          });

        if (error) {
          throw new Error(`Erro ao fazer upload para o Supabase: ${error.message}`);
        }

        const { data: { publicUrl: url } } = supabase.storage
          .from('audios')
          .getPublicUrl(filePath);

        publicUrl = url;
        structuredAudioLog(logContext, 'info', '✅ Upload concluído com sucesso:', { url: publicUrl });
      } catch (uploadError) {
        structuredAudioLog(logContext, 'error', '❌ Erro ao fazer upload para o Supabase:', uploadError);
        throw uploadError;
      }

      // Armazenar no cache
      audioCache.set(mediaId, publicUrl);
      structuredAudioLog(logContext, 'info', '✅ Processamento de áudio concluído');
      
      return publicUrl;
    } catch (error) {
      structuredAudioLog(logContext, 'error', '❌ Erro ao processar áudio:', error);
      throw error;
    }
  }

  /**
   * Processa uma mensagem de áudio do WhatsApp
   */
  async processAudioMessage(
    message: ProcessAudioParams['message'],
    threadId: string | null,
    mediaUrl: string,
    correlationId: string
  ): Promise<string> {
    try {
      structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '\n=== INÍCIO DO PROCESSAMENTO DE ÁUDIO ===');
      structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', 'Detalhes do áudio:', {
        mediaUrl,
        mimeType: message.audio?.mime_type,
        voice: message.audio?.voice,
        duration: message.audio?.duration
      });

      // Processar o áudio para o Supabase e obter a URL pública
      let publicAudioUrl = mediaUrl; // Inicializar com a URL original
      
      try {
        if (message.audio?.id) {
          structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '🔄 Processando áudio para armazenamento permanente...');
          publicAudioUrl = await this.validateAndProcessAudio(
            mediaUrl, 
            message.audio.id, 
            message.audio.mime_type, 
            message.audio.duration
          );
          structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '✅ URL pública do áudio gerada:', publicAudioUrl);
        }
      } catch (storageError) {
        structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'warn', '⚠️ Erro ao processar áudio para armazenamento. Continuando com URL original:', storageError);
        // Continuar com a URL original em caso de erro
      }

      // 1. Download do áudio
      structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '📥 Baixando áudio...');
      const audioResponse = await fetch(mediaUrl, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      if (!audioResponse.ok) {
        structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'error', '❌ Erro ao baixar áudio:', {
          status: audioResponse.status,
          statusText: audioResponse.statusText
        });
        throw new Error(`Falha ao baixar o áudio: ${audioResponse.statusText}`);
      }

      const audioBuffer = await audioResponse.arrayBuffer();
      structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '✅ Áudio baixado com sucesso:', {
        size: audioBuffer.byteLength,
        type: message.audio?.mime_type
      });

      // 2. Transcrição com Whisper
      structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '🔄 Iniciando transcrição com Whisper...');
      try {
        // Determinar o tipo MIME adequado
        const contentType = message.audio?.mime_type || audioResponse.headers.get('content-type') || 'audio/ogg';
        structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '📦 Tipo MIME detectado:', contentType);
        
        // Ajustar para formato compatível com Whisper
        let whisperMimeType = 'audio/ogg'; // Padrão
        
        if (contentType.includes('audio/ogg')) {
          whisperMimeType = 'audio/ogg';
        } else if (contentType.includes('audio/mpeg') || contentType.includes('audio/mp3')) {
          whisperMimeType = 'audio/mpeg';
        } else if (contentType.includes('audio/mp4')) {
          whisperMimeType = 'audio/mp4';
        } else if (contentType.includes('audio/wav')) {
          whisperMimeType = 'audio/wav';
        } else if (contentType.includes('webm')) {
          whisperMimeType = 'audio/webm';
        }
        
        structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '📦 Tipo MIME para Whisper:', whisperMimeType);

        const audioBlob = new Blob([audioBuffer], { type: whisperMimeType });
        const audioFile = new File([audioBlob], 'audio.ogg', { type: whisperMimeType });
        
        structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '📦 Arquivo de áudio preparado:', {
          size: audioFile.size,
          type: audioFile.type,
          name: audioFile.name
        });

        const transcription = await this.openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          language: 'pt'
        });

        structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '\n=== TRANSCRIÇÃO DO ÁUDIO ===');
        structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', transcription.text);
        structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '===========================\n');

        // 3. Enviar a transcrição para o agente vinculado
        if (!threadId) {
          throw new Error('Thread ID não encontrado');
        }

        // Obter a conversa atual
        const conversation = await this.prisma.conversations.findFirst({
          where: { thread_id: threadId }
        });

        if (!conversation) {
          throw new Error('Conversa não encontrada');
        }

        // Formatar a mensagem com ícone de play e transcrição
        const formattedMessage = formatAudioTranscription(transcription.text);

        // Salvar a mensagem no banco de dados
        await this.prisma.messages.create({
          data: {
            conversation_id: conversation.id,
            content: transcription.text,
            sender: 'user',
            read: true,
            type: 'audio',
            media_url: publicAudioUrl,
            external_id: message.audio?.id,
            media_duration: message.audio?.duration,
            media_type: message.audio?.mime_type,
            created_at: adjustTimezoneBR(),
            updated_at: adjustTimezoneBR()
          }
        });

        // 4. Adicionar a mensagem à thread do OpenAI
        structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '🤖 Adicionando mensagem à thread do OpenAI...');
        
        // Verificar se há alguma execução ativa na thread
        structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '🔍 Verificando execuções ativas na thread antes de processar áudio...');
        const activeRuns = await this.openai.beta.threads.runs.list(threadId, {
          limit: 1,
          order: 'desc'
        });
        
        // Se houver execuções ativas, aguardar a conclusão
        if (activeRuns.data.length > 0) {
          const latestRun = activeRuns.data[0];
          
          // Verificar se a execução mais recente ainda está ativa
          if (['queued', 'in_progress', 'requires_action'].includes(latestRun.status)) {
            structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', `⏳ Aguardando conclusão da execução ${latestRun.id} (status: ${latestRun.status})...`);
            
            // Esperar a conclusão da execução atual
            let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, latestRun.id);
            while (['queued', 'in_progress', 'requires_action'].includes(runStatus.status)) {
              structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', `🔄 Execução ${latestRun.id} ainda ativa com status: ${runStatus.status}. Aguardando...`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
              runStatus = await this.openai.beta.threads.runs.retrieve(threadId, latestRun.id);
            }
            
            structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', `✅ Execução anterior concluída com status: ${runStatus.status}`);
          }
        }
        
        await this.openai.beta.threads.messages.create(threadId, {
          role: 'user',
          content: transcription.text
        });

        // 5. Executar o assistant
        structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '🔄 Executando assistente com ID:', this.assistant_id);
        if (!this.assistant_id) {
          throw new Error('ID do assistente não encontrado');
        }

        const run = await this.openai.beta.threads.runs.create(threadId, {
          assistant_id: this.assistant_id
        });

        // 6. Aguardar a conclusão do processamento
        structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '⏳ Aguardando resposta do assistente...');
        let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
        while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
          structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '🔄 Status do processamento:', runStatus.status);
        }

        if (runStatus.status !== 'completed') {
          structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'error', '❌ Falha na geração da resposta:', runStatus.status);
          throw new Error(`Execução falhou com status: ${runStatus.status}`);
        }

        // 7. Obter a resposta
        structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '📥 Obtendo resposta gerada pelo assistente...');
        const messages = await this.openai.beta.threads.messages.list(threadId);
        const lastMessage = messages.data[0];
        
        if (!lastMessage || lastMessage.role !== 'assistant') {
          throw new Error('Não foi possível obter a resposta do assistente');
        }

        const responseContent = lastMessage.content[0];
        if (responseContent.type !== 'text') {
          throw new Error('Resposta inesperada do assistente');
        }

        structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '\n=== RESPOSTA GERADA PELO AGENTE ===');
        structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', responseContent.text.value);
        structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'info', '=====================================\n');

        return responseContent.text.value;
      } catch (error: any) {
        structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'error', '❌ Erro ao processar áudio:', error);
        throw error; // Propagar o erro para ser tratado no nível superior
      }
    } catch (error: any) {
      structuredAudioLog({ correlationId, messageId: message.audio?.id }, 'error', '❌ Erro ao processar áudio:', error);
      throw error; // Propagar o erro para ser tratado no nível superior
    }
  }
} 
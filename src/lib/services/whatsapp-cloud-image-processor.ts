import { PrismaClient } from '@prisma/client';
import { getSupabaseClient } from '../supabase';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import { structuredImageLog } from './whatsapp-cloud-logger';
import { imageCache } from './whatsapp-cloud-cache';

// Tipos MIME permitidos
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

// Define a interface para parâmetros de processamento de imagem
interface ProcessImageParams {
  message: {
    type: string;
    image?: {
      id: string;
      caption?: string;
      mime_type?: string;
      url?: string;
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
 * Classe responsável pelo processamento de imagens do WhatsApp Cloud API
 */
export class WhatsAppCloudImageProcessor {
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
   * Valida e processa uma imagem, armazenando-a no Supabase
   */
  async validateAndProcessImage(mediaUrl: string, mediaId: string, mimeType?: string): Promise<string> {
    try {
      // Verificar cache primeiro
      const cachedImage = imageCache.get<string>(mediaId);
      if (cachedImage) {
        console.log('🎯 Imagem encontrada no cache');
        return cachedImage;
      }

      console.log('🔄 Baixando imagem do WhatsApp...');
      const response = await fetch(mediaUrl, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      if (!response.ok) {
        throw new Error(`Erro ao baixar imagem: ${response.statusText}`);
      }

      // Validar tipo MIME
      const contentType = response.headers.get('content-type') || mimeType;
      if (!contentType || !ALLOWED_MIME_TYPES.includes(contentType)) {
        throw new Error(`Tipo de imagem não suportado: ${contentType}`);
      }

      // Converter para Buffer
      const imageBuffer = await response.arrayBuffer();
      const extension = contentType.split('/')[1];
      const fileName = `whatsapp_${mediaId}.${extension}`;
      const filePath = `whatsapp/${this.workspaceId}/${fileName}`;

      // Upload para o Supabase Storage
      console.log('📤 Fazendo upload para Supabase Storage...');
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, imageBuffer, {
          contentType,
          upsert: true
        });

      if (error) {
        throw new Error(`Erro ao fazer upload para o Supabase: ${error.message}`);
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Armazenar no cache
      imageCache.set(mediaId, publicUrl);

      console.log('✅ Imagem processada e disponível em URL pública');
      return publicUrl;
    } catch (error) {
      console.error('❌ Erro ao processar imagem:', error);
      throw error;
    }
  }

  /**
   * Processa uma mensagem contendo imagem do WhatsApp
   */
  async processImageMessage(params: ProcessImageParams): Promise<string> {
    const { message, threadId, mediaUrl, correlationId } = params;
    
    try {
      structuredImageLog({ correlationId, messageId: message.image?.id }, 'info', '🔍 Processando imagem...');
      
      if (!message.image?.id) {
        throw new Error('ID da imagem não encontrado');
      }

      // Verificar se a mensagem já foi processada
      const savedMessage = await this.prisma.messages.findFirst({
        where: {
          external_id: message.image?.id
        }
      });

      // Obter a conversa atual
      const conversation = await this.prisma.conversations.findFirst({
        where: { thread_id: threadId }
      });

      if (!savedMessage?.media_url) {
        throw new Error('URL pública da imagem não encontrada');
      }

      structuredImageLog({ correlationId, messageId: message.image?.id }, 'info', '✅ URL pública encontrada:', { savedMessage: savedMessage.media_url });

      if (!threadId) {
        throw new Error('Thread ID não encontrado');
      }

      // Verificar se há alguma execução ativa na thread
      structuredImageLog({ correlationId, messageId: message.image?.id }, 'info', '🔍 Verificando execuções ativas na thread antes de processar imagem...');
      const activeRuns = await this.openai.beta.threads.runs.list(threadId, {
        limit: 1,
        order: 'desc'
      });
      
      // Se houver execuções ativas, aguardar a conclusão
      if (activeRuns.data.length > 0) {
        const latestRun = activeRuns.data[0];
        
        // Verificar se a execução mais recente ainda está ativa
        if (['queued', 'in_progress', 'requires_action'].includes(latestRun.status)) {
          structuredImageLog({ correlationId, messageId: message.image?.id }, 'info', `⏳ Aguardando conclusão da execução ${latestRun.id} (status: ${latestRun.status})...`);
          
          // Esperar a conclusão da execução atual
          let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, latestRun.id);
          while (['queued', 'in_progress', 'requires_action'].includes(runStatus.status)) {
            structuredImageLog({ correlationId, messageId: message.image?.id }, 'info', `🔄 Execução ${latestRun.id} ainda ativa com status: ${runStatus.status}. Aguardando...`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
            runStatus = await this.openai.beta.threads.runs.retrieve(threadId, latestRun.id);
          }
          
          structuredImageLog({ correlationId, messageId: message.image?.id }, 'info', `✅ Execução anterior concluída com status: ${runStatus.status}`);
        }
      }

      structuredImageLog({ correlationId, messageId: message.image?.id }, 'info', '📝 Enviando imagem para análise do assistente...');
      
      // Enviar imagem e mensagem para o assistente
      await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: [
          {
            type: "image_url",
            image_url: {
              url: savedMessage.media_url,
              detail: "high"
            }
          },
          {
            type: "text",
            text: message.image?.caption || "Por favor, analise esta imagem e me dê uma resposta apropriada."
          }
        ]
      });

      // Executar o assistente
      structuredImageLog({ correlationId, messageId: message.image?.id }, 'info', '🤖 Executando assistente...');
      if (!this.assistant_id) {
        throw new Error('ID do assistente não encontrado');
      }

      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: this.assistant_id
      });

      // Aguardar a conclusão do processamento
      structuredImageLog({ correlationId, messageId: message.image?.id }, 'info', '⏳ Aguardando resposta do assistente...');
      let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
      while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
        structuredImageLog({ correlationId, messageId: message.image?.id }, 'info', '🔄 Status do processamento:', runStatus.status);
      }

      if (runStatus.status !== 'completed') {
        structuredImageLog({ correlationId, messageId: message.image?.id }, 'error', '❌ Falha na geração da resposta:', runStatus.status);
        throw new Error(`Execução falhou com status: ${runStatus.status}`);
      }

      // Obter a resposta
      structuredImageLog({ correlationId, messageId: message.image?.id }, 'info', '📥 Obtendo resposta do assistente...');
      const threadMessages = await this.openai.beta.threads.messages.list(threadId);
      const lastMessage = threadMessages.data[0];
      
      if (!lastMessage || lastMessage.role !== 'assistant') {
        throw new Error('Resposta do assistente não encontrada');
      }

      const responseContent = lastMessage.content[0];
      if (responseContent.type !== 'text') {
        throw new Error('Tipo de resposta inesperado do assistente');
      }

      structuredImageLog({ correlationId, messageId: message.image?.id }, 'info', '✅ Resposta gerada com sucesso');
      
      // Retornar o texto da resposta, não a URL da imagem
      return responseContent.text.value;
    } catch (error: any) {
      structuredImageLog({ correlationId, messageId: message.image?.id }, 'error', '❌ Erro ao processar imagem:', error);
      return 'Desculpe, não foi possível processar sua imagem. Por favor, tente novamente.';
    }
  }
} 
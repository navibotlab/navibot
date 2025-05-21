/**
 * Gerenciador de conversas para os serviços do WhatsApp Cloud API
 * 
 * Este módulo gerencia a criação, busca e atualização de conversas
 * entre leads e assistentes, incluindo a criação e gerenciamento
 * de threads OpenAI.
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { structuredLog, LogContext } from './whatsapp-cloud-logger';

/**
 * Interface para o contexto do gerenciador de conversas
 */
interface ConversationManagerContext {
  prisma: PrismaClient;
  openai: OpenAI;
  workspaceId: string;
}

/**
 * Tipo para representar uma conversa
 */
interface Conversation {
  id: string;
  lead_id: string;
  thread_id?: string | null;
  created_at: Date;
  updated_at: Date;
  workspaceId: string;
  channel?: string | null;
}

/**
 * Gerenciador de conversas para o WhatsApp Cloud
 */
export class WhatsAppCloudConversationManager {
  private prisma: PrismaClient;
  private openai: OpenAI;
  private workspaceId: string;

  constructor(context: ConversationManagerContext) {
    this.prisma = context.prisma;
    this.openai = context.openai;
    this.workspaceId = context.workspaceId;
  }

  /**
   * Obtém uma conversa existente ou cria uma nova para um número de telefone
   * 
   * @param phone Número de telefone do lead
   * @param correlationId ID de correlação para logs (opcional)
   * @returns A conversa obtida ou criada, ou null se não for possível
   */
  async getOrCreateConversation(phone: string, correlationId?: string): Promise<Conversation | null> {
    const logContext: LogContext = { 
      correlationId: correlationId || '', 
      type: 'general',
      messageId: '', 
      phone: phone
    };
    
    try {
      // Buscar conversa existente
      structuredLog(logContext, 'info', '🔍 Buscando conversa existente para o número:', { phone });
      let conversation: Conversation | null = null;

      conversation = await this.prisma.conversations.findFirst({
        where: { 
          leads: {
            phone
          }
        },
        orderBy: { 
          created_at: 'desc' 
        }
      });

      if (!conversation) {
        structuredLog(logContext, 'info', '📝 Conversa não encontrada, criando nova...');
        
        // Criar nova thread na OpenAI
        structuredLog(logContext, 'info', '🧵 Criando thread OpenAI...');
        const thread = await this.openai.beta.threads.create();
        structuredLog(logContext, 'info', '✅ Thread criada:', { threadId: thread.id });
        
        // Buscar lead
        structuredLog(logContext, 'info', '🔍 Buscando lead pelo número de telefone...');
        const lead = await this.prisma.leads.findFirst({
          where: { phone }
        });

        if (!lead) {
          structuredLog(logContext, 'error', '❌ Lead não encontrado para o número:', { phone });
          return null;
        }

        // Criar conversa com o threadId
        structuredLog(logContext, 'info', '📝 Criando nova conversa...');
        conversation = await this.prisma.conversations.create({
          data: { 
            thread_id: thread.id,
            lead_id: lead.id,
            workspaceId: this.workspaceId,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        structuredLog(logContext, 'info', '✅ Conversa criada com thread:', { conversationId: conversation.id, threadId: thread.id });
      } else if (!conversation.thread_id) {
        // Se a conversa existe mas não tem threadId, criar uma nova thread
        structuredLog(logContext, 'info', '🧵 Conversa encontrada sem threadId, criando nova thread...');
        const thread = await this.openai.beta.threads.create();
        structuredLog(logContext, 'info', '✅ Thread criada:', { threadId: thread.id });
        
        // Atualizar a conversa com o novo threadId
        conversation = await this.prisma.conversations.update({
          where: { id: conversation.id },
          data: { thread_id: thread.id }
        });
        structuredLog(logContext, 'info', '✅ Conversa atualizada com nova thread:', { conversationId: conversation.id, threadId: thread.id });
      } else {
        structuredLog(logContext, 'info', '✅ Conversa existente encontrada:', { conversationId: conversation.id, threadId: conversation.thread_id });
      }

      return conversation;
    } catch (error) {
      structuredLog(logContext, 'error', '❌ Erro ao obter/criar conversa:', error);
      return null;
    }
  }

  /**
   * Busca uma conversa pelo threadId
   * 
   * @param threadId ID da thread OpenAI
   * @returns A conversa encontrada ou null
   */
  async getConversationByThreadId(threadId: string): Promise<any | null> {
    return this.prisma.conversations.findFirst({
      where: { thread_id: threadId }
    });
  }

  /**
   * Busca uma conversa pelo ID
   * 
   * @param conversationId ID da conversa
   * @returns A conversa encontrada ou null
   */
  async getConversationById(conversationId: string): Promise<Conversation | null> {
    return this.prisma.conversations.findUnique({
      where: { id: conversationId }
    });
  }

  /**
   * Cria uma nova thread OpenAI para uma conversa existente
   * 
   * @param conversationId ID da conversa
   * @returns A conversa atualizada ou null
   */
  async createNewThreadForConversation(conversationId: string, correlationId?: string): Promise<Conversation | null> {
    const logContext: LogContext = { 
      correlationId: correlationId || '', 
      type: 'general',
      messageId: '', 
      phone: ''
    };
    
    try {
      // Criar nova thread
      structuredLog(logContext, 'info', '🧵 Criando nova thread OpenAI...');
      const thread = await this.openai.beta.threads.create();
      structuredLog(logContext, 'info', '✅ Thread criada:', { threadId: thread.id });
      
      // Atualizar a conversa
      const conversation = await this.prisma.conversations.update({
        where: { id: conversationId },
        data: { thread_id: thread.id }
      });
      
      structuredLog(logContext, 'info', '✅ Conversa atualizada com nova thread:', { conversationId, threadId: thread.id });
      return conversation;
    } catch (error) {
      structuredLog(logContext, 'error', '❌ Erro ao criar nova thread para conversa:', error);
      return null;
    }
  }
} 
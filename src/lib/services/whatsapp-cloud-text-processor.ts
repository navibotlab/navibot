import { PrismaClient, Prisma } from '@prisma/client';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { structuredTextLog } from './whatsapp-cloud-logger';
import { textCache } from './whatsapp-cloud-cache';

// Interface para o contexto de execução
interface WhatsAppCloudProcessorContext {
  prisma: PrismaClient;
  openai: OpenAI;
  accessToken: string;
  workspaceId: string;
  assistant_id?: string;
}

/**
 * Classe responsável pelo processamento de textos do WhatsApp Cloud API
 */
export class WhatsAppCloudTextProcessor {
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
   * Processa uma mensagem de texto do WhatsApp
   */
  async processTextMessage(
    text: string, 
    threadId: string | null,
    correlationId: string
  ): Promise<string> {
    const logContext = { correlationId };
    
    const MAX_RETRIES = 3;
    let currentRetry = 0;
    let lastError: any = null;
    
    // Função auxiliar para aplicar backoff exponencial
    const exponentialBackoff = (retry: number) => {
      const delay = Math.min(Math.pow(2, retry) * 1000, 10000); // Máximo de 10 segundos
      return new Promise(resolve => setTimeout(resolve, delay));
    };
    
    while (currentRetry <= MAX_RETRIES) {
      try {
        structuredTextLog(logContext, 'info', `🤖 Processando mensagem de texto com o agente... ${currentRetry > 0 ? `(Tentativa ${currentRetry + 1}/${MAX_RETRIES + 1})` : ''}`);
        
        if (!threadId) {
          throw new Error('Thread ID não encontrado');
        }

        // Verificar se há alguma execução ativa na thread
        structuredTextLog(logContext, 'info', '🔍 Verificando execuções ativas na thread...');
        const activeRuns = await this.openai.beta.threads.runs.list(threadId, {
          limit: 1,
          order: 'desc'
        });
        
        // Se houver execuções ativas, aguardar a conclusão
        if (activeRuns.data.length > 0) {
          const latestRun = activeRuns.data[0];
          
          // Verificar se a execução mais recente ainda está ativa
          if (['queued', 'in_progress', 'requires_action'].includes(latestRun.status)) {
            structuredTextLog(logContext, 'info', `⏳ Aguardando conclusão da execução ${latestRun.id} (status: ${latestRun.status})...`);
            
            // Esperar a conclusão da execução atual
            let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, latestRun.id);
            while (['queued', 'in_progress', 'requires_action'].includes(runStatus.status)) {
              structuredTextLog(logContext, 'info', `🔄 Execução ${latestRun.id} ainda ativa com status: ${runStatus.status}. Aguardando...`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
              runStatus = await this.openai.beta.threads.runs.retrieve(threadId, latestRun.id);
            }
            
            structuredTextLog(logContext, 'info', `✅ Execução anterior concluída com status: ${runStatus.status}`);
            
            // Se a execução falhou, podemos tentar cancelá-la antes de prosseguir
            if (runStatus.status !== 'completed') {
              structuredTextLog(logContext, 'warn', `⚠️ A execução anterior não foi concluída com sucesso. Status: ${runStatus.status}`);
              
              // Tenta cancelar se estiver em um estado que permite cancelamento
              if (['queued', 'in_progress', 'requires_action'].includes(runStatus.status)) {
                try {
                  structuredTextLog(logContext, 'info', `🛑 Tentando cancelar a execução ${latestRun.id}...`);
                  await this.openai.beta.threads.runs.cancel(threadId, latestRun.id);
                  structuredTextLog(logContext, 'info', `✅ Execução ${latestRun.id} cancelada com sucesso.`);
                } catch (cancelError) {
                  structuredTextLog(logContext, 'error', `❌ Erro ao cancelar execução: ${cancelError}`);
                }
              }
            }
          }
        }

        // Obter a conversa relacionada à thread para recuperar mensagens de humanos
        const conversation = await this.prisma.conversations.findFirst({
          where: { thread_id: threadId }
        });

        if (!conversation) {
          throw new Error('Conversa não encontrada para esta thread');
        }

        // Buscar todas as mensagens de humanos desde a última resposta do assistente
        structuredTextLog(logContext, 'info', '🔍🔍🔍 INÍCIO DO PROCESSAMENTO DE MENSAGENS HUMANAS 🔍🔍🔍');
        structuredTextLog(logContext, 'info', `Thread ID: ${threadId}, Conversation ID: ${conversation.id}`);
        
        const lastAssistantMessage = await this.prisma.messages.findFirst({
          where: {
            conversation_id: conversation.id,
            sender: 'assistant'
          },
          orderBy: {
            created_at: 'desc'
          }
        });

        // Definir o critério de tempo para buscar mensagens de humanos
        const timeFilter = lastAssistantMessage 
          ? { gt: lastAssistantMessage.created_at } 
          : undefined;

        if (lastAssistantMessage) {
          structuredTextLog(logContext, 'info', `Última mensagem do assistente encontrada, ID: ${lastAssistantMessage.id}`);
          structuredTextLog(logContext, 'info', `Data da última mensagem: ${lastAssistantMessage.created_at}`);
          structuredTextLog(logContext, 'info', `Buscando mensagens humanas após: ${lastAssistantMessage.created_at}`);
        } else {
          structuredTextLog(logContext, 'info', `Nenhuma mensagem do assistente encontrada, buscando todas as mensagens humanas`);
        }

        const humanMessages = await this.prisma.messages.findMany({
          where: {
            conversation_id: conversation.id,
            sender: 'human',
            ...(timeFilter ? { created_at: timeFilter } : {})
          },
          orderBy: {
            created_at: 'asc'
          }
        });

        structuredTextLog(logContext, 'info', `✅✅✅ ENCONTRADAS ${humanMessages.length} MENSAGENS DE HUMANOS ✅✅✅`);
        
        if (humanMessages.length > 0) {
          structuredTextLog(logContext, 'info', '📄📄📄 INÍCIO DA ADIÇÃO DE MENSAGENS HUMANAS AO CONTEXTO 📄📄📄');
          
          // Adicionar todas as mensagens de humanos à thread
          for (const msg of humanMessages) {
            try {
              structuredTextLog(logContext, 'info', `📝 ID da mensagem: ${msg.id}, Criada em: ${msg.created_at}`);
              structuredTextLog(logContext, 'info', `📝 Conteúdo da mensagem: "${msg.content}"`);
              
              await this.openai.beta.threads.messages.create(threadId, {
                role: 'assistant',
                content: `[MENSAGEM ENVIADA PELO OPERADOR HUMANO]: ${msg.content}`
              });
              
              structuredTextLog(logContext, 'info', `✅ Mensagem humana adicionada ao contexto com sucesso como 'assistant'`);
            } catch (error) {
              structuredTextLog(logContext, 'error', `❌ Erro ao adicionar mensagem humana ao contexto:`, error);
            }
          }
          
          structuredTextLog(logContext, 'info', '📄📄📄 FIM DA ADIÇÃO DE MENSAGENS HUMANAS AO CONTEXTO 📄📄📄');
        } else {
          structuredTextLog(logContext, 'info', '⚠️ Nenhuma mensagem humana encontrada para adicionar ao contexto');
        }
        
        structuredTextLog(logContext, 'info', '🔍🔍🔍 FIM DO PROCESSAMENTO DE MENSAGENS HUMANAS 🔍🔍🔍');

        // Adicionar a mensagem do usuário à thread
        structuredTextLog(logContext, 'info', '📝 Adicionando mensagem do cliente à thread...');
        await this.openai.beta.threads.messages.create(threadId, {
          role: 'user',
          content: text
        });

        // Executar o assistente
        structuredTextLog(logContext, 'info', '🤖 Executando assistente com ID:', this.assistant_id);
        if (!this.assistant_id) {
          throw new Error('ID do assistente não encontrado');
        }

        const run = await this.openai.beta.threads.runs.create(threadId, {
          assistant_id: this.assistant_id
        });

        // Aguardar a conclusão do processamento
        let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
        
        // Aumentar o tempo máximo de espera para execuções longas
        const MAX_WAIT_TIME = 120000; // 2 minutos
        const startTime = Date.now();
        
        while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
          // Verificar se excedemos o tempo máximo de espera
          if (Date.now() - startTime > MAX_WAIT_TIME) {
            throw new Error(`Tempo limite excedido (${MAX_WAIT_TIME / 1000}s) aguardando resposta do assistente`);
          }
          
          // Ajustar o intervalo entre verificações com base no tempo decorrido
          const elapsedTime = Date.now() - startTime;
          const waitTime = Math.min(Math.max(1000, elapsedTime / 10), 5000); // Entre 1s e 5s
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
          runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
          structuredTextLog(logContext, 'info', '🔄 Status do processamento:', runStatus.status);
        }

        if (runStatus.status !== 'completed') {
          throw new Error(`Execução falhou com status: ${runStatus.status}`);
        }

        // Obter a resposta
        const messages = await this.openai.beta.threads.messages.list(threadId);
        const lastMessage = messages.data[0];
        
        if (!lastMessage || lastMessage.role !== 'assistant') {
          throw new Error('Não foi possível obter a resposta do assistente');
        }

        const responseContent = lastMessage.content[0];
        if (responseContent.type !== 'text') {
          throw new Error('Resposta inesperada do assistente');
        }

        // Se chegou até aqui, foi bem-sucedido
        return responseContent.text.value;
        
      } catch (error: any) {
        lastError = error;
        structuredTextLog(logContext, 'error', `❌ Erro ao processar mensagem de texto (tentativa ${currentRetry + 1}/${MAX_RETRIES + 1}):`, error);
        
        // Classificar o tipo de erro para decidir se deve tentar novamente
        const errorMessage = error.message || String(error);
        const isRetryableError = 
          errorMessage.includes('timeout') || 
          errorMessage.includes('rate limit') || 
          errorMessage.includes('503') ||
          errorMessage.includes('429') ||
          errorMessage.includes('500') ||
          errorMessage.includes('network') ||
          errorMessage.includes('connection');
        
        // Se não for um erro que vale a pena tentar novamente, pare imediatamente
        if (!isRetryableError && currentRetry > 0) {
          structuredTextLog(logContext, 'warn', '⚠️ Erro não recuperável, parando tentativas');
          break;
        }
        
        currentRetry++;
        
        // Se ainda temos tentativas restantes
        if (currentRetry <= MAX_RETRIES) {
          const backoffTime = await exponentialBackoff(currentRetry);
          structuredTextLog(logContext, 'info', `⏳ Aguardando ${backoffTime}ms antes da próxima tentativa...`);
          await exponentialBackoff(currentRetry);
          continue;
        }
        
        // Chegamos ao número máximo de tentativas
        break;
      }
    }
    
    // Se chegamos aqui, todas as tentativas falharam
    structuredTextLog(logContext, 'error', `❌ Todas as ${MAX_RETRIES + 1} tentativas falharam ao processar mensagem de texto`);
    
    // Customizar mensagem de erro com base no último erro
    if (lastError) {
      const errorMessage = lastError.message || String(lastError);
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        return 'Desculpe, nosso serviço está com alta demanda no momento. Por favor, tente novamente em alguns minutos.';
      }
      if (errorMessage.includes('timeout') || errorMessage.includes('tempo limite')) {
        return 'Desculpe, o processamento da sua mensagem está demorando mais que o esperado. Por favor, tente enviar uma mensagem mais curta.';
      }
    }
    
    return 'Desculpe, ocorreu um erro ao processar sua mensagem. Nossa equipe já foi notificada e estamos trabalhando para resolver o problema.';
  }
} 
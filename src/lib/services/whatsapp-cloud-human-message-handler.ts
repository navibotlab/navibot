import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { SimpleLogger } from './whatsapp-cloud-message-storage';

/**
 * Classe responsável por gerenciar a adição de mensagens enviadas por operadores humanos
 * ao thread do OpenAI Assistant, mantendo o contexto da conversa atualizado.
 */
export class WhatsAppCloudHumanMessageHandler {
  private openai: OpenAI;
  private logger: SimpleLogger;
  
  /**
   * Cria uma nova instância do manipulador de mensagens humanas
   * @param openai Instância do cliente OpenAI
   * @param logger Logger para registro de atividades
   */
  constructor(openai: OpenAI, logger: SimpleLogger) {
    this.openai = openai;
    this.logger = logger;
  }
  
  /**
   * Verifica se há um run ativo no thread e cancela ou aguarda sua conclusão
   * @param threadId ID do thread a verificar
   * @param logContext Contexto de log para rastreamento
   * @returns true se o thread está pronto para receber mensagens, false caso contrário
   */
  private async verifyAndHandleActiveRuns(threadId: string, logContext: any): Promise<boolean> {
    try {
      // Buscar runs ativos no thread
      this.logger.info(`🔍 Verificando runs ativos no thread ${threadId}...`, logContext);
      
      const runsList = await this.openai.beta.threads.runs.list(threadId, {
        limit: 1,
      });
      
      // Se não há runs ou a lista está vazia, thread está pronto
      if (!runsList || !runsList.data || runsList.data.length === 0) {
        this.logger.info(`✅ Nenhum run ativo encontrado no thread`, logContext);
        return true;
      }
      
      const latestRun = runsList.data[0];
      const runStatus = latestRun.status;
      
      this.logger.info(`📌 Run mais recente: ${latestRun.id} com status: ${runStatus}`, logContext);
      
      // Estados que indicam run completado ou falho (não está ativo)
      const finishedStates = ['completed', 'failed', 'cancelled', 'expired'];
      
      if (finishedStates.includes(runStatus)) {
        this.logger.info(`✅ Run ${latestRun.id} já finalizado com status: ${runStatus}`, logContext);
        return true;
      }
      
      // Se o run está em andamento, tentar cancelá-lo
      if (['in_progress', 'queued', 'requires_action'].includes(runStatus)) {
        this.logger.info(`⚠️ Run ${latestRun.id} está ativo com status: ${runStatus}, tentando cancelar...`, logContext);
        
        try {
          await this.openai.beta.threads.runs.cancel(threadId, latestRun.id);
          this.logger.info(`✅ Run ${latestRun.id} cancelado com sucesso`, logContext);
          
          // Aguardar um momento para garantir que o sistema processou o cancelamento
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          return true;
        } catch (cancelError: any) {
          this.logger.error(`❌ Não foi possível cancelar run ${latestRun.id}: ${cancelError.message}`, logContext);
          
          // Se não conseguimos cancelar, verificar status novamente
          try {
            const currentRun = await this.openai.beta.threads.runs.retrieve(threadId, latestRun.id);
            
            // Se o status mudou para um estado finalizado, podemos prosseguir
            if (finishedStates.includes(currentRun.status)) {
              this.logger.info(`✅ Run ${latestRun.id} finalizou durante a verificação: ${currentRun.status}`, logContext);
              return true;
            }
            
            this.logger.error(`❌ Run ${latestRun.id} ainda ativo e não pôde ser cancelado: ${currentRun.status}`, logContext);
            return false;
          } catch (retrieveError) {
            this.logger.error(`❌ Erro ao verificar status atual do run: ${retrieveError}`, logContext);
            return false;
          }
        }
      }
      
      // Para qualquer outro estado, consideramos que o run não está bloqueando
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Erro ao verificar runs ativos: ${error.message}`, logContext);
      // Em caso de erro na verificação, assumimos que é seguro tentar adicionar a mensagem
      return true;
    }
  }
  
  /**
   * Adiciona uma mensagem enviada pelo operador humano ao thread do OpenAI Assistant
   * Esta função é chamada quando uma mensagem manual (isManual=true) é enviada pela interface
   * O objetivo é manter o contexto da conversa atualizado no OpenAI Assistant
   * @param threadId ID do thread no OpenAI Assistant
   * @param content Conteúdo da mensagem
   * @param correlationId ID de correlação para logging
   * @param assistantId ID opcional do assistente para executar run após adicionar a mensagem
   * @returns Informação sobre sucesso ou falha da operação
   */
  async addMessageToThread(
    threadId: string,
    content: string,
    correlationId: string = uuidv4(),
    assistantId?: string
  ): Promise<{ success: boolean; message: string }> {
    const logContext = { correlationId, messageId: '', phone: '' };
    
    try {
      // Verificar se temos threadId válido
      if (!threadId) {
        this.logger.error('❌ ThreadId não fornecido ou inválido', logContext);
        return { success: false, message: 'ThreadId inválido' };
      }
      
      // Log do início do processo
      this.logger.info('🔵 INICIANDO ADIÇÃO DE MENSAGEM HUMANA AO THREAD', logContext);
      this.logger.info(`Thread ID: ${threadId}`, logContext);
      this.logger.info(`Conteúdo da mensagem: "${content}"`, logContext);
      
      // Verificar se o thread existe antes de tentar adicionar a mensagem
      try {
        this.logger.info(`Verificando existência do thread ${threadId}...`, logContext);
        await this.openai.beta.threads.retrieve(threadId);
        this.logger.info(`✅ Thread ${threadId} encontrado`, logContext);
      } catch (threadError: any) {
        this.logger.error(`❌ Thread ${threadId} não encontrado ou inacessível:`, threadError);
        return { 
          success: false, 
          message: `Thread não encontrado ou inacessível: ${threadError.message || 'Erro desconhecido'}` 
        };
      }
      
      // Verificar e tratar runs ativos antes de adicionar a mensagem
      const threadIsReady = await this.verifyAndHandleActiveRuns(threadId, logContext);
      
      if (!threadIsReady) {
        return {
          success: false,
          message: `Não foi possível adicionar mensagem ao thread porque há um run ativo que não pôde ser cancelado`
        };
      }
      
      // Adicionar a mensagem ao thread com role:assistant
      // O prefixo é adicionado para distinguir que foi enviado pelo operador humano
      this.logger.info(`Adicionando mensagem humana ao thread ${threadId}...`, logContext);
      await this.openai.beta.threads.messages.create(threadId, {
        role: 'assistant',
        content: `[MENSAGEM ENVIADA PELO OPERADOR HUMANO]: ${content}`
      });
      
      this.logger.info('✅ Mensagem humana adicionada ao thread com sucesso', logContext);
      
      // Se um assistantId foi fornecido, criar um run para processar a mensagem
      if (assistantId) {
        this.logger.info(`Criando run com assistantId: ${assistantId}`, logContext);
        try {
          // Verificar se o assistente existe antes de criar o run
          try {
            this.logger.info(`Verificando existência do assistente ${assistantId}...`, logContext);
            await this.openai.beta.assistants.retrieve(assistantId);
            this.logger.info(`✅ Assistente ${assistantId} encontrado`, logContext);
          } catch (assistantError: any) {
            this.logger.error(`❌ Assistente ${assistantId} não encontrado ou inacessível:`, assistantError);
            return { 
              success: true, // A mensagem foi adicionada ao thread, então é parcialmente bem-sucedida
              message: `Mensagem adicionada ao thread, mas o assistente não foi encontrado: ${assistantError.message}` 
            };
          }
          
          // Criar o run
          const run = await this.openai.beta.threads.runs.create(threadId, {
            assistant_id: assistantId
          });
          
          this.logger.info(`✅ Run ${run.id} criado com sucesso`, logContext);
          return { 
            success: true, 
            message: `Mensagem adicionada ao thread e run ${run.id} iniciado com sucesso` 
          };
        } catch (runError: any) {
          // Capturar detalhes do erro para análise
          const errorMessage = runError.message || 'Erro desconhecido';
          const errorStatus = runError.status || '';
          const errorCode = runError.code || '';
          const errorType = runError.type || '';
          
          this.logger.error('⚠️ Erro ao criar run após adicionar mensagem humana:', {
            ...logContext,
            errorMessage,
            errorStatus,
            errorCode,
            errorType,
            threadId,
            assistantId
          });
          
          // A mensagem foi adicionada com sucesso, então retornamos sucesso parcial
          return { 
            success: true, 
            message: `Mensagem adicionada ao thread, mas ocorreu erro ao criar run: ${errorMessage}` 
          };
        }
      }
      
      this.logger.info('🔵 FIM DA ADIÇÃO DE MENSAGEM HUMANA AO THREAD', logContext);
      return { success: true, message: 'Mensagem adicionada ao thread com sucesso' };
    } catch (error: any) {
      this.logger.error('❌ Erro ao adicionar mensagem humana ao thread:', error);
      return { 
        success: false, 
        message: `Erro ao adicionar mensagem ao thread: ${error.message || 'Erro desconhecido'}` 
      };
    }
  }
}

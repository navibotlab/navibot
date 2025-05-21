import { PrismaClient, Prisma } from '@prisma/client';
import { WhatsAppCloudApiService } from './whatsapp-cloud-api';
import { structuredLog, LogContext } from './whatsapp-cloud-logger';
import { splitTextIntoBlocks } from './whatsapp-cloud-formatter';
import { WhatsAppCloudMessageStorage, SimpleLogger } from './whatsapp-cloud-message-storage';

/**
 * Classe responsável por gerenciar o envio de respostas para o WhatsApp
 * e o salvamento no banco de dados.
 */
export class WhatsAppCloudResponseSender {
  private prisma: PrismaClient;
  private whatsappCloud: WhatsAppCloudApiService;
  private messageStorage: WhatsAppCloudMessageStorage;
  private readonly BLOCK_DELAY = 3000; // 3 segundos entre blocos

  constructor(prisma: PrismaClient, whatsappCloud: WhatsAppCloudApiService) {
    this.prisma = prisma;
    this.whatsappCloud = whatsappCloud;
    
    // Criar um logger estruturado para o messageStorage
    const logger: SimpleLogger = {
      info: (message: string, context?: any) => structuredLog(context || {}, 'info', message),
      warn: (message: string, context?: any) => structuredLog(context || {}, 'warn', message),
      error: (message: string, context?: any) => structuredLog(context || {}, 'error', message)
    };
    
    this.messageStorage = new WhatsAppCloudMessageStorage(prisma, logger);
  }

  /**
   * Salva a resposta no banco de dados e envia para o usuário via WhatsApp
   */
  async saveAndSendResponse(
    response: string, 
    conversationId: string, 
    phone: string, 
    correlationId: string
  ): Promise<void> {
    const logContext: LogContext = { 
      correlationId, 
      messageId: '', 
      phone 
    };

    // Aguardar um tempo antes de enviar a resposta para simular digitação
    const responseDelay = Math.random() * 5000 + 7000; // Entre 7 e 12 segundos
    structuredLog(logContext, 'info', `⏳ Aguardando ${responseDelay/1000} segundos antes de enviar a resposta...`);
    await new Promise(resolve => setTimeout(resolve, responseDelay));

    // Dividir a resposta em blocos para envio
    structuredLog(logContext, 'info', '\n=== INICIANDO ENVIO DOS BLOCOS ===');
    const blocks = splitTextIntoBlocks(response);
    structuredLog(logContext, 'info', `📦 Total de blocos para envio: ${blocks.length}`);

    // Enviar cada bloco
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      structuredLog(logContext, 'info', `\n📤 Enviando bloco ${i + 1} de ${blocks.length} (${block.length} caracteres)...`);
      const result = await this.whatsappCloud.sendText(phone, block);
      
      // Salvar a mensagem no banco com o ID externo
      if (result?.messages?.[0]?.id) {
        // Usar o messageStorage para salvar a resposta do agente
        await this.messageStorage.saveAgentResponse(
          conversationId,
          block,
          result.messages[0].id,
          logContext
        );
      }
      
      // Adicionar atraso entre blocos se houver mais de um bloco
      if (blocks.length > 1 && i < blocks.length - 1) {
        structuredLog(logContext, 'info', `⏳ Aguardando ${this.BLOCK_DELAY/1000} segundos antes do próximo bloco...`);
        await new Promise(resolve => setTimeout(resolve, this.BLOCK_DELAY));
      }
    }
    
    structuredLog(logContext, 'info', '\n✅ Todos os blocos enviados com sucesso');
    structuredLog(logContext, 'info', '=====================================\n');
  }
} 
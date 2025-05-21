import { PrismaClient } from '@prisma/client';
import { structuredLog, LogContext } from './whatsapp-cloud-logger';
import { processedMessagesCache } from './whatsapp-cloud-cache';
import { Prisma } from '@prisma/client';
import { WhatsAppCloudCacheKeyGenerator } from './whatsapp-cloud-cache-key-generator';
import { TIME_CONSTANTS } from './whatsapp-cloud-constants';

/**
 * Classe responsável por verificar a duplicidade de mensagens do WhatsApp
 * para evitar processamento e envio de respostas duplicadas.
 */
export class WhatsAppCloudMessageDuplicityChecker {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Verifica se uma mensagem já foi processada anteriormente,
   * consultando o cache e o banco de dados.
   */
  async isMessageDuplicate(
    messageId: string | undefined,
    audioId: string | undefined,
    imageId: string | undefined,
    logContext: LogContext
  ): Promise<boolean> {
    // Validar se a mensagem tem um ID
    if (!messageId) {
      structuredLog(logContext, 'warn', 'MessageId não fornecido');
      return false; // Não podemos verificar duplicação sem ID
    }

    // Log para debug
    structuredLog(logContext, 'info', 'Verificando duplicidade com IDs', {
      messageId,
      audioId,
      imageId
    });

    // Gerar chave de cache para o messageId
    const messageKey = WhatsAppCloudCacheKeyGenerator.getMessageKey(messageId);
    
    // Verificar primeiro pelo messageId (que é o mais confiável)
    if (processedMessagesCache.get(messageKey)) {
      structuredLog(logContext, 'info', 'Mensagem já processada (cache em memória - messageId)', {
        messageId
      });
      return true;
    }

    // Verificar no banco de dados apenas pelo messageId
    try {
      const existingMessage = await this.prisma.messages.findFirst({
        where: {
          external_id: messageId
        } as any,
        select: { id: true }
      });

      if (existingMessage) {
        structuredLog(logContext, 'info', 'Mensagem já processada (banco de dados - messageId)', {
          messageId,
          dbMessageId: existingMessage.id
        });
        
        // Adicionar ao cache para agilizar verificações futuras
        processedMessagesCache.set(messageKey, true);
        
        return true;
      }
      
      // Se não encontrou pelo messageId, tentamos pelos IDs secundários
      if (audioId || imageId) {
        const secondaryIds = [audioId, imageId].filter(Boolean) as string[];
        
        // Para os IDs secundários, usamos o cache
        for (const id of secondaryIds) {
          const mediaType = id === audioId ? 'audio' : 'image';
          const mediaKey = WhatsAppCloudCacheKeyGenerator.getMediaKey(mediaType, id);
          
          if (processedMessagesCache.get(mediaKey)) {
            structuredLog(logContext, 'info', 'Mídia já processada (cache em memória)', {
              mediaId: id,
              mediaType
            });
            return true;
          }
        }
        
        // Se não encontrar no cache, buscar no banco
        const mediaQuery = secondaryIds.map(id => `external_id = '${id}'`).join(' OR ');
        if (mediaQuery) {
          const existingMedia = await this.prisma.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM messages 
            WHERE ${Prisma.raw(mediaQuery)}
            LIMIT 1
          `;
          
          if (existingMedia && existingMedia.length > 0) {
            structuredLog(logContext, 'info', 'Mídia já processada (banco de dados)', {
              mediaIds: secondaryIds,
              dbMessageId: existingMedia[0].id
            });
            
            // Adicionar ao cache
            secondaryIds.forEach(id => {
              const mediaType = id === audioId ? 'audio' : 'image';
              const mediaKey = WhatsAppCloudCacheKeyGenerator.getMediaKey(mediaType, id);
              processedMessagesCache.set(mediaKey, true);
            });
            
            return true;
          }
        }
      }
    } catch (error) {
      structuredLog(logContext, 'error', 'Erro ao verificar mensagem no banco de dados', error);
      // Em caso de erro na verificação, assumimos que não é duplicada para evitar perda de mensagens
      return false;
    }

    structuredLog(logContext, 'info', 'Mensagem não encontrada no cache nem no banco, processando como nova', {
      messageId
    });
    return false;
  }
  
  /**
   * Verifica se uma mensagem é muito antiga para ser processada
   */
  isMessageTooOld(timestamp: string | undefined, maxAgeInSeconds: number = TIME_CONSTANTS.MAX_MESSAGE_AGE_SECONDS, logContext: LogContext): boolean {
    if (!timestamp) {
      return false;
    }
    
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const messageTimestamp = parseInt(timestamp);

    if (currentTimestamp - messageTimestamp > maxAgeInSeconds) {
      structuredLog(logContext, 'info', 'Mensagem muito antiga, ignorando...', {
        messageTime: new Date(messageTimestamp * 1000).toISOString(),
        currentTime: new Date(currentTimestamp * 1000).toISOString(),
        diffSeconds: currentTimestamp - messageTimestamp
      });
      return true;
    }
    
    return false;
  }
} 
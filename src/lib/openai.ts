import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { headers } from 'next/headers';

/**
 * Obtém o workspaceId do contexto ou usa o workspaceId fornecido
 */
async function getWorkspaceId(providedWorkspaceId?: string): Promise<string | null> {
  if (providedWorkspaceId) {
    return providedWorkspaceId;
  }
  
  try {
    const headersList = await headers();
    return headersList.get('x-workspace-id');
  } catch (error) {
    logger.warn('Não foi possível obter workspaceId do contexto:', error);
    return null;
  }
}

/**
 * Lê a chave da API da OpenAI do banco de dados para o workspace especificado
 */
async function readApiKey(workspaceId?: string): Promise<string | null> {
  try {
    const wsId = await getWorkspaceId(workspaceId);
    
    if (!wsId) {
      logger.warn('Workspace não disponível para buscar configuração OpenAI');
      return null;
    }
    
    const config = await prisma.systemConfig.findFirst({
      where: { 
        key: 'OPENAI_API_KEY',
        workspaceId: wsId
      }
    });
    
    if (!config?.value) {
      // Fallback para a chave global (legado)
      // Não podemos mais usar findUnique com apenas key
      // Precisamos usar findFirst para sistemas legados sem workspaceId
      const globalConfig = await prisma.systemConfig.findFirst({
        where: { 
          key: 'OPENAI_API_KEY'
        },
        orderBy: {
          createdAt: 'asc' // Pegar a configuração mais antiga
        },
        take: 1
      });
      return globalConfig?.value || null;
    }
    
    return config.value;
  } catch (error) {
    logger.error('Erro ao ler chave da API da OpenAI:', error);
    return null;
  }
}

/**
 * Obtém uma instância do cliente OpenAI
 * Usa a chave da API armazenada no banco de dados para o workspace do usuário
 */
export async function getOpenAIClient(workspaceId?: string): Promise<OpenAI | null> {
  try {
    const apiKey = await readApiKey(workspaceId);
    if (!apiKey) {
      logger.error('Chave da API da OpenAI não encontrada');
      return null;
    }

    const client = new OpenAI({ apiKey });
    // Testar a conexão
    await client.models.list();
    return client;
  } catch (error) {
    logger.error('Erro ao inicializar cliente OpenAI:', error);
    return null;
  }
}

/**
 * Versão síncrona da função getOpenAIClient
 * Usa a chave da API do ambiente
 * Útil para contextos onde não é possível usar async/await
 */
export function getOpenAIClientSync(): OpenAI | null {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logger.error('Chave da API da OpenAI não encontrada no ambiente');
      return null;
    }

    return new OpenAI({ apiKey });
  } catch (error) {
    logger.error('Erro ao inicializar cliente OpenAI (sync):', error);
    return null;
  }
} 
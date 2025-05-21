import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/app/api/integrations/openai/route';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Listar Vector Stores
export async function GET(request: Request) {
  logger.info('Buscando armazenamentos de vetores');
  
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    logger.info(`Filtrando armazenamentos de vetores para workspace: ${workspaceId}`);
    
    const openai = await getOpenAIClient();
    
    if (!openai) {
      logger.error('Cliente OpenAI não configurado');
      return NextResponse.json(
        { vectorStores: [], error: 'Cliente OpenAI não configurado' },
        { status: 200 } // Retornar 200 para não quebrar o frontend
      );
    }

    // Verificar se a API vectorStores existe
    // @ts-ignore - Ignorando erro de tipagem para verificar propriedades dinâmicas
    if (!openai.vectorStores) {
      logger.warn('API de armazenamento de vetores não disponível na versão atual da OpenAI');
      // Retornar uma lista vazia em vez de erro para não quebrar a interface
      return NextResponse.json({ 
        vectorStores: [],
        message: 'API de armazenamento de vetores não disponível na versão atual da OpenAI',
        available: false
      });
    }

    try {
      // Buscar todos os vector stores
      // @ts-ignore - A API pode ter mudado, ignorando erros de tipagem
      const vectorStores = await openai.vectorStores.list();
      
      if (!vectorStores || !vectorStores.data) {
        logger.warn('A API da OpenAI retornou um formato inesperado para vectorStores');
        return NextResponse.json({ vectorStores: [] });
      }
      
      // Buscar vector stores associados ao workspace atual
      const workspaceVectorStores = await prisma.vector_stores.findMany({
        where: {
          workspaceId: workspaceId
        }
      });
      
      const workspaceVectorStoreIds = new Set(workspaceVectorStores.map(vs => vs.openaiId));
      
      // Filtrar apenas os vector stores do workspace atual
      const filteredVectorStores = vectorStores.data.filter(store => 
        workspaceVectorStoreIds.has(store.id)
      );
      
      logger.info(`${filteredVectorStores.length} armazenamentos de vetores encontrados para o workspace`);
      
      // Buscar os arquivos para cada armazenamento
      const vectorStoresWithFiles = await Promise.all(
        filteredVectorStores.map(async (store: any) => {
          try {
            // @ts-ignore - A API pode ter mudado, ignorando erros de tipagem
            const filesResponse = await openai.vectorStores.files.list(store.id);
            return {
              ...store,
              files: filesResponse.data,
              file_count: filesResponse.data.length
            };
          } catch (error) {
            logger.error(`Erro ao buscar arquivos para o armazenamento ${store.id}: ${error}`);
            return {
              ...store,
              files: [],
              file_count: 0
            };
          }
        })
      );
      
      return NextResponse.json({ vectorStores: vectorStoresWithFiles });
    } catch (listError: any) {
      logger.error(`Erro específico ao listar armazenamentos: ${listError.message}`, listError);
      
      // Retornar uma lista vazia em vez de erro para não quebrar a interface
      return NextResponse.json({ 
        vectorStores: [],
        error: listError.message,
        message: 'Erro ao listar armazenamentos de vetores, retornando lista vazia'
      });
    }
  } catch (error: any) {
    logger.error(`Erro ao buscar armazenamentos de vetores: ${error.message || 'Erro desconhecido'}`, error);
    // Retornar uma lista vazia em vez de erro para não quebrar a interface
    return NextResponse.json({ 
      vectorStores: [],
      error: error.message || 'Erro ao buscar armazenamentos de vetores'
    });
  }
}

// Criar Vector Store
export async function POST(request: Request) {
  logger.info('Criando novo armazenamento de vetores');
  
  try {
    const body = await request.json();
    logger.info(`Dados recebidos: ${JSON.stringify(body)}`);
    
    const { name, fileIds } = body;
    
    if (!name || !name.trim()) {
      logger.warn('Nome do armazenamento não fornecido');
      return NextResponse.json(
        { error: 'Nome do armazenamento é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      logger.warn('Nenhum arquivo selecionado');
      return NextResponse.json(
        { error: 'Pelo menos um arquivo deve ser selecionado' },
        { status: 400 }
      );
    }
    
    logger.info(`Tentando criar armazenamento "${name}" com ${fileIds.length} arquivo(s): ${JSON.stringify(fileIds)}`);
    
    const openai = await getOpenAIClient();
    const { workspaceId } = await getWorkspaceFromContext();
    
    if (!openai) {
      logger.error('Cliente OpenAI não configurado');
      return NextResponse.json(
        { error: 'Cliente OpenAI não configurado' },
        { status: 200 }
      );
    }
    
    // Verificar se a API vectorStores existe
    // @ts-ignore - Ignorando erro de tipagem para verificar propriedades dinâmicas
    if (!openai.vectorStores) {
      logger.error('API de armazenamento de vetores não disponível na versão atual da OpenAI');
      
      // Retornar uma mensagem amigável para o usuário
      return NextResponse.json(
        { 
          error: 'API de armazenamento de vetores não disponível na versão atual da OpenAI',
          message: 'Esta funcionalidade requer uma versão mais recente da API OpenAI. Por favor, atualize a biblioteca OpenAI para a versão mais recente ou entre em contato com o suporte da OpenAI.',
          suggestion: 'Você pode usar bibliotecas alternativas como Pinecone, Chroma, FAISS ou LanceDB para armazenamento de vetores.'
        },
        { status: 200 }
      );
    }
    
    // Criar o vector store
    try {
      logger.info(`Tentando criar armazenamento com nome "${name}" e arquivos: ${JSON.stringify(fileIds)}`);
      
      // @ts-ignore - A API pode ter mudado, ignorando erros de tipagem
      const vectorStore = await openai.vectorStores.create({
        name,
        file_ids: fileIds
      });
      
      logger.info(`Armazenamento de vetores criado com sucesso: ${vectorStore.id}`);
      
      // Buscar os arquivos associados ao vector store para retornar informações completas
      // @ts-ignore - A API pode ter mudado, ignorando erros de tipagem
      const filesResponse = await openai.vectorStores.files.list(vectorStore.id);
      
      // Salvar referência no banco de dados
      try {
        await prisma.vector_stores.create({
          data: {
            id: uuidv4(),
            name: vectorStore.name,
            description: name, // Usando o nome como descrição padrão
            openaiId: vectorStore.id,
            files: filesResponse.data,
            workspaceId: workspaceId,
            updatedAt: new Date()
          }
        });
        logger.info(`Armazenamento de vetores salvo no banco de dados: ${vectorStore.id}`);
      } catch (dbError) {
        logger.error(`Erro ao salvar armazenamento no banco de dados: ${dbError}`, dbError);
        // Continuamos mesmo com erro do banco para não bloquear o uso
      }
      
      // Retornar o armazenamento criado com informações completas
      return NextResponse.json({ 
        success: true, 
        vectorStore: {
          ...vectorStore,
          files: filesResponse.data
        }
      });
    } catch (createError: any) {
      logger.error(`Erro específico ao criar armazenamento de vetores: ${createError.message}`, createError);
      
      // Tentar método alternativo se disponível
      try {
        logger.info('Tentando método alternativo para criar armazenamento de vetores');
        
        // @ts-ignore - Tentando método alternativo
        const vectorStore = await openai.vectorStores.create({
          name,
          metadata: { description: `Armazenamento criado em ${new Date().toISOString()}` }
        });
        
        logger.info(`Armazenamento criado com sucesso: ${vectorStore.id}, agora adicionando arquivos`);
        
        // Adicionar arquivos um por um
        for (const fileId of fileIds) {
          try {
            // @ts-ignore - Tentando adicionar arquivo
            await openai.vectorStores.files.create(vectorStore.id, { file_id: fileId });
            logger.info(`Arquivo ${fileId} adicionado ao armazenamento ${vectorStore.id}`);
          } catch (fileError: any) {
            logger.error(`Erro ao adicionar arquivo ${fileId}: ${fileError.message}`);
          }
        }
        
        // Buscar os arquivos associados ao vector store para retornar informações completas
        // @ts-ignore - A API pode ter mudado, ignorando erros de tipagem
        const filesResponse = await openai.vectorStores.files.list(vectorStore.id);
        
        // Salvar referência no banco de dados
        try {
          await prisma.vector_stores.create({
            data: {
              id: uuidv4(),
              name: vectorStore.name,
              description: name, // Usando o nome como descrição padrão
              openaiId: vectorStore.id,
              files: filesResponse.data,
              workspaceId: workspaceId,
              updatedAt: new Date()
            }
          });
          logger.info(`Armazenamento de vetores (alt) salvo no banco de dados: ${vectorStore.id}`);
        } catch (dbError) {
          logger.error(`Erro ao salvar armazenamento alternativo no banco de dados: ${dbError}`, dbError);
          // Continuamos mesmo com erro do banco para não bloquear o uso
        }
        
        // Retornar o armazenamento criado com informações completas
        return NextResponse.json({ 
          success: true, 
          vectorStore: {
            ...vectorStore,
            files: filesResponse.data
          },
          message: 'Armazenamento criado usando método alternativo'
        });
      } catch (alternativeError: any) {
        logger.error(`Método alternativo também falhou: ${alternativeError.message}`);
        throw alternativeError;
      }
    }
  } catch (error: any) {
    logger.error(`Erro ao criar armazenamento de vetores: ${error.message || 'Erro desconhecido'}`, error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar armazenamento de vetores' },
      { status: 200 }
    );
  }
} 
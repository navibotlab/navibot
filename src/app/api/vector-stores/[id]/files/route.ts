import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/app/api/integrations/openai/route';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Adicionar arquivo a um Vector Store
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: vectorStoreId } = await params;
  logger.info(`Adicionando arquivo ao armazenamento de vetores ${vectorStoreId}`);
  
  try {
    const openai = await getOpenAIClient();
    
    if (!openai) {
      logger.error('Cliente OpenAI não configurado');
      return NextResponse.json(
        { error: 'Cliente OpenAI não configurado' },
        { status: 200 }
      );
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    const { file_id } = body;
    
    if (!file_id) {
      logger.warn('ID do arquivo não fornecido');
      return NextResponse.json(
        { error: 'ID do arquivo é obrigatório' },
        { status: 400 }
      );
    }

    logger.info(`Tentando adicionar arquivo ${file_id} ao armazenamento ${vectorStoreId}`);

    // Adicionar arquivo ao vector store
    // @ts-ignore - A API pode não estar corretamente tipada
    const response = await openai.vectorStores.files.create(
      vectorStoreId,
      { file_id }
    );
    
    logger.info(`Arquivo ${file_id} adicionado ao armazenamento ${vectorStoreId}`);
    
    return NextResponse.json({
      success: true,
      file: response
    });
  } catch (error: any) {
    logger.error(`Erro ao adicionar arquivo ao armazenamento ${vectorStoreId}:`, error);
    return NextResponse.json(
      { 
        error: 'Erro ao adicionar arquivo ao armazenamento de vetores',
        message: error.message || 'Erro desconhecido'
      },
      { status: 200 }
    );
  }
}

// Listar arquivos de um Vector Store
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: vectorStoreId } = await params;
  logger.info(`Buscando arquivos do armazenamento de vetores ${vectorStoreId}`);
  
  try {
    const openai = await getOpenAIClient();
    
    if (!openai) {
      logger.error('Cliente OpenAI não configurado');
      return NextResponse.json(
        { error: 'Cliente OpenAI não configurado' },
        { status: 500 }
      );
    }

    // Buscar arquivos do vector store
    // @ts-ignore - A API pode não estar corretamente tipada
    const response = await openai.vectorStores.files.list(vectorStoreId);
    
    logger.info(`${response.data.length} arquivos encontrados no armazenamento ${vectorStoreId}`);
    
    // Buscar detalhes completos de cada arquivo
    const filesWithDetails = await Promise.all(
      response.data.map(async (file: any) => {
        try {
          // Buscar detalhes do arquivo
          const fileDetails = await openai.files.retrieve(file.id);
          logger.info(`Detalhes do arquivo ${file.id} obtidos com sucesso`);
          
          return {
            ...file,
            ...fileDetails,
            filename: fileDetails.filename || file.filename || `Arquivo ${file.id.substring(0, 8)}`
          };
        } catch (error) {
          logger.error(`Erro ao buscar detalhes do arquivo ${file.id}:`, error);
          return file;
        }
      })
    );
    
    return NextResponse.json({
      success: true,
      files: filesWithDetails
    });
  } catch (error: any) {
    logger.error(`Erro ao buscar arquivos do armazenamento ${vectorStoreId}:`, error);
    return NextResponse.json(
      { 
        error: 'Erro ao buscar arquivos do armazenamento de vetores',
        message: error.message || 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 
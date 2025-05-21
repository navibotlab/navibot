import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/app/api/integrations/openai/route';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  logger.info(`Excluindo armazenamento de vetores: ${id}`);
  
  try {
    const openai = await getOpenAIClient();
    
    if (!openai) {
      logger.error('Cliente OpenAI não configurado');
      return NextResponse.json(
        { error: 'Cliente OpenAI não configurado' },
        { status: 200 }
      );
    }
    
    // Excluir o vector store
    // @ts-ignore - A API pode ter mudado, ignorando erros de tipagem
    await openai.vectorStores.del(id);
    
    logger.info(`Armazenamento de vetores excluído: ${id}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Armazenamento de vetores excluído com sucesso'
    });
  } catch (error: any) {
    logger.error(`Erro ao excluir armazenamento de vetores ${id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Erro ao excluir armazenamento de vetores' },
      { status: 200 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  logger.info(`Buscando detalhes do armazenamento de vetores: ${id}`);
  
  try {
    const openai = await getOpenAIClient();
    
    if (!openai) {
      logger.error('Cliente OpenAI não configurado');
      return NextResponse.json(
        { error: 'Cliente OpenAI não configurado' },
        { status: 200 }
      );
    }
    
    // Buscar o vector store
    // @ts-ignore - A API pode ter mudado, ignorando erros de tipagem
    const vectorStore = await openai.vectorStores.retrieve(id);
    
    // Buscar os arquivos associados ao vector store
    // @ts-ignore - A API pode ter mudado, ignorando erros de tipagem
    const filesResponse = await openai.vectorStores.files.list(id);
    
    logger.info(`Armazenamento de vetores encontrado: ${id} com ${filesResponse.data.length} arquivos`);
    
    return NextResponse.json({ 
      vectorStore: {
        ...vectorStore,
        files: filesResponse.data
      }
    });
  } catch (error: any) {
    logger.error(`Erro ao buscar armazenamento de vetores ${id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar armazenamento de vetores' },
      { status: 200 }
    );
  }
} 
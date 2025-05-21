import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/app/api/integrations/openai/route';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Remover arquivo de um Vector Store
export async function DELETE(
  request: Request,
  { params }: { params: { id: string, fileId: string } }
) {
  const { id, fileId } = params;
  logger.info(`Removendo arquivo ${fileId} do armazenamento de vetores ${id}`);
  
  try {
    const openai = await getOpenAIClient();
    
    if (!openai) {
      logger.error('Cliente OpenAI não configurado');
      return NextResponse.json(
        { error: 'Cliente OpenAI não configurado' },
        { status: 200 }
      );
    }

    // @ts-ignore - A API pode não estar corretamente tipada
    await openai.vectorStores.files.del(id, fileId);
    
    logger.info(`Arquivo ${fileId} removido do armazenamento ${id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Arquivo removido com sucesso'
    });
  } catch (error: any) {
    logger.error(`Erro ao remover arquivo do armazenamento de vetores:`, error);
    return NextResponse.json(
      { 
        error: 'Erro ao remover arquivo do armazenamento de vetores',
        message: error.message || 'Erro desconhecido'
      },
      { status: 200 }
    );
  }
} 
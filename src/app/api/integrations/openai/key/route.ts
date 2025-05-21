import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';

/**
 * Endpoint para obter a chave da API OpenAI completa
 * Usado apenas no modo de edição
 */
export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    console.log(`Obtendo chave da API OpenAI para workspace: ${workspaceId}`);

    // Buscar a configuração atual
    const config = await prisma.systemConfig.findFirst({
      where: {
        key: 'OPENAI_API_KEY',
        workspaceId
      }
    });

    // Se não houver configuração, retorna erro
    if (!config || !config.value) {
      return NextResponse.json(
        { error: 'Chave da API não encontrada' },
        { status: 404 }
      );
    }

    // Retorna a chave completa
    return NextResponse.json({
      key: config.value
    });
  } catch (error) {
    console.error('Erro ao obter chave da API:', error);
    return NextResponse.json(
      { error: 'Erro ao obter chave da API' },
      { status: 500 }
    );
  }
} 
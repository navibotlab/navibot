import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';

export async function DELETE() {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    console.log(`Excluindo configuração OpenAI para workspace: ${workspaceId}`);

    // Verificar se existe configuração
    const existingConfig = await prisma.systemConfig.findFirst({
      where: {
        key: 'OPENAI_API_KEY',
        workspaceId
      }
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Configuração não encontrada' },
        { status: 404 }
      );
    }

    // Excluir a configuração
    await prisma.systemConfig.delete({
      where: { id: existingConfig.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuração excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir configuração OpenAI:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir configuração' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { getOpenAIClient } from '../integrations/openai/route';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const openai = await getOpenAIClient();
    
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI não configurada' },
        { status: 200 }
      );
    }

    // Buscar arquivos da OpenAI
    const response = await openai.files.list();
    
    // Filtrar apenas os arquivos associados ao workspace atual
    const workspaceFiles = await prisma.files.findMany({
      where: {
        workspaceId: workspaceId
      }
    });
    
    const workspaceFileIds = new Set(workspaceFiles.map(file => file.fileId));
    
    // Filtrar a resposta para incluir apenas os arquivos do workspace
    const filteredFiles = response.data.filter(file => 
      workspaceFileIds.has(file.id)
    );
    
    return NextResponse.json({
      success: true,
      files: filteredFiles
    });
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    return NextResponse.json(
      { error: 'Erro ao listar arquivos', files: [] },
      { status: 200 }
    );
  }
} 
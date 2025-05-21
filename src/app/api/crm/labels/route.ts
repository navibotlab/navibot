import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';

// GET - Listar todas as etiquetas
export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace não encontrado' },
        { status: 400 }
      );
    }
    
    // Buscar todas as etiquetas (tags) do workspace atual
    const tags = await prisma.contactTags.findMany({
      where: { 
        workspaceId 
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // Mapear os resultados para o formato esperado pelo frontend
    const labels = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      description: tag.description
    }));
    
    return NextResponse.json(labels);
  } catch (error) {
    console.error('Erro ao buscar etiquetas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar etiquetas' },
      { status: 500 }
    );
  }
} 
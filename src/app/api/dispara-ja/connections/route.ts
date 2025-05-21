import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';

// Endpoint para listar as conexões do Dispara Já
export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceFromContext();

    // Buscar as conexões do Dispara Já no banco de dados
    const connections = await prisma.$queryRaw`
      SELECT 
        djc.*,
        a.name as "agentName"
      FROM "dispara_ja_connections" djc
      JOIN "agents" a ON djc."agentId" = a.id
      WHERE a."workspaceId" = ${workspaceId}
      ORDER BY djc."createdAt" DESC
    `;

    // Retornar as conexões
    return NextResponse.json(connections);
  } catch (error) {
    console.error('Erro ao buscar conexões Dispara Já:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar conexões' },
      { status: 500 }
    );
  }
}

// Endpoint para atualizar o status de uma conexão
export async function PUT(req: Request) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const { id, status } = await req.json();

    // Validar os dados recebidos
    if (!id) {
      return NextResponse.json(
        { error: 'ID da conexão não fornecido' },
        { status: 400 }
      );
    }

    // Verificar se a conexão existe e pertence ao workspace
    const connection = await prisma.$queryRaw<{ id: string }[]>`
      SELECT djc.id
      FROM dispara_ja_connections djc
      JOIN agents a ON djc."agentId" = a.id
      WHERE djc.id = ${id}
      AND a."workspaceId" = ${workspaceId}
    `;

    if (!connection || connection.length === 0) {
      return NextResponse.json(
        { error: 'Conexão não encontrada neste workspace' },
        { status: 404 }
      );
    }

    // Atualizar a conexão
    const updatedConnection = await prisma.$executeRaw`
      UPDATE dispara_ja_connections
      SET status = ${status},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      connection: updatedConnection
    });
  } catch (error) {
    console.error('Erro ao atualizar conexão Dispara Já:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar conexão' },
      { status: 500 }
    );
  }
} 
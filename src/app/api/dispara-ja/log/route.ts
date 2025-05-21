import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const { message, type, timestamp, connectionId } = await request.json();

    if (!connectionId) {
      return NextResponse.json(
        { error: 'ID da conexão é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a conexão pertence ao workspace
    const connection = await prisma.$queryRaw<{ id: string }[]>`
      SELECT djc.id
      FROM dispara_ja_connections djc
      JOIN agents a ON djc."agentId" = a.id
      WHERE djc.id = ${connectionId}
      AND a."workspaceId" = ${workspaceId}
    `;

    if (!connection || connection.length === 0) {
      return NextResponse.json(
        { error: 'Conexão não encontrada neste workspace' },
        { status: 404 }
      );
    }

    // Salvar o log no banco de dados
    const log = await prisma.$executeRaw`
      INSERT INTO dispara_ja_logs (
        id,
        message,
        type,
        timestamp,
        "connectionId",
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        ${message},
        ${type},
        ${new Date(timestamp)},
        ${connectionId},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Erro ao salvar log:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar log' },
      { status: 500 }
    );
  }
} 
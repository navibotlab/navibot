import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';

export async function POST(req: Request) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const { secret, token, sid, phoneNumber, unique, agentId } = await req.json();

    // Validar os dados recebidos
    if (!secret || !agentId) {
      return NextResponse.json(
        { error: 'Dados incompletos para salvar a conexão' },
        { status: 400 }
      );
    }

    // Verificar se o agente existe e pertence ao workspace
    const agent = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id 
      FROM agents 
      WHERE id = ${agentId}
      AND "workspaceId" = ${workspaceId}
    `;

    if (!agent || agent.length === 0) {
      return NextResponse.json(
        { error: 'Agente não encontrado neste workspace' },
        { status: 404 }
      );
    }

    // Verificar se já existe uma conexão com este agente
    const existingConnection = await prisma.$queryRaw<any[]>`
      SELECT djc.*
      FROM dispara_ja_connections djc
      JOIN agents a ON djc."agentId" = a.id
      WHERE djc."agentId" = ${agentId}
      AND a."workspaceId" = ${workspaceId}
    `;

    if (existingConnection && existingConnection.length > 0 && phoneNumber && existingConnection[0].phoneNumber === phoneNumber) {
      return NextResponse.json(
        { error: 'Já existe uma conexão com este número para este agente' },
        { status: 409 }
      );
    }

    // Preparar dados para nova conexão ou atualização
    const now = new Date();

    let connection;
    let message;

    // Verificar se é para atualizar uma conexão existente ou criar uma nova
    if (existingConnection && existingConnection.length > 0) {
      // Atualizar conexão existente
      await prisma.$executeRaw`
        UPDATE dispara_ja_connections
        SET 
          provider = 'DISPARA_JA',
          secret = ${secret},
          sid = ${sid || '3'},
          token = ${token || ''},
          "phoneNumber" = ${phoneNumber || ''},
          unique = ${unique || uuidv4()},
          status = ${phoneNumber ? 'ativo' : 'pendente'},
          updated_at = ${now}
        WHERE id = ${existingConnection[0].id}
        RETURNING *
      `;
      message = 'Conexão atualizada com sucesso';
      connection = { id: existingConnection[0].id };
    } else {
      // Criar nova conexão
      const result = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO dispara_ja_connections (
          id,
          provider,
          secret,
          sid,
          token,
          "phoneNumber",
          unique,
          status,
          "agentId",
          created_at,
          updated_at
        )
        VALUES (
          ${uuidv4()},
          'DISPARA_JA',
          ${secret},
          ${sid || '3'},
          ${token || ''},
          ${phoneNumber || ''},
          ${unique || uuidv4()},
          ${phoneNumber ? 'ativo' : 'pendente'},
          ${agentId},
          ${now},
          ${now}
        )
        RETURNING *
      `;
      message = 'Conexão criada com sucesso';
      connection = { id: result[0]?.id };
    }

    return NextResponse.json({
      success: true,
      connectionId: connection.id,
      message
    });
  } catch (error) {
    console.error('Erro ao salvar conexão:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar conexão' },
      { status: 500 }
    );
  }
} 
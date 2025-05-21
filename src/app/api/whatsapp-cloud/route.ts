import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';
import { maskSensitiveData, safeLog } from '@/lib/utils/security';

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    console.log('Buscando conexões para o workspace:', workspaceId);
    
    // Usando Prisma Client em vez de SQL raw para evitar problemas com case sensitivity
    const connections = await prisma.whatsapp_cloud_connections.findMany({
      where: {
        workspaceId: workspaceId
      },
      include: {
        agents: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    console.log(`Encontradas ${connections.length} conexões`);
    
    // Formatando a saída para manter compatibilidade com a interface esperada pelo frontend
    const formattedConnections = connections.map((conn: any) => ({
      id: conn.id,
      phoneNumberId: conn.phoneNumberId,
      accessToken: conn.accessToken,
      agentId: conn.agentId,
      webhookUrl: conn.webhookUrl,
      verifyToken: conn.verify_token,
      status: conn.status,
      workspaceId: conn.workspaceId,
      agentName: conn.agents?.name || 'Agente desconhecido',
      created_at: conn.createdAt,
      updated_at: conn.updatedAt,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt
    }));

    // Apenas para logs, usando dados mascarados
    if (connections.length > 0) {
      safeLog('Exemplo de conexão:', formattedConnections[0]);
    }

    return NextResponse.json(formattedConnections);
  } catch (error) {
    console.error('Erro ao buscar conexões:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar conexões' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const data = await request.json();
    const { phoneNumberId, accessToken, agentId } = data;
    const verify_token = 'navibot';

    if (!phoneNumberId || !accessToken || !agentId) {
      return NextResponse.json(
        { error: 'phoneNumberId, accessToken e agentId são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o agent pertence ao workspace
    const agent = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM agents 
      WHERE id = ${agentId}
      AND "workspaceId" = ${workspaceId}
    `;

    if (!agent || agent.length === 0) {
      return NextResponse.json(
        { error: 'Agent não encontrado neste workspace' },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'URL base não configurada' },
        { status: 500 }
      );
    }

    const webhookUrl = `${baseUrl}/webhook/whatsapp-cloud/${phoneNumberId}`;

    // Verificar se já existe uma conexão com este phoneNumberId no workspace
    const existingConnection = await prisma.$queryRaw<{ id: string }[]>`
      SELECT wc.id
      FROM whatsapp_cloud_connections wc
      JOIN agents a ON wc."agentId" = a.id
      WHERE wc."phoneNumberId" = ${phoneNumberId}
      AND a."workspaceId" = ${workspaceId}
    `;

    if (existingConnection && existingConnection.length > 0) {
      return NextResponse.json(
        { error: 'Já existe uma conexão com este número de telefone neste workspace' },
        { status: 409 }
      );
    }

    // Criar nova conexão usando Prisma Client ao invés de raw query
    const connection = await prisma.$executeRaw`
      INSERT INTO whatsapp_cloud_connections (
        id,
        "phoneNumberId",
        "accessToken",
        "agentId",
        "verify_token",
        "webhookUrl",
        status,
        "workspaceId",
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        ${phoneNumberId},
        ${accessToken},
        ${agentId},
        ${verify_token},
        ${webhookUrl},
        'inactive',
        ${workspaceId},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(connection);
  } catch (error) {
    console.error('Erro ao criar conexão:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conexão' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return NextResponse.json(
        { error: 'ID da conexão é obrigatório' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { status } = data;

    if (!status || !['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use "active" ou "inactive"' },
        { status: 400 }
      );
    }

    // Verificar se a conexão existe e pertence ao workspace
    const existingConnection = await prisma.$queryRaw<{ id: string }[]>`
      SELECT wc.id
      FROM whatsapp_cloud_connections wc
      JOIN agents a ON wc."agentId" = a.id
      WHERE wc.id = ${id}
      AND a."workspaceId" = ${workspaceId}
    `;

    if (!existingConnection || existingConnection.length === 0) {
      return NextResponse.json(
        { error: 'Conexão não encontrada neste workspace' },
        { status: 404 }
      );
    }

    // Atualizar o status
    const updatedConnection = await prisma.$executeRaw`
      UPDATE whatsapp_cloud_connections
      SET status = ${status},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(updatedConnection);
  } catch (error) {
    console.error('Erro ao atualizar conexão:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar conexão' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return NextResponse.json(
        { error: 'ID da conexão é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a conexão existe e pertence ao workspace
    const existingConnection = await prisma.$queryRaw<{ id: string }[]>`
      SELECT wc.id
      FROM whatsapp_cloud_connections wc
      JOIN agents a ON wc."agentId" = a.id
      WHERE wc.id = ${id}
      AND a."workspaceId" = ${workspaceId}
    `;

    if (!existingConnection || existingConnection.length === 0) {
      return NextResponse.json(
        { error: 'Conexão não encontrada neste workspace' },
        { status: 404 }
      );
    }

    // Excluir a conexão
    await prisma.$executeRaw`
      DELETE FROM whatsapp_cloud_connections
      WHERE id = ${id}
    `;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao excluir conexão:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir conexão' },
      { status: 500 }
    );
  }
} 
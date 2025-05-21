import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceFromContext();

    const leads = await prisma.$queryRaw`
      SELECT l.*, 
             c.id as conversation_id,
             m.content as last_message,
             m.created_at as last_message_date
      FROM leads l
      LEFT JOIN conversations c ON c.lead_id = l.id
      LEFT JOIN messages m ON m.conversation_id = c.id
      WHERE l."workspaceId" = ${workspaceId}
      ORDER BY m.created_at DESC NULLS LAST
    `;

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar leads' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const data = await request.json();

    const lead = await prisma.$executeRaw`
      INSERT INTO leads ("name", "phone", "workspaceId", "createdAt", "updatedAt")
      VALUES (
        ${data.name || null},
        ${data.phone},
        ${workspaceId},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    return NextResponse.json(
      { error: 'Erro ao criar lead' },
      { status: 500 }
    );
  }
} 
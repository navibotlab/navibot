import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';

interface Conversation {
  id: string;
  leadId: string;
  leadName: string | null;
  leadPhone: string;
  leadPhoto: string | null;
  lastMessage: string | null;
  lastMessageTime: Date | null;
  unreadCount: bigint;
  workspaceId: string;
  agentId: string | null;
  agentName: string | null;
  agentImageUrl: string | null;
  channel: string | null;
}

// GET - Listar todas as conversas
export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceFromContext();

    // Buscar conversas com informações básicas
    const conversations = await prisma.$queryRaw<Conversation[]>`
      SELECT 
        c.id,
        c.lead_id as "leadId",
        l.name as "leadName",
        l.phone as "leadPhone",
        l.photo as "leadPhoto",
        (
          SELECT content 
          FROM messages m 
          WHERE m.conversation_id = c.id 
          ORDER BY m.created_at DESC 
          LIMIT 1
        ) as "lastMessage",
        (
          SELECT created_at 
          FROM messages m 
          WHERE m.conversation_id = c.id 
          ORDER BY m.created_at DESC 
          LIMIT 1
        ) as "lastMessageTime",
        CAST(
          (
            SELECT COUNT(*) 
            FROM messages m 
            WHERE m.conversation_id = c.id 
            AND m.read = false 
            AND m.sender = 'user'
          ) AS INTEGER
        ) as "unreadCount",
        c.channel
      FROM conversations c
      JOIN leads l ON c.lead_id = l.id
      WHERE l."workspaceId" = ${workspaceId}
      ORDER BY "lastMessageTime" DESC NULLS LAST
    `;
    
    // Buscar etiquetas para cada lead e enriquecer os dados das conversas
    const conversationsWithLabels = await Promise.all(
      conversations.map(async (conv) => {
        // Buscar etiquetas do lead usando o Prisma
        const leadWithTags = await prisma.leads.findUnique({
          where: {
            id: conv.leadId
          },
          include: {
            tags: {
              select: {
                id: true,
                name: true,
                color: true,
                description: true
              }
            }
          }
        });

        // Criar objeto com os dados da conversa e adicionar as etiquetas
        return {
          ...conv,
          // Converter os campos para o formato esperado
          lastMessageTime: conv.lastMessageTime ? new Date(conv.lastMessageTime).toISOString() : null,
          unreadCount: Number(conv.unreadCount),
          leadPhoto: conv.leadPhoto, // Garantir que a foto do lead seja incluída
          // Adicionar etiquetas transformadas
          // @ts-ignore - Ignorar erro de TypeScript relacionado à propriedade 'tags'
          labels: leadWithTags?.tags?.map(tag => ({
            id: tag.id,
            name: tag.name,
            color: tag.color,
            description: tag.description
          })) || []
        };
      })
    );

    return NextResponse.json(conversationsWithLabels);
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar conversas' },
      { status: 500 }
    );
  }
}

// POST - Criar nova conversa
export async function POST(request: Request) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const data = await request.json();
    const { leadId } = data;

    if (!leadId) {
      return NextResponse.json(
        { error: 'ID do lead é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o lead pertence ao workspace
    const lead = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM leads 
      WHERE id = ${leadId} 
      AND "workspaceId" = ${workspaceId}
    `;

    if (!lead || lead.length === 0) {
      return NextResponse.json(
        { error: 'Lead não encontrado neste workspace' },
        { status: 404 }
      );
    }

    // Verificar se já existe uma conversa para este lead
    const existingConversation = await prisma.$queryRaw<{ id: string }[]>`
      SELECT c.id 
      FROM conversations c
      JOIN leads l ON c.lead_id = l.id
      WHERE l.id = ${leadId}
      AND l."workspaceId" = ${workspaceId}
    `;

    if (existingConversation && existingConversation.length > 0) {
      return NextResponse.json(
        { error: 'Já existe uma conversa para este lead' },
        { status: 409 }
      );
    }

    // Criar nova conversa
    const conversation = await prisma.$executeRaw`
      INSERT INTO conversations (id, lead_id, created_at, updated_at)
      VALUES (gen_random_uuid(), ${leadId}, NOW(), NOW())
      RETURNING *
    `;

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conversa' },
      { status: 500 }
    );
  }
} 
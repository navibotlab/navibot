import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOpenAIClient } from '@/app/api/integrations/openai/route';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    console.log(`Listando assistentes para o workspace: ${workspaceId}`);

    // Obter o cliente OpenAI
    const openai = await getOpenAIClient();
    
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI não configurada para este workspace' },
        { status: 500 }
      );
    }

    // Buscar agentes deste workspace que têm assistantId
    const agents = await prisma.agent.findMany({
      where: { 
        workspaceId,
        NOT: { assistantId: null }
      },
      select: {
        id: true,
        name: true,
        assistantId: true,
        model: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log(`Encontrados ${agents.length} agentes com assistantId no workspace ${workspaceId}`);

    // Opcional: buscar informações detalhadas dos assistentes da OpenAI
    // Isso pode ser opcional dependendo das necessidades da aplicação
    const assistantsWithDetails = await Promise.all(
      agents.map(async (agent) => {
        try {
          if (agent.assistantId) {
            const assistantDetails = await openai.beta.assistants.retrieve(agent.assistantId);
            return {
              ...agent,
              openai_status: 'active',
              openai_details: {
                model: assistantDetails.model,
                created_at: new Date(assistantDetails.created_at * 1000).toISOString()
              }
            };
          }
          return {
            ...agent,
            openai_status: 'unknown'
          };
        } catch (error) {
          console.error(`Erro ao buscar detalhes do assistente ${agent.assistantId}:`, error);
          return {
            ...agent,
            openai_status: 'error',
            error: 'Não foi possível recuperar informações do assistente'
          };
        }
      })
    );

    return NextResponse.json(assistantsWithDetails);
  } catch (error) {
    console.error('Erro ao listar assistentes:', error);
    return NextResponse.json(
      { error: 'Erro ao listar assistentes' },
      { status: 500 }
    );
  }
} 
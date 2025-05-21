import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOpenAIClient } from '@/app/api/integrations/openai/route';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json(
        { error: 'ID do agente é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar o agente com seu assistantId no banco de dados
    // Garantindo que pertence ao workspace correto
    const agent = await prisma.agent.findFirst({
      where: { 
        id: agentId,
        workspaceId
      }
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agente não encontrado neste workspace' },
        { status: 404 }
      );
    }

    if (!agent.assistantId) {
      return NextResponse.json(
        { error: 'Este agente não possui um assistente OpenAI associado' },
        { status: 400 }
      );
    }

    // Obter o cliente OpenAI
    const openai = await getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI não configurada para este workspace' },
        { status: 500 }
      );
    }

    console.log(`Deletando assistente OpenAI ${agent.assistantId} para o agente ${agent.id} no workspace ${workspaceId}`);

    try {
      // Apagar o assistente na OpenAI
      await openai.beta.assistants.del(agent.assistantId);
      console.log(`Assistente ${agent.assistantId} apagado com sucesso na OpenAI`);
    } catch (openaiError) {
      console.error(`Erro ao apagar assistente na OpenAI: ${openaiError}`);
      // Continuamos mesmo com erro na OpenAI para remover a referência no banco de dados
    }

    // Atualizar o agente removendo o ID do assistente
    const updatedAgent = await prisma.agent.update({
      where: { id: agent.id },
      data: { assistantId: null }
    });

    return NextResponse.json({
      success: true,
      message: 'Assistente removido com sucesso',
      agent: {
        id: updatedAgent.id,
        name: updatedAgent.name
      }
    });
  } catch (error) {
    console.error('Erro ao apagar assistente OpenAI:', error);
    return NextResponse.json(
      { error: 'Erro ao apagar assistente OpenAI' },
      { status: 500 }
    );
  }
} 
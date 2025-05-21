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

    // Buscar o agente no banco de dados
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

    // Obter o cliente OpenAI
    const openai = await getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI não configurada para este workspace' },
        { status: 500 }
      );
    }

    // Preparar instruções para o assistente
    // Combinando diversas informações do agente para criar um prompt completo
    const instructions = `
# ${agent.name}
${agent.description || ''}

${agent.personalityObjective || ''}

${agent.agentSkills || ''}

${agent.restrictions || ''}

## Informações da Empresa
Nome: ${agent.companyName || ''}
Setor: ${agent.companySector || ''}
Website: ${agent.companyWebsite || ''}
Descrição: ${agent.companyDescription || ''}

## Tom de Voz
${agent.voiceTone || 'Profissional e amigável'}

## Função do Agente
${agent.agentFunction || ''}

## Informações do Produto
${agent.productInfo || ''}

## Mensagem Inicial Sugerida
${agent.initialMessage || ''}
    `.trim();

    console.log(`Criando assistente OpenAI para o agente ${agent.id} no workspace ${workspaceId}`);
    
    // Criar o assistente na OpenAI
    const assistant = await openai.beta.assistants.create({
      name: agent.name,
      instructions,
      model: agent.model || 'gpt-4o',
      temperature: agent.temperature || 0.7,
      tools: []
    });

    console.log(`Assistente criado com sucesso: ${assistant.id}`);

    // Atualizar o agente com o ID do assistente
    const updatedAgent = await prisma.agent.update({
      where: { id: agent.id },
      data: { assistantId: assistant.id }
    });

    return NextResponse.json({
      success: true,
      agent: {
        id: updatedAgent.id,
        name: updatedAgent.name,
        assistantId: updatedAgent.assistantId
      }
    });
  } catch (error) {
    console.error('Erro ao criar assistente OpenAI:', error);
    return NextResponse.json(
      { error: 'Erro ao criar assistente OpenAI' },
      { status: 500 }
    );
  }
} 
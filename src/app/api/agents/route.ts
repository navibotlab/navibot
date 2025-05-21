import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from '../integrations/openai/route'
import { prisma } from '@/lib/prisma'
import { getWorkspaceFromContext } from '@/lib/utils/workspace';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

interface AgentWithCounts {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string | null;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  total_conversations: bigint;
  total_leads: bigint;
  [key: string]: any;
}

const ALLOWED_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo'
]

// Lista de agentes de exemplo
const agents = [
  {
    id: "agent-1",
    name: "Atendimento",
    type: "customer-service",
    avatar: "/avatars/01.png",
    status: "ativo",
    createdAt: new Date(2023, 2, 10).toISOString(),
    updatedAt: new Date(2023, 4, 15).toISOString()
  },
  {
    id: "agent-2",
    name: "Vendas",
    type: "sales",
    avatar: "/avatars/02.png",
    status: "ativo",
    createdAt: new Date(2023, 3, 5).toISOString(),
    updatedAt: new Date(2023, 4, 20).toISOString()
  },
  {
    id: "agent-3",
    name: "Suporte Técnico",
    type: "support",
    avatar: "/avatars/03.png",
    status: "ativo",
    createdAt: new Date(2023, 1, 25).toISOString(),
    updatedAt: new Date(2023, 4, 10).toISOString()
  }
];

/**
 * Endpoint para listar agentes disponíveis
 * GET /api/agents
 */
export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceFromContext();

    const agents = await prisma.$queryRaw<AgentWithCounts[]>`
      SELECT 
        a.*,
        COUNT(DISTINCT c.id)::integer as total_conversations,
        COUNT(DISTINCT l.id)::integer as total_leads,
        COALESCE(a."image_url", '/images/avatar/avatar.png') as avatar,
        CASE 
          WHEN a."updatedAt" > NOW() - INTERVAL '5 minutes' THEN 'online'
          ELSE 'offline'
        END as status
      FROM "agents" a
      LEFT JOIN "dispara_ja_connections" djc ON djc."agentId" = a.id
      LEFT JOIN "conversations" c ON c."workspaceId" = a."workspaceId"
      LEFT JOIN "leads" l ON l."workspaceId" = a."workspaceId"
      WHERE a."workspaceId" = ${workspaceId}
      GROUP BY a.id
      ORDER BY a."createdAt" DESC
    `;

    // Converter BigInt para número e formatar datas, e mapear campos para camelCase
    const serializedAgents = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      internalName: agent.internal_name,
      imageUrl: agent.image_url,
      initialMessage: agent.initial_message,
      voiceTone: agent.voice_tone,
      model: agent.model,
      language: agent.language,
      timezone: agent.timezone,
      instructions: agent.system_prompt,
      temperature: agent.temperature,
      frequencyPenalty: agent.frequency_penalty,
      presencePenalty: agent.presence_penalty,
      topP: agent.top_p,
      maxMessages: agent.max_messages,
      maxTokens: agent.max_tokens,
      responseFormat: agent.response_format,
      companyName: agent.company_name,
      companySector: agent.company_sector,
      companyWebsite: agent.company_website,
      companyDescription: agent.company_description,
      personalityObjective: agent.personality_objective,
      agentSkills: agent.agent_skills,
      agentFunction: agent.agent_function,
      productInfo: agent.product_info,
      restrictions: agent.restrictions,
      assistantId: agent.assistant_id,
      vectorStoreId: agent.vectorStoreId,
      createdAt: agent.createdAt?.toISOString(),
      updatedAt: agent.updatedAt?.toISOString(),
      total_conversations: Number(agent.total_conversations || 0),
      total_leads: Number(agent.total_leads || 0),
      avatar: agent.avatar,
      status: agent.status
    }));

    return NextResponse.json(serializedAgents);
  } catch (error) {
    console.error('Erro ao buscar agents:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar agents' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const data = await request.json();

    // Preencher todos os campos do banco, mesmo que null
    const agentData = {
      id: crypto.randomUUID(),
      name: data.name || '',
      description: data.description || null,
      system_prompt: data.systemPrompt || null,
      workspaces: {
        connect: {
          id: workspaceId
        }
      },
      userId: data.userId || workspaceId,
      agent_function: data.agentFunction || null,
      agent_skills: data.agentSkills || null,
      assistant_id: null, // será preenchido após criar na OpenAI
      company_description: data.companyDescription || null,
      company_name: data.companyName || null,
      company_sector: data.companySector || null,
      company_website: data.companyWebsite || null,
      frequency_penalty: data.frequencyPenalty ?? 0.0,
      image_url: data.imageUrl || '/images/avatar/avatar.png',
      initial_message: data.initialMessage || null,
      internal_name: data.internalName || null,
      language: data.language || 'pt-BR',
      max_messages: data.maxMessages ?? 20,
      max_tokens: data.maxTokens ?? 5000,
      model: data.model || 'gpt-4-turbo',
      personality_objective: data.personalityObjective || null,
      presence_penalty: data.presencePenalty ?? 0.0,
      product_info: data.productInfo || null,
      response_format: data.responseFormat || 'text',
      restrictions: data.restrictions || null,
      temperature: data.temperature ?? 0.7,
      top_p: data.topP ?? 1.0,
      timezone: data.timezone || 'America/Sao_Paulo',
      vectorStoreId: data.vectorStoreId || null,
      voice_tone: data.voiceTone || null,
      openai_api_key: data.openaiApiKey || null
    };

    // Cria o agente no banco
    const agent = await prisma.agents.create({ data: agentData });

    // Criar o assistant na OpenAI
    const openai = await getOpenAIClient();
    let assistantId = null;
    if (openai) {
      try {
        const instructions = `
# ${agent.name}
${agent.description || ''}

${agent.personality_objective || ''}

${agent.agent_skills || ''}

${agent.restrictions || ''}

## Informações da Empresa
Nome: ${agent.company_name || ''}
Setor: ${agent.company_sector || ''}
Website: ${agent.company_website || ''}
Descrição: ${agent.company_description || ''}

## Tom de Voz
${agent.voice_tone || 'Profissional e amigável'}

## Função do Agente
${agent.agent_function || ''}

## Informações do Produto
${agent.product_info || ''}

## Mensagem Inicial Sugerida
${agent.initial_message || ''}
        `.trim();
        // Preparar as ferramentas com base nas configurações
        const tools = [];
        
        // Se tiver vectorStoreId, habilitar a ferramenta file_search
        if (agent.vectorStoreId) {
          tools.push({ type: "file_search" as const });
        }
        
        const assistant = await openai.beta.assistants.create({
          name: agent.name,
          instructions,
          model: agent.model || 'gpt-4o',
          temperature: agent.temperature ?? 0.7,
          top_p: (agent as any).top_p ?? 1.0,
          tools: tools
        });
        assistantId = assistant.id;
      } catch (err) {
        console.error('Erro ao criar assistant na OpenAI:', err);
      }
    }

    // Atualizar o agente com o assistant_id, se criado
    let updatedAgent = agent;
    if (assistantId) {
      updatedAgent = await prisma.agents.update({
        where: { id: agent.id },
        data: { assistant_id: assistantId }
      });
    }

    return NextResponse.json(updatedAgent);
  } catch (error) {
    console.error('Erro ao criar agent:', error);
    return NextResponse.json(
      { error: 'Erro ao criar agent' },
      { status: 200 }
    );
  }
} 
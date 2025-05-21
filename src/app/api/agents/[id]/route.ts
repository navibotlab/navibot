import { NextResponse } from 'next/server'
import { getOpenAIClient } from '../../integrations/openai/route'
import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { getWorkspaceFromContext } from '@/lib/utils/workspace'
import { Agent } from '@/types/agent'

const ALLOWED_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo'
]
const AGENTS_FILE = path.join(process.cwd(), 'config', 'agents.json')

// Função para ler os agentes
function readAgents(): any[] {
  try {
    if (fs.existsSync(AGENTS_FILE)) {
      return JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf8'))
    }
  } catch (error) {
    console.error('Erro ao ler agentes:', error)
  }
  return []
}

// Função para salvar os agentes
function saveAgents(agents: any[]) {
  if (!fs.existsSync(path.join(process.cwd(), 'config'))) {
    fs.mkdirSync(path.join(process.cwd(), 'config'))
  }
  fs.writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2))
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const agentId = (await params).id;
    
    // Verificar se estamos no modo de bypass (emergência)
    const url = new URL(request.url);
    const isBypass = url.searchParams.get('_bypass') === 'true';
    
    console.log(`[DEBUG CRÍTICO] Buscando agente id=${agentId} no workspace=${workspaceId}, modo bypass: ${isBypass}`);
    
    // Abordagem alternativa de busca para modo de emergência
    if (isBypass) {
      try {
        console.log('[DEBUG CRÍTICO] Modo de bypass ativado, usando query SQL direta');
        
        // Buscar usando SQL direto para evitar qualquer problema de serialização
        const rawAgent = await prisma.$queryRaw`
          SELECT 
            id, name, internal_name, image_url, initial_message, voice_tone, 
            model, language, timezone, system_prompt, temperature, frequency_penalty, 
            presence_penalty, max_messages, max_tokens, response_format, 
            company_name, company_sector, company_website, company_description, 
            personality_objective, agent_skills, agent_function, product_info, 
            restrictions, assistant_id, "vectorStoreId", "createdAt", "updatedAt", top_p
          FROM agents 
          WHERE id = ${agentId} AND "workspaceId" = ${workspaceId}
        `;
        
        if (!Array.isArray(rawAgent) || !rawAgent.length) {
          console.log('[DEBUG CRÍTICO] Modo bypass: Agente não encontrado');
          return NextResponse.json(
            { error: 'Agente não encontrado' },
            { status: 404 }
          );
        }
        
        // Pegar o primeiro item do array
        const agent = rawAgent[0];
        console.log('[DEBUG CRÍTICO] Modo bypass: Agente encontrado via SQL:', agent);
        
        // Mapear diretamente os campos para o formato esperado
        const agentResponse: Agent = {
          id: agent.id || '',
          name: agent.name || '',
          internalName: agent.internal_name || '',
          imageUrl: agent.image_url || '',
          initialMessage: agent.initial_message || '',
          voiceTone: agent.voice_tone || '',
          model: agent.model || 'gpt-4',
          language: agent.language || 'pt',
          timezone: agent.timezone || 'America/Sao_Paulo',
          instructions: agent.system_prompt || '',
          temperature: typeof agent.temperature === 'number' ? agent.temperature : 0.7,
          frequencyPenalty: typeof agent.frequency_penalty === 'number' ? agent.frequency_penalty : 0,
          presencePenalty: typeof agent.presence_penalty === 'number' ? agent.presence_penalty : 0,
          maxMessages: typeof agent.max_messages === 'number' ? agent.max_messages : 20,
          maxTokens: typeof agent.max_tokens === 'number' ? agent.max_tokens : 1000,
          responseFormat: agent.response_format || '',
          companyName: agent.company_name || '',
          companySector: agent.company_sector || '',
          companyWebsite: agent.company_website || '',
          companyDescription: agent.company_description || '',
          personalityObjective: agent.personality_objective || '',
          agentSkills: agent.agent_skills || '',
          agentFunction: agent.agent_function || '',
          productInfo: agent.product_info || '',
          restrictions: agent.restrictions || '',
          assistantId: agent.assistant_id || '',
          vectorStoreId: agent.vectorStoreId || '',
          createdAt: agent.createdAt ? new Date(agent.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: agent.updatedAt ? new Date(agent.updatedAt).toISOString() : new Date().toISOString(),
          topP: typeof agent.top_p === 'number' ? agent.top_p : 1.0
        };
        
        console.log('[DEBUG CRÍTICO] Modo bypass: Resposta mapeada:', agentResponse);
        return NextResponse.json(agentResponse);
      } catch (error) {
        console.error('[DEBUG CRÍTICO] Erro no modo bypass:', error);
        // Se falhar no bypass, continuamos com a abordagem padrão
      }
    }
    
    // Abordagem padrão (continua como antes)
    const dbSchema = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'agents'
    `;
    console.log('[DEBUG CRÍTICO] Estrutura da tabela agents:', dbSchema);
    
    // Buscar diretamente usando raw query para ver exatamente o que está no banco
    const rawAgent = await prisma.$queryRaw`
      SELECT * FROM agents WHERE id = ${agentId} AND "workspaceId" = ${workspaceId}
    `;
    console.log('[DEBUG CRÍTICO] Dados brutos do banco:', rawAgent);
    
    // Buscar usando Prisma normal
    const agent = await prisma.agents.findFirst({
      where: { 
        id: agentId,
        workspaceId
      }
    });

    console.log('[DEBUG CRÍTICO] Dados do banco via Prisma:', agent);
    
    if (!agent) {
      console.log('[DEBUG CRÍTICO] Agente não encontrado');
      return NextResponse.json(
        { error: 'Agente não encontrado' },
        { status: 404 }
      );
    }

    // Log detalhado para verificar as propriedades presentes no agente
    console.log('[DEBUG CRÍTICO] Propriedades do agente:', Object.keys(agent));
    
    // Log detalhado para cada campo importante
    console.log('[DEBUG CRÍTICO] Valores específicos dos campos (formato original do banco):');
    Object.entries(agent).forEach(([key, value]) => {
      console.log(`${key}: ${value === undefined ? 'undefined' : (value === null ? 'null' : JSON.stringify(value))}`);
    });
    
    // Mapear explicitamente cada campo para garantir que todos os nomes estejam corretos
    const agentResponse: Agent = {
      id: agent.id || '',
      name: agent.name || '',
      internalName: agent.internal_name || '',
      imageUrl: agent.image_url || '',
      initialMessage: agent.initial_message || '',
      voiceTone: agent.voice_tone || '',
      model: agent.model || 'gpt-4',
      language: agent.language || 'pt',
      timezone: agent.timezone || 'America/Sao_Paulo',
      instructions: agent.system_prompt || '',
      temperature: typeof agent.temperature === 'number' ? agent.temperature : 0.7,
      frequencyPenalty: typeof agent.frequency_penalty === 'number' ? agent.frequency_penalty : 0,
      presencePenalty: typeof agent.presence_penalty === 'number' ? agent.presence_penalty : 0,
      topP: 1.0, // Usando valor padrão
      maxMessages: typeof agent.max_messages === 'number' ? agent.max_messages : 20,
      maxTokens: typeof agent.max_tokens === 'number' ? agent.max_tokens : 1000,
      responseFormat: agent.response_format || '',
      companyName: agent.company_name || '',
      companySector: agent.company_sector || '',
      companyWebsite: agent.company_website || '',
      companyDescription: agent.company_description || '',
      personalityObjective: agent.personality_objective || '',
      agentSkills: agent.agent_skills || '',
      agentFunction: agent.agent_function || '',
      productInfo: agent.product_info || '',
      restrictions: agent.restrictions || '',
      assistantId: agent.assistant_id || '',
      vectorStoreId: agent.vectorStoreId || '',
      createdAt: agent.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: agent.updatedAt?.toISOString() || new Date().toISOString()
    };

    // Log para verificar o objeto de resposta após o mapeamento
    console.log('[DEBUG CRÍTICO] Objeto de resposta após mapeamento explícito:');
    Object.entries(agentResponse).forEach(([key, value]) => {
      console.log(`${key}: ${value === undefined ? 'undefined' : (value === null ? 'null' : JSON.stringify(value))}`);
    });

    console.log('[DEBUG CRÍTICO] Dados convertidos para o front:', agentResponse);
    
    // Verificar se JSON.stringify não está fazendo algo estranho
    const jsonString = JSON.stringify(agentResponse);
    console.log('[DEBUG CRÍTICO] JSON enviado para o frontend:', jsonString);
    
    // Testar parse do JSON para garantir que está tudo certo
    const parsedBack = JSON.parse(jsonString);
    console.log('[DEBUG CRÍTICO] JSON após parse:', parsedBack);
    
    return NextResponse.json(agentResponse);
  } catch (error) {
    console.error('[DEBUG CRÍTICO] Erro ao buscar agente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar agente: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const agentId = (await params).id;
    
    console.log(`[DEBUG] Atualizando agente id=${agentId} no workspace=${workspaceId}`);
    
    const data = await request.json();
    console.log('[DEBUG] Dados recebidos para atualização:', data);

    // Validar se o agente existe
    const existingAgent = await prisma.agents.findFirst({
      where: {
        id: agentId,
        workspaceId
      }
    });

    if (!existingAgent) {
      console.log('[DEBUG] Agente não encontrado para atualização');
      return NextResponse.json(
        { error: 'Agente não encontrado' },
        { status: 404 }
      );
    }

    // Converter campos do frontend (camelCase) para o banco (snake_case)
    const updateData = {
      name: data.name,
      internal_name: data.internalName,
      image_url: data.imageUrl,
      initial_message: data.initialMessage,
      voice_tone: data.voiceTone,
      model: data.model,
      language: data.language,
      timezone: data.timezone,
      system_prompt: data.instructions,
      temperature: Number(data.temperature),
      frequency_penalty: Number(data.frequencyPenalty),
      presence_penalty: Number(data.presencePenalty),
      top_p: Number(data.topP),
      max_messages: Number(data.maxMessages),
      max_tokens: Number(data.maxTokens),
      response_format: data.responseFormat,
      company_name: data.companyName,
      company_sector: data.companySector,
      company_website: data.companyWebsite,
      company_description: data.companyDescription,
      personality_objective: data.personalityObjective,
      agent_skills: data.agentSkills,
      agent_function: data.agentFunction,
      product_info: data.productInfo,
      restrictions: data.restrictions,
      assistant_id: data.assistantId,
      vectorStoreId: data.vectorStoreId,
      updatedAt: new Date()
    };

    console.log('[DEBUG] Dados convertidos para atualização:', updateData);

    const updatedAgent = await prisma.agents.update({
      where: {
        id: agentId
      },
      data: updateData
    });

    console.log('[DEBUG] Agente atualizado com sucesso:', updatedAgent);

    // Atualizar o assistente na OpenAI, se existir
    if (updatedAgent.assistant_id) {
      try {
        const openai = await getOpenAIClient();
        if (openai) {
          // Preparar instruções para o assistente
          const instructions = `
# ${updatedAgent.name}
${updatedAgent.description || ''}

${updatedAgent.personality_objective || ''}

${updatedAgent.agent_skills || ''}

${updatedAgent.restrictions || ''}

## Informações da Empresa
Nome: ${updatedAgent.company_name || ''}
Setor: ${updatedAgent.company_sector || ''}
Website: ${updatedAgent.company_website || ''}
Descrição: ${updatedAgent.company_description || ''}

## Tom de Voz
${updatedAgent.voice_tone || 'Profissional e amigável'}

## Função do Agente
${updatedAgent.agent_function || ''}

## Informações do Produto
${updatedAgent.product_info || ''}

## Mensagem Inicial Sugerida
${updatedAgent.initial_message || ''}
          `.trim();

          console.log(`[DEBUG] Atualizando assistente OpenAI ${updatedAgent.assistant_id}`);
          console.log('[DEBUG] Dados de atualização do assistente:', {
            name: updatedAgent.name,
            model: updatedAgent.model || 'gpt-4o',
            temperature: updatedAgent.temperature,
            top_p: updateData.top_p // Usar o dado que foi enviado para o banco
          });
          
          // Preparar as ferramentas com base nas configurações
          const tools = [];
          
          // Se tiver vectorStoreId, habilitar a ferramenta file_search
          if (updatedAgent.vectorStoreId) {
            tools.push({ type: "file_search" as const });
            console.log('[DEBUG] Ferramenta file_search habilitada para vectorStoreId:', updatedAgent.vectorStoreId);
          }
          
          await openai.beta.assistants.update(updatedAgent.assistant_id, {
            name: updatedAgent.name,
            instructions,
            model: updatedAgent.model || 'gpt-4o',
            temperature: updatedAgent.temperature || 0.7,
            top_p: updateData.top_p || 1.0, // Usar o dado que foi enviado para o banco
            tools: tools
          });
          
          console.log(`[DEBUG] Assistente OpenAI atualizado com sucesso com temperatura: ${updatedAgent.temperature} e top_p: ${updateData.top_p}`);
        } else {
          console.error('[DEBUG] OpenAI client não inicializado, não foi possível atualizar o assistente.');
        }
      } catch (err) {
        console.error('[DEBUG] Erro ao atualizar assistente na OpenAI:', err);
        // Continua mesmo se der erro na OpenAI
      }
    }

    // Converter de volta para o formato do frontend
    const agentResponse: Agent = {
      id: updatedAgent.id,
      name: updatedAgent.name || '',
      internalName: updatedAgent.internal_name || '',
      imageUrl: updatedAgent.image_url || '',
      initialMessage: updatedAgent.initial_message || '',
      voiceTone: updatedAgent.voice_tone || '',
      model: updatedAgent.model || 'gpt-4',
      language: updatedAgent.language || 'pt',
      timezone: updatedAgent.timezone || 'America/Sao_Paulo',
      instructions: updatedAgent.system_prompt || '',
      temperature: updatedAgent.temperature || 0.7,
      frequencyPenalty: updatedAgent.frequency_penalty || 0,
      presencePenalty: updatedAgent.presence_penalty || 0,
      topP: 1.0, // Usando valor padrão
      maxMessages: updatedAgent.max_messages || 20,
      maxTokens: updatedAgent.max_tokens || 1000,
      responseFormat: updatedAgent.response_format || '',
      companyName: updatedAgent.company_name || '',
      companySector: updatedAgent.company_sector || '',
      companyWebsite: updatedAgent.company_website || '',
      companyDescription: updatedAgent.company_description || '',
      personalityObjective: updatedAgent.personality_objective || '',
      agentSkills: updatedAgent.agent_skills || '',
      agentFunction: updatedAgent.agent_function || '',
      productInfo: updatedAgent.product_info || '',
      restrictions: updatedAgent.restrictions || '',
      assistantId: updatedAgent.assistant_id || '',
      vectorStoreId: updatedAgent.vectorStoreId || '',
      createdAt: updatedAgent.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: updatedAgent.updatedAt?.toISOString() || new Date().toISOString()
    };

    return NextResponse.json(agentResponse);
  } catch (error) {
    console.error('[DEBUG] Erro ao atualizar agente:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar agente' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const agentId = (await params).id;

    // Primeiro verifica se o agente pertence ao workspace
    const agent = await prisma.agents.findFirst({
      where: { 
        id: agentId,
        workspaceId
      }
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agente não encontrado' },
        { status: 200 }
      );
    }

    await prisma.agents.delete({
      where: { id: agentId }
    });

    // Se tiver assistant_id, remover da OpenAI
    if (agent.assistant_id) {
      try {
        const openai = await getOpenAIClient();
        if (openai) {
          await openai.beta.assistants.del(agent.assistant_id);
        } else {
          console.error('OpenAI client não inicializado, não foi possível deletar o assistente.');
        }
      } catch (err) {
        console.error('Erro ao deletar assistente na OpenAI:', err);
        // Continua mesmo se der erro na OpenAI
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao deletar agente:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar agente' },
      { status: 200 }
    );
  }
} 
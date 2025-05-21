import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOpenAIClient } from '../integrations/openai/route';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const { agentId, message, messageType = 'text' } = await req.json();

    if (!agentId || !message) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    console.log('Inicializando cliente OpenAI...');
    // Inicializa o cliente OpenAI
    const openai = await getOpenAIClient();
    if (!openai) {
      console.error('Cliente OpenAI não inicializado');
      return NextResponse.json(
        { error: 'OpenAI não configurada' },
        { status: 500 }
      );
    }
    console.log('Cliente OpenAI inicializado com sucesso');

    console.log('Processando mensagem para o agente:', agentId);
    console.log('Tipo de mensagem:', messageType);
    console.log('Conteúdo:', message);

    // Busca o agente no banco de dados
    console.log('Buscando agente no banco de dados...');
    const agent = await prisma.agents.findUnique({
      where: { id: agentId }
    });

    if (!agent || !agent.assistant_id) {
      console.error('Agente não encontrado ou sem assistant_id:', agentId);
      return NextResponse.json(
        { error: 'Agente não encontrado' },
        { status: 404 }
      );
    }
    console.log('Agente encontrado:', agent.id, 'AssistantId:', agent.assistant_id);

    try {
      // Cria um thread para a conversa
      console.log('Criando thread...');
      const thread = await openai.beta.threads.create();
      console.log('Thread criado:', thread.id);

      // Adiciona a mensagem ao thread
      console.log('Adicionando mensagem ao thread...');
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: message
      });
      console.log('Mensagem adicionada ao thread');

      // Executa o assistente
      console.log('Executando assistente...');
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: agent.assistant_id
      });
      console.log('Run criado:', run.id);

      // Aguarda a conclusão do processamento
      console.log('Aguardando processamento...');
      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      let attempts = 0;
      const maxAttempts = 30; // 30 segundos de timeout
      
      while ((runStatus.status === 'in_progress' || runStatus.status === 'queued') && attempts < maxAttempts) {
        console.log('Status atual:', runStatus.status);
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        attempts++;
      }

      console.log('Processamento finalizado. Status:', runStatus.status);

      if (runStatus.status === 'completed') {
        // Obtém as mensagens do thread
        console.log('Obtendo mensagens do thread...');
        const messages = await openai.beta.threads.messages.list(thread.id);
        const lastMessage = messages.data[0];

        if (lastMessage && lastMessage.content[0].type === 'text') {
          const response = lastMessage.content[0].text.value;
          console.log('Resposta gerada:', response);
          
          return NextResponse.json({ response });
        }
      }

      console.error('Falha ao gerar resposta. Status:', runStatus.status);
      return NextResponse.json(
        { error: 'Falha ao gerar resposta' },
        { status: 500 }
      );

    } catch (error) {
      console.error('Erro durante a comunicação com OpenAI:', error);
      return NextResponse.json(
        { error: 'Erro ao processar mensagem com OpenAI' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar mensagem' },
      { status: 500 }
    );
  }
} 
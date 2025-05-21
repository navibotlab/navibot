import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatBrazilianPhoneNumber, normalizePhoneNumber } from '@/utils/phone';
import { WhatsAppCloudApiService } from '@/lib/services/whatsapp-cloud-api';
import { WhatsAppCloudMessageProcessor } from '@/lib/services/whatsapp-cloud-message-processor';
import { OpenAI } from 'openai';
import { headers } from 'next/headers';

const processedMessageIds = new Set<string>();

export async function GET(request: Request, { params }: { params: { phoneNumberId: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('\n=== VERIFICAÇÃO DE WEBHOOK RECEBIDA ===');
    console.log('URL completa:', request.url);
    console.log('Parâmetros:', {
      mode,
      token,
      challenge,
      phoneNumberId: params.phoneNumberId
    });

    // Verificação simples
    if (mode === 'subscribe' && token === 'navibot') {
      console.log('✅ Verificação de webhook bem-sucedida');
      console.log('Retornando challenge:', challenge);
      return new Response(challenge);
    }

    console.error('❌ Verificação de webhook falhou:', {
      expectedToken: 'navibot',
      receivedToken: token,
      mode,
      challenge
    });
    return new Response('Forbidden', { status: 403 });
  } catch (error) {
    console.error('❌ Erro ao processar verificação de webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Função para obter uma amostra segura do conteúdo
function getSafeContentSample(text: string): string {
  const maxLength = 200;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export async function POST(request: Request, { params }: { params: { phoneNumberId: string } }) {
  let rawText = '';
  
  try {
    // Primeiro, verificar se o conteúdo é um formulário (Disparaja) ou JSON (WhatsApp Cloud)
    const contentType = request.headers.get('content-type') || '';
    
    // Se for uma requisição de formulário (Disparaja), ignoramos
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      const formDataObj: Record<string, string> = {};
      
      // Converter FormData para objeto para facilitar o logging
      formData.forEach((value, key) => {
        formDataObj[key] = value.toString();
      });
      
      console.log('\n=== WEBHOOK DO DISPARAJA RECEBIDO NA ROTA DO WHATSAPP CLOUD ===');
      console.log('Parâmetros:', formDataObj);
      console.log('phoneNumberId:', params.phoneNumberId);
      console.log('=================================================================\n');
      
      return NextResponse.json({ status: 'ignored', message: 'Disparaja webhook received on WhatsApp Cloud route' });
    }
    
    // Para debugging, obter o texto bruto se não for JSON
    if (!contentType.includes('application/json')) {
      rawText = await request.text();
      console.log('\n=== CONTEÚDO NÃO-JSON RECEBIDO ===');
      console.log('Content-Type:', contentType);
      console.log('Conteúdo:', getSafeContentSample(rawText));
      console.log('phoneNumberId:', params.phoneNumberId);
      console.log('====================================\n');
      
      return new NextResponse('Formato de conteúdo não suportado', { status: 415 });
    }

    // Clonar a requisição para poder ler o corpo duas vezes se necessário
    const clonedRequest = request.clone();
    
    // Tentar fazer o parsing do JSON
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      // Se falhar, tentar ler como texto para obter mais informações sobre o erro
      rawText = await clonedRequest.text();
      console.log('\n=== ERRO AO PROCESSAR JSON ===');
      console.log('Content-Type:', contentType);
      console.log('Conteúdo recebido:', getSafeContentSample(rawText));
      console.log('Erro:', jsonError);
      console.log('============================\n');
      
      // Verificar se parece ser uma requisição do Disparaja que chegou por engano
      if (rawText.includes('secret=') || rawText.includes('&phone=')) {
        console.log('🔍 Detectada possível requisição do Disparaja com formato incorreto');
        return NextResponse.json({ 
          status: 'ignored', 
          message: 'Requisição parece ser do Disparaja mas não está no formato esperado' 
        });
      }
      
      return new NextResponse('Formato JSON inválido', { status: 400 });
    }

    console.log('\n=== INÍCIO DO PROCESSAMENTO DO WEBHOOK ===');
    console.log('Webhook recebido para phoneNumberId:', params.phoneNumberId);
    console.log('Corpo completo:', JSON.stringify(body, null, 2));

    // 1. Verificar se é uma mensagem válida
    if (!body.object || body.object !== 'whatsapp_business_account') {
      console.log('❌ Webhook ignorado: não é uma mensagem do WhatsApp Business');
      return new NextResponse('Not a WhatsApp Business message');
    }

    // 2. Extrair dados da mensagem
    const entry = body.entry?.[0];
    if (!entry?.changes?.[0]?.value?.messages?.[0]) {
      console.log('❌ Webhook ignorado: não contém mensagem');
      return new NextResponse('No message found');
    }

    const messageValue = entry.changes[0].value;
    const message = messageValue.messages[0];
    const rawPhone = message.from;
    
    // 3. Formatar o número de telefone
    const formattedPhone = formatBrazilianPhoneNumber(rawPhone);
    if (!formattedPhone) {
      console.log('❌ Número de telefone inválido');
      return new NextResponse('Invalid phone number', { status: 400 });
    }

    // 4. Buscar a conexão do WhatsApp
    const connection = await prisma.$queryRaw<any[]>`
      SELECT wc.* 
      FROM whatsapp_cloud_connections wc
      JOIN agents a ON wc."agentId" = a.id
      WHERE wc."phoneNumberId" = ${params.phoneNumberId}
      AND wc.status = 'active'
    `;

    if (!connection || connection.length === 0) {
      console.log('❌ Conexão WhatsApp não encontrada ou inativa');
      return new NextResponse('WhatsApp connection not found or inactive', { status: 404 });
    }

    const connectionData = connection[0];

    // Buscar o agente com o workspace
    const agent = await prisma.$queryRaw<any[]>`
      SELECT 
        a.id,
        a.name,
        a.model,
        a."openaiApiKey",
        a."workspaceId"
      FROM agents a
      WHERE a.id = ${connectionData.agentId}
    `;

    if (!agent || agent.length === 0) {
      console.log('❌ Agente não encontrado para esta conexão');
      return new NextResponse('Agent not found', { status: 404 });
    }

    const agentData = agent[0];

    // Usar a chave da API do agente se disponível, senão usar a do sistema
    let openaiApiKey = agentData.openaiApiKey;
    
    if (!openaiApiKey) {
      const openaiConfig = await prisma.$queryRaw<any[]>`
        SELECT value 
        FROM system_config 
        WHERE key = 'OPENAI_API_KEY'
      `;

      if (!openaiConfig || openaiConfig.length === 0) {
        console.log('❌ Chave da API OpenAI não configurada no sistema');
        return new NextResponse('OpenAI API key not configured', { status: 500 });
      }

      openaiApiKey = openaiConfig[0].value;
    }
    
    if (!openaiApiKey) {
      console.log('❌ Chave da API OpenAI não encontrada');
      return new NextResponse('OpenAI API key not found', { status: 500 });
    }

    // 5. Criar serviço WhatsApp Cloud
    const whatsappCloud = new WhatsAppCloudApiService(
      connectionData.phoneNumberId,
      connectionData.accessToken
    );
    
    // 6. Extrair conteúdo baseado no tipo de mensagem
    let messageContent: {
      type: string;
      text?: string;
      image?: {
        id: string;
        caption?: string;
        url?: string;
        mime_type?: string;
      };
      audio?: {
        id: string;
        mime_type?: string;
        voice?: boolean;
        duration?: number;
      };
    };

    // Log completo da mensagem original para debug
    console.log('📩 Mensagem original do webhook:', JSON.stringify(message, null, 2));
    console.log('📌 Tipo original da mensagem:', message.type);

    if (message.type === 'text') {
      messageContent = {
        type: 'text',
        text: message.text?.body || ''
      };
    } else if (message.type === 'image') {
      const imageId = message.image?.id || '';
      let mediaUrl;
      
      if (imageId) {
        try {
          mediaUrl = await whatsappCloud.getMediaUrl(imageId);
          console.log('📸 Imagem recebida:');
          console.log('- ID:', imageId);
          console.log('- URL:', mediaUrl);
          console.log('- Legenda:', message.image?.caption || 'Sem legenda');
        } catch (error) {
          console.error('❌ Erro ao obter URL da imagem:', error);
        }
      }

      messageContent = {
        type: 'image',
        image: {
          id: imageId,
          caption: message.image?.caption,
          url: mediaUrl,
          mime_type: message.image?.mime_type
        }
      };
    } else if (message.type === 'audio') {
      const audioId = message.audio?.id || '';
      let mediaUrl;
      
      if (audioId) {
        try {
          mediaUrl = await whatsappCloud.getMediaUrl(audioId);
          console.log('🎤 Áudio recebido:');
          console.log('- ID:', audioId);
          console.log('- URL:', mediaUrl);
          console.log('- MIME Type:', message.audio?.mime_type || 'Não especificado');
          console.log('- Voice:', message.audio?.voice ? 'Sim' : 'Não');
          console.log('- Duration:', message.audio?.duration || 'Não especificado');
        } catch (error) {
          console.error('❌ Erro ao obter URL do áudio:', error);
        }
      }

      messageContent = {
        type: 'audio',
        audio: {
          id: audioId,
          mime_type: message.audio?.mime_type,
          voice: message.audio?.voice,
          duration: message.audio?.duration
        }
      };
    } else {
      console.warn('⚠️ Tipo de mensagem não suportado:', message.type);
      messageContent = {
        type: message.type, // Mantém o tipo original
        text: `Tipo de mensagem ${message.type} não é totalmente suportado ainda.`
      };
    }

    // 7. Buscar ou criar o lead
    let lead = await prisma.lead.findFirst({
      where: {
        phone: formattedPhone,
        workspace: {
          id: agentData.workspaceId
        }
      }
    });

    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          phone: formattedPhone,
          name: messageValue.contacts?.[0]?.profile?.name || formattedPhone,
          workspace: {
            connect: {
              id: agentData.workspaceId
            }
          }
        }
      });
    }

    // 8. Verificar se a mensagem já foi processada
    if (message) {
      const messageId = message.id;
      if (processedMessageIds.has(messageId)) {
        console.log('📝 Mensagem já processada:', messageId);
        return NextResponse.json({ status: 200, message: 'Mensagem já processada' });
      }
      processedMessageIds.add(messageId);
      
      // Limpar IDs antigos (manter apenas últimos 1000)
      if (processedMessageIds.size > 1000) {
        const idsArray = Array.from(processedMessageIds);
        const idsToRemove = idsArray.slice(0, idsArray.length - 1000);
        idsToRemove.forEach(id => processedMessageIds.delete(id));
      }
    }

    // 9. Criar processador de mensagens
    const messageProcessor = new WhatsAppCloudMessageProcessor(
      whatsappCloud,
      prisma,
      new OpenAI({ apiKey: openaiApiKey })
    );

    // 10. Processar a mensagem
    console.log('📝 Enviando para processamento - messageContent:', JSON.stringify(messageContent, null, 2));
    await messageProcessor.processIncomingMessage({
      leadId: lead.id,
      message: messageContent,
      connectionId: connectionData.id,
      messageId: message.id,
      phone: formattedPhone
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    
    // Se temos o texto bruto da requisição, incluir no log para debugging
    if (rawText) {
      console.error('Conteúdo da requisição que causou o erro:', getSafeContentSample(rawText));
    }
    
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
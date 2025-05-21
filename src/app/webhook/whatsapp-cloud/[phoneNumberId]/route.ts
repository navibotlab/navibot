import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatPhoneNumber } from '@/lib/utils/phone';
import { WhatsAppCloudApiService } from '@/lib/services/whatsapp-cloud-api';
import { WhatsAppCloudMessageProcessor } from '@/lib/services/whatsapp-cloud-message-processor';
import { v4 as uuidv4 } from 'uuid';
import { OpenAI } from 'openai';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: { phoneNumberId: string } }
) {
  const params = await context.params;
  const phoneNumberId = params.phoneNumberId;

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
      phoneNumberId
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

// Função para verificar se o webhook contém uma mensagem válida
function isValidMessage(body: any): boolean {
  try {
    return (
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0] !== undefined &&
      body.object === 'whatsapp_business_account'
    );
  } catch (error) {
    console.error('❌ Erro ao validar mensagem:', error);
    return false;
  }
}

export async function POST(
  request: Request,
  context: { params: { phoneNumberId: string } }
) {
  const params = await context.params;
  const phoneNumberId = params.phoneNumberId;

  try {
    console.log('\n=== INÍCIO DO PROCESSAMENTO DO WEBHOOK ===');
    console.log('Webhook recebido para phoneNumberId:', phoneNumberId);

    const body = await request.json();
    console.log('Corpo completo:', JSON.stringify(body, null, 2));

    // Verificar se o webhook contém mensagens ou status
    const hasMessages = body.entry.some((entry: any) => entry.changes.some((change: any) => change.field === 'messages' && change.value.messages && change.value.messages.length > 0));
    const hasStatuses = body.entry.some((entry: any) => entry.changes.some((change: any) => change.field === 'messages' && change.value.statuses && change.value.statuses.length > 0));

    if (hasStatuses) {
      console.log('📋 Webhook de status recebido');
      // Processar status aqui
      body.entry.forEach((entry: any) => {
        entry.changes.forEach((change: any) => {
          if (change.value.statuses) {
            console.log('🔄 Status:', JSON.stringify(change.value.statuses, null, 2));
          }
        });
      });
      console.log('=====================================');
      console.log('=== PROCESSAMENTO DE STATUS CONCLUÍDO ===');
      console.log('=====================================');
      return NextResponse.json({ success: true });
    }

    if (!hasMessages) {
      console.log('❌ Webhook ignorado: não contém mensagem');
      return NextResponse.json({ success: true });
    }

    // Buscar a conexão do WhatsApp
    const [connectionData] = await prisma.$queryRaw<any[]>`
      SELECT 
        wc.id,
        wc."workspaceId",
        wc."agentId",
        wc."accessToken",
        wc.status,
        a."assistant_id"
      FROM whatsapp_cloud_connections wc
      INNER JOIN agents a ON a.id = wc."agentId"
      WHERE wc."phoneNumberId" = ${phoneNumberId}
      LIMIT 1
    `;

    if (!connectionData) {
      console.error('Conexão não encontrada para phoneNumberId:', phoneNumberId);
      return new NextResponse('Conexão não encontrada', { status: 404 });
    }

    // Verificar se há um agente vinculado
    if (!connectionData.agentId) {
      console.error('Agente não vinculado à conexão:', connectionData.id);
      return new NextResponse('Agente não vinculado', { status: 400 });
    }

    // Processar cada entrada do webhook
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'messages') continue;

        const messageValue = change.value;
        if (!messageValue.messages || messageValue.messages.length === 0) continue;

        // Processar cada mensagem
        for (const message of messageValue.messages) {
          const formattedPhone = formatPhoneNumber(message.from);
          console.log('📱 Número formatado:', formattedPhone);

          // Buscar ou criar o lead
          let lead = await prisma.leads.findFirst({
            where: {
              phone: formattedPhone,
              workspaceId: connectionData.workspaceId
            }
          });

          if (!lead) {
            // Criar novo lead usando Prisma Client
            lead = await prisma.leads.create({
              data: {
                phone: formattedPhone,
                name: messageValue.contacts?.[0]?.profile?.name || formattedPhone,
                workspaceId: connectionData.workspaceId,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
          }

          // Buscar ou criar uma conversa
          let conversation = await prisma.conversations.findFirst({
            where: {
              lead_id: lead.id
            },
            orderBy: {
              created_at: 'desc'
            }
          });

          if (!conversation) {
            // Criar nova conversa
            conversation = await prisma.conversations.create({
              data: {
                lead_id: lead.id,
                workspaceId: connectionData.workspaceId,
                created_at: new Date(),
                updated_at: new Date()
              }
            });
          }

          // Verificar o tipo de mensagem
          let messageType = 'text';
          let mediaUrl = null;
          
          if (message.type === 'image') {
            messageType = 'image';
            mediaUrl = message.image?.id || null;
          } else if (message.type === 'audio') {
            messageType = 'audio';
            mediaUrl = message.audio?.id || null;
          }

          // Inicializar serviços para processamento da mensagem
          const whatsappService = new WhatsAppCloudApiService(
            connectionData.accessToken,
            phoneNumberId
          );

          // Buscar a chave da OpenAI do workspace
          const [systemConfig] = await prisma.$queryRaw<any[]>`
            SELECT sc.value
            FROM system_configs sc
            WHERE sc.key = 'OPENAI_API_KEY'
            AND sc."workspaceId" = ${connectionData.workspaceId}
            LIMIT 1
          `;

          if (!systemConfig) {
            console.error('Chave da OpenAI não encontrada');
            continue;
          }

          const openai = new OpenAI({ apiKey: systemConfig.value });
          const messageProcessor = new WhatsAppCloudMessageProcessor(
            whatsappService,
            prisma as PrismaClient,
            connectionData,
            openai
          );

          // Processar a mensagem
          await messageProcessor.processIncomingMessage({
            leadId: lead.id,
            message: {
              type: message.type,
              text: message.text?.body,
              timestamp: message.timestamp,
              image: message.type === 'image' ? {
                id: message.image?.id,
                caption: message.image?.caption,
                mime_type: message.image?.mime_type
              } : undefined,
              audio: message.type === 'audio' ? {
                id: message.audio?.id,
                mime_type: message.audio?.mime_type,
                voice: message.audio?.voice,
                duration: message.audio?.duration
              } : undefined
            },
            connectionId: connectionData.id,
            messageId: message.id,
            phone: formattedPhone
          });
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return new NextResponse('Erro interno', { status: 500 });
  }
} 
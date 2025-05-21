import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { formatPhoneNumber, getAlternativePhoneNumber } from '@/lib/utils/phone';
import { MessageProcessor } from '@/lib/services/message-processor';
import { DisparaJaService } from '@/lib/services/disparaja';
import { DisparaJaConnection } from '@/app/admin/canais/dispara-ja/types';

// Endereço de webhook: https://seusite.com/api/dispara-ja/webhook/[id]
// onde [id] é o ID da conexão DisparaJá

// Função para adicionar o nono dígito se necessário
function addNinthDigitIfNeeded(phone: string): string {
  // Remove o + se existir
  const cleanPhone = phone.replace(/^\+/, '');
  
  // Verifica se é um número brasileiro (começa com 55)
  if (cleanPhone.startsWith('55')) {
    const withoutCountryCode = cleanPhone.substring(2);
    // Se tem 10 dígitos (DDD + 8 dígitos), adiciona o 9
    if (withoutCountryCode.length === 10) {
      const ddd = withoutCountryCode.substring(0, 2);
      const number = withoutCountryCode.substring(2);
      return `55${ddd}9${number}`;
    }
  }
  return cleanPhone;
}

// Endpoint para receber webhooks do Dispara Já
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  const connectionId = String(context.params?.id || '');
  
  console.log(`[DisparaJá Webhook] Recebendo webhook para conexão ID: ${connectionId}`);
  
  if (!connectionId) {
    console.error('[DisparaJá Webhook] ID da conexão não fornecido');
    return NextResponse.json(
      { error: 'ID da conexão não fornecido' },
      { status: 400 }
    );
  }
  
  try {
    // Verificar o Content-Type e processar os dados primeiro
    const contentType = request.headers.get('content-type');
    let rawData;
    
    if (contentType?.includes('application/json')) {
      rawData = await request.json();
    } else {
      // Assumir x-www-form-urlencoded
      const formData = await request.formData();
      rawData = Object.fromEntries(formData);
    }

    // Processar os dados do webhook
    const data = {
      secret: rawData.secret,
      type: rawData.type,
      phone: rawData['data[phone]'] || '',
      message: rawData['data[message]'] || '',
      wid: rawData['data[wid]'] || '',
      timestamp: rawData['data[timestamp]'] || '',
      attachment: rawData['data[attachment]'] || '0'
    };

    console.log('[DisparaJá Webhook] Dados processados:', data);

    // Buscar a conexão
    const connections = await prisma.$queryRaw<DisparaJaConnection[]>`
      SELECT * FROM "dispara_ja_connections" WHERE id = ${connectionId}
    `;

    if (!connections || connections.length === 0) {
      console.error('[DisparaJá Webhook] Conexão não encontrada:', connectionId);
      return NextResponse.json(
        { error: 'Conexão não encontrada' },
        { status: 404 }
      );
    }

    const connection = connections[0];

    // Registrar o webhook recebido
    const logId = uuidv4();
    const now = new Date();
    const webhookMessage = `Webhook recebido: ${JSON.stringify(data)}`;

    await prisma.$executeRaw`
      INSERT INTO "dispara_ja_logs" 
      (id, "connectionId", type, message, timestamp, "workspaceId") 
      VALUES (
        ${logId}, 
        ${connectionId}, 
        'WEBHOOK', 
        ${webhookMessage}, 
        ${now},
        ${connection.workspaceId}
      )
    `;

    // Formatar o número do telefone e adicionar o nono dígito se necessário
    const formattedPhone = addNinthDigitIfNeeded(data.phone.replace(/[^\d+]/g, ''));

    // Buscar ou criar o lead
    let lead = await prisma.leads.findFirst({
      where: {
        phone: formattedPhone,
        workspaceId: connection.workspaceId
      }
    });

    if (!lead) {
      console.log('[DisparaJá Webhook] Criando novo lead:', {
        phone: formattedPhone,
        workspaceId: connection.workspaceId
      });

      lead = await prisma.leads.create({
        data: {
          phone: formattedPhone,
          workspaceId: connection.workspaceId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      console.log('[DisparaJá Webhook] Lead encontrado:', lead.id);
    }

    // Processar a mensagem recebida
    if (data.type === 'whatsapp') {
      // Determinar o tipo de mensagem baseado no attachment
      let messageType = 'text';
      let mediaUrl = null;

      if (data.attachment !== '0') {
        // Se tem attachment, é uma mensagem com mídia
        mediaUrl = data.attachment;
        const fileExtension = data.attachment.split('.').pop()?.toLowerCase();
        
        if (fileExtension) {
          if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
            messageType = 'image';
          } else if (['mp3', 'wav', 'ogg', 'oga', 'mp4', 'm4a'].includes(fileExtension)) {
            messageType = 'audio';
          }
        }
      }

      console.log('[DisparaJá Webhook] Processando mensagem:', {
        leadId: lead.id,
        connectionId: connection.id,
        message: data.message,
        phone: formattedPhone,
        messageType,
        mediaUrl
      });

      const disparaJa = new DisparaJaService(connection.secret, connection.unique);
      const messageProcessor = new MessageProcessor(disparaJa);
      
      // Antes de processar a mensagem, verificar se a conversa tem o campo channel definido como "disparaja"
      // Se existir conversa para este lead, garantir que o canal está definido como "disparaja"
      let conversation = await prisma.conversations.findFirst({
        where: {
          lead_id: lead.id
        }
      });
      
      if (conversation) {
        // Se a conversa já existe mas não tem canal definido ou é diferente de "disparaja", atualizar
        if ((conversation as any).channel !== 'disparaja') {
          console.log(`[DisparaJá Webhook] Atualizando canal da conversa ${conversation.id} para 'disparaja'`);
          
          conversation = await prisma.conversations.update({
            where: { id: conversation.id },
            data: { 
              channel: 'disparaja' 
            } as any
          });
        }
      }
      
      const processedMessage = await messageProcessor.processIncomingMessage({
        leadId: lead.id,
        connectionId: connection.id,
        message: data.message,
        phone: formattedPhone,
        mediaUrl
      });

      console.log('[DisparaJá Webhook] Mensagem processada:', processedMessage);

      return NextResponse.json({
        success: true,
        message: 'Webhook processado com sucesso',
        processed: processedMessage
      });
    }

    // Se não for uma mensagem, apenas confirmar recebimento
    return NextResponse.json({
      success: true,
      message: 'Webhook recebido com sucesso'
    });

  } catch (error) {
    console.error('[DisparaJá Webhook] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}

// Endpoint para verificar se o webhook está configurado corretamente
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Aguardar a disponibilidade dos parâmetros
  const connectionId = String(params?.id || '');
  
  console.log(`[DisparaJá Webhook] Verificando webhook para conexão ID: ${connectionId}`);
  
  if (!connectionId) {
    console.error('[DisparaJá Webhook] ID da conexão não fornecido para verificação');
    return NextResponse.json(
      { error: 'ID da conexão não fornecido' },
      { status: 400 }
    );
  }
  
  try {
    // Verificar se a conexão existe usando raw query
    const connections = await prisma.$queryRaw<DisparaJaConnection[]>`
      SELECT id, "agentId", "phoneNumber", status 
      FROM "dispara_ja_connections" 
      WHERE id = ${connectionId}
    `;
    
    if (!connections || connections.length === 0) {
      return NextResponse.json(
        { error: 'Conexão não encontrada' },
        { status: 404 }
      );
    }
    
    const connection = connections[0];
    
    // Responder com sucesso para confirmar que o webhook está configurado
    return NextResponse.json({
      success: true,
      message: 'Webhook configurado corretamente',
      connectionId: connectionId,
      phoneNumber: connection.phoneNumber
    });
    
  } catch (error: any) {
    console.error('Erro ao verificar webhook:', error);
    return NextResponse.json(
      { error: `Erro ao verificar webhook: ${error.message}` },
      { status: 500 }
    );
  }
} 
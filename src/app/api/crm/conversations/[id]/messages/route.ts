import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';
import { WhatsAppCloudAPIUnified } from '@/lib/services/whatsapp-cloud-api-unified';
import { v4 as uuidv4 } from 'uuid';
import { WhatsAppCloudMessageProcessor } from '@/lib/services/whatsapp-cloud-message-processor';
import { WhatsAppCloudApiService } from '@/lib/services/whatsapp-cloud-api';
import OpenAI from 'openai';
import { SimpleLogger } from '@/lib/services/whatsapp-cloud-message-storage';
import { structuredLog } from '@/lib/services/whatsapp-cloud-logger';
import { WhatsAppCloudHumanMessageHandler } from '@/lib/services/whatsapp-cloud-human-message-handler';
import { DisparaJaHumanMessageHandler } from '@/lib/services/disparaja-human-message-handler';
import { DisparaJaService } from '@/lib/services/disparaja';
import { safeLog } from '@/lib/middleware/log-interceptor';

interface Message {
  id: string;
  content: string;
  sender: string;
  read: boolean;
  createdAt: Date;
  mediaUrl?: string;
  isManual?: boolean;
  type: string;
  mediaDuration?: number;
  mediaType?: string;
}

// GET - Buscar mensagens da conversa
export async function GET(
  request: Request,
  context: { params: { id: string | string[] } }
) {
  try {
    // Obter o workspace atual
    const { workspaceId } = await getWorkspaceFromContext();
    
    // Usar await diretamente na declaração de params, como recomendado pelo Next.js
    const params = await context.params;
    // Agora podemos acessar params.id com segurança
    const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;
    
    // Verificar se a conversa pertence ao workspace usando o nome correto da tabela
    const conversation = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM conversations 
      WHERE id = ${conversationId}::uuid 
      AND lead_id IN (
        SELECT id FROM leads WHERE "workspaceId" = ${workspaceId}
      )
    `;

    if (!conversation || conversation.length === 0) {
      return NextResponse.json(
        { error: 'Conversa não encontrada ou sem permissão para acessá-la' },
        { status: 404 }
      );
    }

    // Buscar mensagens para a conversa
    const messages = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        content,
        sender,
        read,
        created_at as "createdAt",
        media_url as "mediaUrl",
        is_manual as "isManual",
        type
      FROM messages
      WHERE conversation_id = ${conversationId}::uuid
      ORDER BY created_at DESC
      LIMIT 100
    `;

    // Para fins de depuração, registrar apenas o número de mensagens sem expor dados sensíveis
    safeLog("API", messages.length, "mensagens encontradas");

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar mensagens' },
      { status: 500 }
    );
  }
}

// POST - Enviar nova mensagem
export async function POST(
  request: Request,
  context: { params: { id: string | string[] } }
) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    
    // Usar o mesmo padrão que na função GET
    const params = await context.params;
    // Agora podemos acessar params.id com segurança
    const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;
    
    const data = await request.json();
    // Alteramos de 'agent' para 'human' para mensagens manuais
    const { content, sender = 'human', isManual = true, createdAt } = data;

    if (!content) {
      return NextResponse.json(
        { error: 'Conteúdo da mensagem é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a conversa pertence ao workspace
    const conversation = await prisma.$queryRaw<any[]>`
      SELECT c.*, l.phone as "leadPhone", c.thread_id as "threadId"
      FROM conversations c
      JOIN leads l ON c.lead_id = l.id
      WHERE c.id = ${conversationId}::uuid
      AND l."workspaceId" = ${workspaceId}
    `;

    if (!conversation || conversation.length === 0) {
      return NextResponse.json(
        { error: 'Conversa não encontrada neste workspace' },
        { status: 404 }
      );
    }

    const leadPhone = conversation[0].leadPhone;
    const threadId = conversation[0].threadId;
    
    // Resposta final que será enviada ao cliente
    let responseData: any = {};
    
    // Se for uma mensagem manual, tenta enviar pelo canal correto
    if (isManual) {
      try {
        // Verificar o canal da conversa
        const channel = (conversation[0] as any).channel || 'whatsapp-cloud'; // Fallback para compatibilidade
        // Removendo informação sensível do leadPhone
        safeLog(`Processando mensagem via canal: ${channel}`);
        
        // Gerar ID de correlação para logs
        const correlationId = uuidv4();
        
        // Criando logger para estruturar os logs
        const logger: SimpleLogger = {
          info: (message: string, context?: any) => structuredLog(context || {}, 'info', message),
          warn: (message: string, context?: any) => structuredLog(context || {}, 'warn', message),
          error: (message: string, context?: any) => structuredLog(context || {}, 'error', message)
        };
        
        // Buscar a chave API da OpenAI no systemconfig para o workspace atual
        safeLog(`Buscando configuração OpenAI`);
        const openaiConfig = await prisma.system_configs.findFirst({
          where: { 
            key: 'OPENAI_API_KEY',
            workspaceId: workspaceId
          }
        });
        
        if (!openaiConfig?.value) {
          responseData.threadStatus = 'error';
          responseData.threadMessage = 'Chave API da OpenAI não configurada para este workspace';
          console.error('Erro: Chave API da OpenAI não configurada');
        } else {
          safeLog(`Configuração OpenAI encontrada`);
          safeLog(`Inicializando cliente OpenAI`);
          
          // Criar instância do OpenAI com a chave obtida do systemconfig
          const openai = new OpenAI({
            apiKey: openaiConfig.value,
          });
          
          // Baseado no canal, buscar a conexão apropriada e enviar a mensagem
          if (channel === 'disparaja') {
            safeLog(`Buscando conexão DisparaJá`);
            
            // ABORDAGEM SEGURA: Buscar apenas conexões do workspace atual
            const workspaceConnections = await prisma.$queryRaw`
              SELECT djc.* 
              FROM "dispara_ja_connections" djc
              JOIN "agents" a ON djc."agentId" = a.id
              WHERE a."workspaceId" = ${workspaceId}
            `;
            
            safeLog(`Encontradas conexões no workspace`, (workspaceConnections as any[]).length);
            
            // Inicializar a variável de conexão
            let disparaJaConnection: any = null;
            
            // Preferir conexão ativa, mas usar inativa se não houver opção
            const activeConnection = (workspaceConnections as any[]).find(conn => conn.status === 'ativo');
            
            if (activeConnection) {
              disparaJaConnection = activeConnection;
              safeLog(`Usando conexão ativa do workspace`);
            } else if ((workspaceConnections as any[]).length > 0) {
              // Se não houver nenhuma ativa, tentar usar a primeira disponível, mesmo inativa
              disparaJaConnection = (workspaceConnections as any[])[0];
              safeLog(`AVISO: Usando conexão inativa do workspace, pois não há conexões ativas`);
            }

            if (!disparaJaConnection) {
              responseData.status = 'error';
              responseData.message = 'Conexão DisparaJá não encontrada ou inativa para este workspace. Ative a conexão em Admin > Canais > DisparaJá.';
              console.error(`Conexão DisparaJá não encontrada`);
            } else {
              safeLog(`Conexão DisparaJá ativa encontrada`);
              
              // Buscar dados do agente associado para obter o assistantId
              const agent = await prisma.agents.findUnique({
                where: { id: disparaJaConnection.agentId }
              });
              
              if (!agent) {
                safeLog(`Aviso: Agente associado não encontrado`);
              } else {
                safeLog(`Agente encontrado: ${agent.name}`);
              }
              
              // Criar instância do DisparaJá e enviar a mensagem
              const disparaJa = new DisparaJaService(
                disparaJaConnection.secret,
                disparaJaConnection.unique
              );
              
              try {
                safeLog(`Detalhes da conexão DisparaJá preparados`);
                
                // Verificar tamanho mínimo da mensagem (DisparaJá exige pelo menos 3 caracteres)
                if (content.trim().length < 3) {
                  safeLog(`ERRO: Mensagem muito curta. DisparaJá exige pelo menos 3 caracteres.`);
                  responseData.status = 'error';
                  responseData.message = 'Mensagem muito curta. O DisparaJá exige mensagens com pelo menos 3 caracteres.';
                  
                  // Ainda salvamos a mensagem no banco e thread, mas não tentamos enviar
                } else {
                  safeLog(`Enviando mensagem DisparaJá`);
                  const disparaJaResponse = await disparaJa.sendText(
                    leadPhone,
                    content
                  );
                  
                  // Adicionar resposta do DisparaJá aos dados de resposta
                  responseData.status = 'sent';
                  responseData.channel = 'disparaja';
                  responseData.response = disparaJaResponse;
                  
                  // Se a mensagem foi enviada com sucesso e a conexão está marcada como inativa,
                  // atualizar o status para ativo no banco de dados
                  if (responseData.status === 'sent' && disparaJaConnection.status !== 'ativo') {
                    try {
                      safeLog(`Atualizando status da conexão DisparaJá para 'ativo'`);
                      await prisma.$executeRaw`
                        UPDATE "dispara_ja_connections"
                        SET status = 'ativo', "updatedAt" = NOW()
                        WHERE id = ${disparaJaConnection.id}
                      `;
                      safeLog(`Status da conexão atualizado com sucesso`);
                    } catch (updateError) {
                      console.error(`Erro ao atualizar status da conexão:`, updateError);
                    }
                  }
                }
                
                // Adicionar a mensagem ao thread do OpenAI Assistant (se existir)
                if (threadId) {
                  safeLog(`Adicionando mensagem ao thread OpenAI`);
                  
                  const humanMessageHandler = new DisparaJaHumanMessageHandler(openai, logger);
                  
                  const threadResult = await humanMessageHandler.addMessageToThread(
                    threadId,
                    content,
                    correlationId,
                    agent?.assistant_id || undefined
                  );
                  
                  responseData.threadStatus = threadResult.success ? 'success' : 'error';
                  responseData.threadMessage = threadResult.message;
                }
              } catch (disparaJaError: any) {
                console.error('Erro ao enviar mensagem DisparaJá:', disparaJaError);
                responseData.status = 'error';
                responseData.message = `Erro ao enviar mensagem: ${disparaJaError.message}`;
              }
            }
          } else {
            // Canal WhatsApp Cloud (comportamento atual)
            safeLog(`Buscando conexão WhatsApp Cloud`);
            const whatsappConnection = await prisma.whatsapp_cloud_connections.findFirst({
              where: {
                workspaceId: workspaceId,
                status: 'active'
              },
              include: {
                agents: true
              }
            });
            
            if (!whatsappConnection) {
              responseData.status = 'error';
              responseData.message = 'Conexão WhatsApp Cloud não encontrada ou inativa';
              console.error('Conexão WhatsApp Cloud não encontrada ou inativa');
            } else {
              // Criar instância da API do WhatsApp
              const whatsappApi = new WhatsAppCloudAPIUnified(
                whatsappConnection.accessToken,
                whatsappConnection.phoneNumberId
              );
              
              // Enviar mensagem para o WhatsApp
              try {
                safeLog(`Enviando mensagem WhatsApp`);
                const whatsappResponse = await whatsappApi.sendText(
                  leadPhone,
                  content
                );
                
                // Adicionar resposta do WhatsApp aos dados de resposta
                responseData.status = 'sent';
                responseData.channel = 'whatsapp-cloud';
                responseData.response = whatsappResponse;
                
                // Adicionar a mensagem ao thread do OpenAI Assistant
                if (threadId) {
                  safeLog(`Adicionando mensagem ao thread OpenAI`);
                  
                  // Usar diretamente o WhatsAppCloudHumanMessageHandler para evitar criar o processador completo
                  const humanMessageHandler = new WhatsAppCloudHumanMessageHandler(openai, logger);
                  
                  // Adicionar a mensagem ao thread
                  const threadResult = await humanMessageHandler.addMessageToThread(
                    threadId,
                    content,
                    correlationId,
                    whatsappConnection.agents?.assistant_id || undefined
                  );
                  
                  responseData.threadStatus = threadResult.success ? 'success' : 'error';
                  responseData.threadMessage = threadResult.message;
                }
              } catch (whatsappError: any) {
                console.error('Erro ao enviar mensagem WhatsApp:', whatsappError);
                responseData.status = 'error';
                responseData.message = `Erro ao enviar mensagem: ${whatsappError.message}`;
              }
            }
          }
        }
      } catch (error: any) {
        console.error('Erro ao processar envio de mensagem:', error);
        responseData.status = 'error';
        responseData.message = `Erro ao processar mensagem: ${error.message}`;
      }
    }

    // Usar o timestamp fornecido na requisição, ou o timestamp atual se não fornecido
    const messageTimestamp = createdAt ? new Date(createdAt) : new Date();
    
    // Formatar o timestamp para garantir que seja salvo sem conversão automática para UTC
    // Formatando no formato PostgreSQL: 'YYYY-MM-DD HH:MM:SS'
    const formattedTimestamp = messageTimestamp.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
    
    safeLog(`Salvando mensagem com timestamp local`);

    // Criar nova mensagem no banco de dados
    const messageId = await prisma.$queryRaw<{id: string}[]>`
      INSERT INTO messages (
        id,
        conversation_id,
        content,
        sender,
        read,
        created_at,
        updated_at,
        is_manual,
        type
      )
      VALUES (
        gen_random_uuid(),
        ${conversationId}::uuid,
        ${content},
        ${sender},
        ${sender === 'user'},
        ${formattedTimestamp}::timestamp without time zone,
        ${formattedTimestamp}::timestamp without time zone,
        ${isManual},
        'text'
      )
      RETURNING id
    `;

    // Adicionar ID da mensagem salva à resposta
    if (messageId && messageId.length > 0) {
      responseData.messageId = messageId[0].id;
      responseData.status = 'saved';
    }

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar mensagem' },
      { status: 500 }
    );
  }
} 
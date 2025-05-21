import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';

interface Message {
  id: string;
  content: string;
  sender: string;
  createdAt: Date;
  isManual: boolean;
  type: string;
  mediaUrl?: string | null;
}

// Armazenar o último timestamp por conversa para persistir entre instâncias da API
const lastTimestampCache = new Map<string, Date>();
// Armazenar os IDs das mensagens já enviadas para cada conversa
const sentMessagesCache = new Map<string, Set<string>>();

// Configurar para usar o runtime Node.js padrão
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { workspaceId } = await getWorkspaceFromContext();
  
  // Obter o ID de forma assíncrona
  const id = (await params).id;
  
  // Chave única para esta conversa no contexto do workspace
  const cacheKey = `${workspaceId}:${id}`;

  // Verificar se a conversa pertence ao workspace
  const conversation = await prisma.$queryRaw<{ id: string }[]>`
    SELECT c.id 
    FROM conversations c
    JOIN leads l ON c.lead_id = l.id
    WHERE c.id = ${id}::uuid
    AND l."workspaceId" = ${workspaceId}
  `;

  if (!conversation || conversation.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Conversa não encontrada neste workspace' }),
      { status: 404 }
    );
  }

  const encoder = new TextEncoder();
  const customHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  // Inicializar o cache de mensagens enviadas se não existir
  if (!sentMessagesCache.has(cacheKey)) {
    sentMessagesCache.set(cacheKey, new Set<string>());
  }
  
  // Resetar o timestamp em cada nova conexão para garantir que nenhuma mensagem seja perdida
  // Usamos o timestamp de 10 segundos atrás para garantir que mensagens recentes sejam incluídas
  const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
  lastTimestampCache.set(cacheKey, tenSecondsAgo);
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Função para buscar novas mensagens
        const checkNewMessages = async () => {
          try {
            // Buscar apenas mensagens novas com timestamp maior
            const messages = await prisma.$queryRaw<Message[]>`
              SELECT 
                m.id,
                m.content,
                m.sender,
                m.created_at as "createdAt",
                m.is_manual as "isManual",
                m.type,
                m.media_url as "mediaUrl"
              FROM messages m
              JOIN conversations c ON m.conversation_id = c.id
              JOIN leads l ON c.lead_id = l.id
              WHERE c.id = ${id}::uuid
              AND l."workspaceId" = ${workspaceId}
              AND m.created_at > ${lastTimestampCache.get(cacheKey)}
              ORDER BY m.created_at ASC
            `;

            if (messages.length > 0) {
              const sentMessages = sentMessagesCache.get(cacheKey)!;
              let latestTimestamp = lastTimestampCache.get(cacheKey);
              let newMessagesCount = 0;

              // Ordenar mensagens por timestamp para garantir a ordem cronológica correta
              const orderedMessages = [...messages].sort((a, b) => {
                const timeA = new Date(a.createdAt).getTime();
                const timeB = new Date(b.createdAt).getTime();
                return timeA - timeB;
              });

              // Armazenar as mensagens para envio em lote
              const messagesToSend = [];

              // Primeira passagem: apenas processa as mensagens
              for (const message of orderedMessages) {
                // Atualizar o último timestamp se esta mensagem for mais recente
                if (message.createdAt > latestTimestamp!) {
                  latestTimestamp = message.createdAt;
                }
                
                // Pular se já enviamos esta mensagem
                if (sentMessages.has(message.id)) {
                  continue;
                }

                // Marcar como enviada
                sentMessages.add(message.id);
                newMessagesCount++;

                // Formatar a mensagem para envio
                const messageData = {
                  id: message.id,
                  content: message.content,
                  sender: message.sender,
                  createdAt: new Date(message.createdAt).toISOString(),
                  isManual: message.isManual,
                  type: message.type || 'text',
                  mediaUrl: message.mediaUrl
                };

                // Adicionar à lista de mensagens para envio
                messagesToSend.push(messageData);
              }

              // Ordenar novamente as mensagens a serem enviadas por timestamp
              messagesToSend.sort((a, b) => {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              });

              // Segunda passagem: envia as mensagens em ordem
              for (const messageData of messagesToSend) {
                const data = JSON.stringify(messageData);
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }

              // Atualizar o timestamp no cache somente se encontramos mensagens mais recentes
              if (latestTimestamp !== lastTimestampCache.get(cacheKey)) {
                // Não precisamos adicionar tempo extra, pois estamos usando "greater than" na consulta
                lastTimestampCache.set(cacheKey, latestTimestamp!);
              }

              if (newMessagesCount > 0) {
                console.log(`SSE: Enviadas ${newMessagesCount} novas mensagens para conversa ${id}`);
              }
            }
            
            // Limitar o tamanho do cache para evitar crescimento excessivo
            const sentMessages = sentMessagesCache.get(cacheKey)!;
            if (sentMessages.size > 500) {
              // Manter apenas as últimas 200 mensagens no cache
              const messagesToKeep = Array.from(sentMessages).slice(-200);
              sentMessagesCache.set(cacheKey, new Set(messagesToKeep));
            }
          } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
            // Enviar erro para o cliente
            const errorData = JSON.stringify({
              error: 'Erro ao buscar mensagens'
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          }
        };

        // Executar uma vez imediatamente
        await checkNewMessages();
        
        // Verificar novas mensagens a cada 5 segundos (aumentado para reduzir carga)
        const interval = setInterval(checkNewMessages, 5000);

        // Limpar o intervalo quando a conexão for fechada
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
          console.log(`SSE: Conexão encerrada para conversa ${id}`);
        });

      } catch (error) {
        console.error('Erro no stream:', error);
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: customHeaders
  });
} 
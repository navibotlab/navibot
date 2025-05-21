import { NextRequest, NextResponse } from 'next/server';
import { Prisma, dispara_ja_connections } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Função para gerar a URL do webhook
function generateWebhookUrl(connectionId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  // Remover qualquer barra no final da URL base para evitar barras duplicadas
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}/api/dispara-ja/webhook/${connectionId}`;
}

// Endpoint para verificar o status da conexão
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const infoLink = searchParams.get('infoLink');
    const secret = searchParams.get('secret');
    const sid = searchParams.get('sid');

    // Validar parâmetros
    if (!infoLink || !secret || !sid) {
      console.error('[VerifyConnection API] Parâmetros inválidos');
      return NextResponse.json({ 
        success: false, 
        status: 'error',
        message: 'Parâmetros inválidos. Informe infoLink, secret e sid.'
      }, { status: 400 });
    }

    // Fazer a requisição para o infoLink para verificar o status
    console.log(`[VerifyConnection API] Verificando status usando infoLink original`);
    
    try {
      const response = await fetch(infoLink, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        console.error(`[VerifyConnection API] Erro na resposta: ${response.status} ${response.statusText}`);
        return NextResponse.json({ 
          success: false, 
          status: 'error',
          message: `Erro na resposta: ${response.status} ${response.statusText}`
        }, { status: 500 });
      }

      // Analisar a resposta
      const data = await response.json();
      console.log(`[VerifyConnection API] Resposta do DisparaJá:`, data);

      // Verificar se o WhatsApp já foi conectado
      if (data.status === 200 && data.message === 'WhatsApp Information') {
        console.log('[VerifyConnection API] WhatsApp conectado, obtendo informações...');
        
        // Aqui vamos tentar salvar a conexão
        if (data.data && data.data.wid && data.data.unique) {
          const phoneNumber = data.data.wid.replace('@s.whatsapp.net', '');
          
          try {
            // Criar/atualizar a conexão diretamente usando o prisma
            let connection: dispara_ja_connections | null = null;
            const existingConnection = await prisma.dispara_ja_connections.findFirst({
              where: {
                phoneNumber: phoneNumber,
                agents: {
                  id: searchParams.get('agentId') || ''
                }
              }
            });

            if (existingConnection) {
              connection = await prisma.dispara_ja_connections.update({
                where: { id: existingConnection.id },
                data: {
                  secret,
                  token: secret,
                  unique: data.data.unique,
                  status: 'active',
                  updatedAt: new Date()
                }
              });
            } else {
              // Antes de criar a conexão, buscar o agente para obter o workspaceId
              const agentId = searchParams.get('agentId') || '';
              const agent = await prisma.$queryRaw`
                SELECT "workspaceId" FROM agents WHERE id = ${agentId} LIMIT 1
              `;

              if (!agent || !Array.isArray(agent) || agent.length === 0) {
                return NextResponse.json({ 
                  success: false, 
                  status: 'error',
                  message: 'Agente não encontrado'
                }, { status: 404 });
              }

              // Gerar um ID para a conexão
              const connectionId = crypto.randomUUID();
              
              // Usar SQL diretamente para evitar problemas com o sistema de tipos do Prisma
              await prisma.$executeRaw`
                INSERT INTO dispara_ja_connections (
                  id, "phoneNumber", secret, sid, token, "unique", status, "agentId", provider, "webhookUrl", "workspaceId", "createdAt", "updatedAt"
                ) VALUES (
                  ${connectionId},
                  ${phoneNumber},
                  ${secret},
                  ${sid},
                  ${secret},
                  ${data.data.unique},
                  'active',
                  ${agentId},
                  'DISPARA_JA',
                  '',
                  ${agent[0].workspaceId},
                  now(),
                  now()
                )
              `;
              
              // Buscar a conexão criada
              connection = await prisma.dispara_ja_connections.findUnique({
                where: { id: connectionId }
              });

              if (connection) {
                // Atualizar o webhookUrl com o ID correto
                const webhookUrl = generateWebhookUrl(connection.id);
                await prisma.dispara_ja_connections.update({
                  where: { id: connection.id },
                  data: {
                    webhookUrl
                  }
                });
                
                // Verificar novamente se a conexão existe após a atualização final
                const finalConnection = await prisma.dispara_ja_connections.findUnique({
                  where: { id: connectionId }
                });

                if (!finalConnection) {
                  console.error('[VerifyConnection API] Erro: Não foi possível recuperar a conexão após atualização');
                  return NextResponse.json({ 
                    success: false, 
                    status: 'error',
                    message: 'Erro ao criar conexão' 
                  }, { status: 500 });
                }

                return NextResponse.json({
                  success: true,
                  status: 'success',
                  connection: finalConnection
                }, { status: 200 });
              } else {
                console.error('[VerifyConnection API] Erro: Conexão não encontrada após criação');
                return NextResponse.json({ 
                  success: false, 
                  status: 'error',
                  message: 'Erro ao criar conexão'
                }, { status: 500 });
              }
            }

            return NextResponse.json({
              success: true,
              status: 'success',
              connection: connection as dispara_ja_connections
            }, { status: 200 });

          } catch (saveError) {
            console.error('[VerifyConnection API] Erro ao salvar conexão:', saveError);
            return NextResponse.json({ 
              success: false, 
              status: 'error',
              message: 'Erro ao salvar conexão no banco de dados'
            }, { status: 500 });
          }
        }
      }

      // Verificar se o QR Code foi lido
      if (data.message === 'Waiting for WhatsApp information!') {
        console.log('[VerifyConnection API] QR Code lido, aguardando informações do WhatsApp...');
        return NextResponse.json({ 
          success: false, 
          status: 'waiting',
          message: 'QR Code lido! Aguardando informações do WhatsApp...'
        });
      }

      // Verificar se o QR Code expirou
      if (data.message === 'QRCode expired!') {
        console.log('[VerifyConnection API] QR Code expirado');
        return NextResponse.json({ 
          success: false, 
          status: 'error',
          message: 'QR Code expirado. Por favor, gere um novo.'
        });
      }

      // Para qualquer outra mensagem, assumir que ainda está aguardando
      return NextResponse.json({ 
        success: false, 
        status: 'waiting',
        message: data.message || 'Aguardando leitura do QR Code...'
      });

    } catch (error) {
      console.error('[VerifyConnection API] Erro ao verificar status:', error);
      return NextResponse.json({ 
        success: false, 
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro ao verificar status'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[VerifyConnection API] Erro interno:', error);
    return NextResponse.json({ 
      success: false, 
      status: 'error',
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// Endpoint para salvar uma conexão verificada
export async function POST(request: Request) {
  try {
    // Obter os dados do corpo da requisição
    const { secret, token, sid, phoneNumber, unique, agentId } = await request.json();

    // Validar campos obrigatórios
    if (!secret || !phoneNumber || !unique || !agentId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Parâmetros inválidos. Informe secret, phoneNumber, unique e agentId.'
      }, { status: 400 });
    }

    console.log(`[VerifyConnection API] Salvando conexão para o número ${phoneNumber}, agente ${agentId}`);

    try {
      // Verificar se já existe uma conexão com este número para este agente
      const existingConnection = await prisma.dispara_ja_connections.findFirst({
        where: {
          phoneNumber: phoneNumber,
          agents: {
            id: agentId
          }
        }
      });

      let connection: dispara_ja_connections | null = null;

      if (existingConnection) {
        // Atualizar a conexão existente
        console.log(`[VerifyConnection API] Atualizando conexão existente com ID ${existingConnection.id}`);
        connection = await prisma.dispara_ja_connections.update({
          where: { id: existingConnection.id },
          data: {
            secret: secret,
            unique: unique,
            status: 'active',
            updatedAt: new Date()
          }
        });
      } else {
        // Antes de criar a conexão, buscar o agente para obter o workspaceId
        const agent = await prisma.$queryRaw`
          SELECT "workspaceId" FROM agents WHERE id = ${agentId} LIMIT 1
        `;

        if (!agent || !Array.isArray(agent) || agent.length === 0) {
          return NextResponse.json({ 
            success: false, 
            error: 'Agente não encontrado'
          }, { status: 404 });
        }

        // Gerar um ID para a conexão
        const connectionId = crypto.randomUUID();
        
        // Usar SQL diretamente para evitar problemas com o sistema de tipos do Prisma
        await prisma.$executeRaw`
          INSERT INTO dispara_ja_connections (
            id, "phoneNumber", secret, sid, token, "unique", status, "agentId", provider, "webhookUrl", "workspaceId", "createdAt", "updatedAt"
          ) VALUES (
            ${connectionId},
            ${phoneNumber},
            ${secret},
            ${sid},
            ${secret},
            ${unique},
            'active',
            ${agentId},
            'DISPARA_JA',
            '',
            ${agent[0].workspaceId},
            now(),
            now()
          )
        `;
        
        // Buscar a conexão criada
        connection = await prisma.dispara_ja_connections.findUnique({
          where: { id: connectionId }
        });
        
        if (connection) {
          // Atualizar o webhookUrl com o ID correto
          const webhookUrl = generateWebhookUrl(connection.id);
          await prisma.dispara_ja_connections.update({
            where: { id: connection.id },
            data: {
              webhookUrl
            }
          });
          
          // Verificar novamente se a conexão existe após a atualização final
          const finalConnection = await prisma.dispara_ja_connections.findUnique({
            where: { id: connection.id }
          });

          if (!finalConnection) {
            console.error('[VerifyConnection API] Erro: Não foi possível recuperar a conexão após atualização');
            return NextResponse.json({ 
              success: false, 
              error: 'Erro ao criar conexão' 
            }, { status: 500 });
          }

          console.log(`[VerifyConnection API] Conexão salva com sucesso! ID: ${connection.id}`);

          return NextResponse.json({
            success: true,
            connection: finalConnection
          }, { status: 200 });
        } else {
          console.error('[VerifyConnection API] Erro: Conexão não encontrada após criação');
          return NextResponse.json({ 
            success: false, 
            error: 'Erro ao criar conexão'
          }, { status: 500 });
        }
      }

      console.log(`[VerifyConnection API] Conexão salva com sucesso! ID: ${connection.id}`);

      if (!connection) {
        console.error('[VerifyConnection API] Erro: Conexão inexistente');
        return NextResponse.json({ 
          success: false, 
          status: 'error',
          message: 'Erro ao recuperar conexão'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        status: 'success',
        connection: connection
      }, { status: 200 });

    } catch (dbError) {
      console.error('[VerifyConnection API] Erro ao salvar conexão no banco de dados:', dbError);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao salvar conexão no banco de dados'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[VerifyConnection API] Erro interno:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Buscar todas as conexões independente do workspace para diagnóstico
    const allConnections = await prisma.whatsAppCloudConnection.findMany({
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            workspaceId: true
          }
        }
      }
    });
    
    // Buscar os workspaces disponíveis
    const workspaces = await prisma.workspace.findMany({
      select: {
        id: true,
        name: true
      }
    });

    return NextResponse.json({
      mensagem: "Diagnóstico de conexões WhatsApp Cloud",
      total_conexoes: allConnections.length,
      total_workspaces: workspaces.length,
      conexoes: allConnections.map(conn => ({
        id: conn.id,
        phoneNumberId: conn.phoneNumberId,
        status: conn.status,
        agentId: conn.agentId,
        agentName: conn.agent?.name,
        workspaceId: conn.agent?.workspaceId,
        createdAt: conn.createdAt,
      })),
      workspaces: workspaces
    });
  } catch (error) {
    console.error('Erro no diagnóstico:', error);
    return NextResponse.json(
      { error: 'Erro ao realizar diagnóstico', detalhes: String(error) },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('[API] POST /api/agents/cleanup - Limpando todos os agentes');
    
    // Primeiro, remove todas as conexões WhatsApp
    await prisma.whatsapp_cloud_connections.deleteMany({});
    console.log('[API] Conexões WhatsApp removidas');
    
    // Depois remove todos os agentes
    await prisma.agents.deleteMany({});
    console.log('[API] Agentes removidos');
    
    return NextResponse.json({
      success: true,
      message: "Todos os agentes foram removidos com sucesso"
    });
  } catch (error) {
    console.error('[API] Erro ao limpar agentes:', error);
    return NextResponse.json(
      { 
        error: "Erro ao limpar agentes", 
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 200 }
    );
  }
} 
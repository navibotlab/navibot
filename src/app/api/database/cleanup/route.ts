import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    console.log('[API] POST /api/database/cleanup - Limpando banco de dados');
    
    // Executar queries SQL diretamente
    await prisma.$executeRaw`SET session_replication_role = 'replica'`;
    await prisma.$executeRaw`TRUNCATE TABLE "whatsapp_connections" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "agents" CASCADE`;
    await prisma.$executeRaw`ALTER SEQUENCE agent_id_seq RESTART WITH 1002`;
    await prisma.$executeRaw`SET session_replication_role = 'origin'`;
    
    console.log('[API] Banco de dados limpo com sucesso');
    
    return NextResponse.json({
      success: true,
      message: "Banco de dados limpo com sucesso"
    });
  } catch (error) {
    console.error('[API] Erro ao limpar banco de dados:', error);
    return NextResponse.json(
      { 
        error: "Erro ao limpar banco de dados", 
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 
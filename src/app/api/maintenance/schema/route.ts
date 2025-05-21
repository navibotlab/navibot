import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Este endpoint é apenas para manutenção
// Adiciona as colunas media_duration e media_type à tabela messages
export async function GET() {
  try {
    // Verificar se as colunas já existem
    const existingColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages' 
      AND column_name IN ('media_duration', 'media_type')
    `;
    
    if (Array.isArray(existingColumns) && existingColumns.length === 2) {
      return NextResponse.json({ message: 'Colunas já existem' });
    }
    
    // Adicionar colunas via comandos SQL diretos
    await prisma.$executeRaw`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS media_duration INTEGER,
      ADD COLUMN IF NOT EXISTS media_type TEXT
    `;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Colunas adicionadas com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao alterar esquema:', error);
    return NextResponse.json(
      { error: 'Erro ao alterar esquema do banco de dados', details: error },
      { status: 500 }
    );
  }
} 
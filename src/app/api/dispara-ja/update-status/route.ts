import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Interface para a conexão do Dispara Já
interface DisparaJaConnection {
  id: string;
  status: string;
}

export async function POST(req: Request) {
  try {
    const { connections } = await req.json();

    // Validar os dados recebidos
    if (!connections || !Array.isArray(connections)) {
      return NextResponse.json(
        { error: 'Dados de conexões inválidos' },
        { status: 400 }
      );
    }

    // Array para armazenar os resultados das atualizações
    const results = [];

    // Processar cada conexão
    for (const conn of connections) {
      try {
        // Verificar se a conexão tem id e status
        if (!conn.id || !conn.status) {
          results.push({
            id: conn.id || 'unknown',
            success: false,
            error: 'ID ou status não fornecidos'
          });
          continue;
        }

        // Atualizar o status da conexão usando SQL direto
        const now = new Date();
        
        await prisma.$executeRaw`
          UPDATE "dispara_ja_connections" 
          SET 
            "status" = ${conn.status}, 
            "updatedAt" = ${now}
          WHERE "id" = ${conn.id}
        `;

        results.push({
          id: conn.id,
          success: true,
          status: conn.status
        });
      } catch (error) {
        console.error(`Erro ao atualizar conexão ${conn.id}:`, error);
        results.push({
          id: conn.id || 'unknown',
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Erro ao atualizar status das conexões:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status das conexões' },
      { status: 500 }
    );
  }
} 
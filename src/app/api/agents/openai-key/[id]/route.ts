import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { openaiApiKey } = body;

    if (!openaiApiKey) {
      return new NextResponse('OpenAI API key is required', { status: 400 });
    }

    // Obter o ID de forma assíncrona
    const id = await params.id;
    
    // Atualizar a chave da API do agente
    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: { openaiApiKey }
    });

    return NextResponse.json({
      message: 'OpenAI API key updated successfully',
      agent: {
        id: updatedAgent.id,
        name: updatedAgent.name
      }
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar chave da API OpenAI:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
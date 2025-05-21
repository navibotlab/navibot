import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';

export async function GET() {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter ID do workspace atual
    const { workspaceId } = await getWorkspaceFromContext();
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace não encontrado' },
        { status: 404 }
      );
    }

    // Buscar usuários do workspace
    const workspaceUsers = await prisma.users.findMany({
      where: {
        workspaceId: workspaceId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Formatar a resposta para manter a mesma estrutura da API do workspace
    return NextResponse.json({ users: workspaceUsers.map(user => ({
      id: user.id,
      name: user.name || 'Usuário sem nome',
      email: user.email || '',
      role: user.role,
      photo: null
    })) });
  } catch (error) {
    console.error('Erro ao buscar usuários da conta:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
} 
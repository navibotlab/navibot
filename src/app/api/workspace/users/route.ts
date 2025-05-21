import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';

// Interface para tipificar o resultado de users
interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  workspaceId: string;
  image?: string | null;
  permissions?: any;
}

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
        role: true,
        workspaceId: true,
        permissions: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Formatar a resposta
    const users = workspaceUsers.map((user: User) => ({
      id: user.id,
      name: user.name || 'Usuário sem nome',
      email: user.email || '',
      role: user.role,
      photo: null // Não há campo de imagem no modelo users, então definimos como null
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Erro ao buscar usuários do workspace:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
} 
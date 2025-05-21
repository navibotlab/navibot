import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Definir permissões padrão por role
const DEFAULT_PERMISSIONS = {
  owner: {
    // O proprietário tem todas as permissões, mas algumas funções específicas dele
    users: {
      view: true,
      create: true,
      update: true,
      delete: true,
      manage: true // Agora pode gerenciar usuários via menu
    },
    leads: {
      view: true,
      create: true,
      update: true,
      delete: true
    },
    conversations: {
      view: true,
      reply: true,
      delete: true
    },
    agents: {
      view: true,
      create: true,
      update: true,
      delete: true
    },
    settings: {
      view: true,
      update: true
    },
    billing: {
      view: true,
      update: true
    }
  },
  admin: {
    users: {
      view: true,
      create: true,
      update: true,
      delete: true,
      manage: true
    },
    leads: {
      view: true,
      create: true,
      update: true,
      delete: true
    },
    conversations: {
      view: true,
      reply: true,
      delete: true
    },
    agents: {
      view: true,
      create: true,
      update: true,
      delete: true
    },
    settings: {
      view: true,
      update: true
    },
    billing: {
      view: false,
      update: false
    }
  },
  user: {
    users: {
      view: false,
      create: false,
      update: false,
      delete: false,
      manage: false
    },
    leads: {
      view: true,
      create: true,
      update: true,
      delete: false
    },
    conversations: {
      view: true,
      reply: true,
      delete: false
    },
    agents: {
      view: true,
      create: false,
      update: false,
      delete: false
    },
    settings: {
      view: false,
      update: false
    },
    billing: {
      view: false,
      update: false
    }
  }
};

// GET: Obter as permissões do usuário atual
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar o usuário com suas permissões
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        // O campo permissions ainda não existe na definição atual do schema
        // permissions: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Por enquanto, usamos as permissões padrão baseadas na role
    // No futuro, quando o campo permissions estiver disponível, combinaremos com as personalizadas
    const rolePermissions = DEFAULT_PERMISSIONS[user.role as keyof typeof DEFAULT_PERMISSIONS] || DEFAULT_PERMISSIONS.user;
    
    // No futuro, fazer merge das permissões personalizadas:
    // const customPermissions = user.permissions || {};
    // const mergedPermissions = deepMerge(rolePermissions, customPermissions);

    return NextResponse.json({
      role: user.role,
      permissions: rolePermissions
    });
  } catch (error) {
    console.error('Erro ao obter permissões:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcrypt';
import { Prisma, users } from '@prisma/client';

// Interface para estender o tipo User do Prisma
interface UserWithPermissions extends Omit<users, 'permissions'> {
  permissions?: Record<string, any>;
}

// GET - Obter um usuário específico por ID
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Usando await para acessar context.params
    const params = await context.params;
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    const currentUser = await prisma.users.findUnique({
      where: { id: session.user.id }
    });

    // Verificar se o usuário é admin, owner ou se está tentando acessar seus próprios dados
    const isAdmin = currentUser?.role === 'admin';
    const isOwner = currentUser?.role === 'owner';
    const isSelfAccess = session.user.id === userId;

    if (!isAdmin && !isOwner && !isSelfAccess) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    // Usar raw query para garantir que podemos obter as permissões
    const user = await prisma.$queryRaw<UserWithPermissions[]>`
      SELECT * FROM users WHERE id = ${userId} LIMIT 1
    `;

    if (!user?.length) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const userData = user[0];

    // Verificar se o usuário pertence ao mesmo workspace (importante para segurança)
    // Proprietários (owners) podem acessar qualquer usuário
    if (userData.workspaceId !== session.user.workspaceId && !isOwner) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    // Remover campos sensíveis antes de retornar
    const { password, resetToken, verifyToken, ...userSafeData } = userData;

    return NextResponse.json({
      ...userSafeData,
      permissions: userSafeData.permissions || {}
    });

  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}

// PUT - Atualiza um usuário específico
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Usando await para acessar context.params
    const params = await context.params;
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    const currentUser = await prisma.users.findUnique({
      where: { id: session.user.id }
    });

    // Verificar se o usuário é admin ou se está atualizando seus próprios dados
    const isAdmin = currentUser?.role === 'admin';
    const isOwner = currentUser?.role === 'owner';
    const isSelfUpdate = session.user.id === userId;

    if (!isAdmin && !isOwner && !isSelfUpdate) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    // Obter dados para atualização
    const updateData = await request.json();
    
    // Validações básicas
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum dado fornecido para atualização' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe e pertence ao mesmo workspace
    const existingUser = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Proprietários (owners) podem editar usuários de qualquer workspace
    if (existingUser.workspaceId !== session.user.workspaceId && !isOwner) {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    // Restrições de campos que podem ser atualizados
    // Owners podem atualizar todos os campos
    // Admins podem atualizar role, status, etc.
    // Usuários comuns só podem atualizar nome e senha
    const allowedFields = isOwner
      ? ['name', 'role', 'status', 'email']
      : isAdmin 
        ? ['name', 'role', 'status'] 
        : ['name'];
    
    // Filtrar apenas campos permitidos
    const filteredData: Prisma.usersUpdateInput = {};
    for (const field of allowedFields) {
      if (field in updateData) {
        // @ts-ignore - Adiciona campos dinâmicos ao objeto
        filteredData[field] = updateData[field];
      }
    }

    // Se admin ou owner está alterando uma role, validar valor válido
    if ((isAdmin || isOwner) && filteredData.role) {
      // Definir quais roles são válidas com base no usuário autenticado
      const validRoles = isOwner 
        ? ['admin', 'user', 'owner'] // Owner pode atribuir qualquer role
        : ['admin', 'user'];         // Admin só pode atribuir admin e user
        
      if (!validRoles.includes(filteredData.role as string)) {
        return NextResponse.json(
          { error: 'Role inválida' },
          { status: 400 }
        );
      }
      
      // Verificar se um admin está tentando promover alguém a owner (não permitido)
      if (isAdmin && !isOwner && filteredData.role === 'owner') {
        return NextResponse.json(
          { error: 'Apenas proprietários podem promover usuários a Proprietários' },
          { status: 403 }
        );
      }
    }

    // Verificar se o usuário a ser modificado é um owner, restringir mudanças apenas a outros owners
    if (existingUser.role === 'owner' && !isOwner) {
      return NextResponse.json(
        { error: 'Não é possível modificar um usuário Proprietário. Apenas outros proprietários podem editar proprietários.' },
        { status: 403 }
      );
    }

    // Se mudar a senha, fazer hash
    if (updateData.password) {
      filteredData.password = await hash(updateData.password, 10);
    }

    // Atualizar usuário
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: filteredData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Exclui um usuário específico
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Usando await para acessar context.params
    const params = await context.params;
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    const currentUser = await prisma.users.findUnique({
      where: { id: session.user.id }
    });

    // Verificar permissões
    const isAdmin = currentUser?.role === 'admin';
    const isOwner = currentUser?.role === 'owner';

    // Apenas admins e owners podem excluir usuários
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    // Impedir exclusão de si mesmo
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'Não é possível excluir seu próprio usuário' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const existingUser = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Admins podem excluir apenas usuários do mesmo workspace
    // Owners podem excluir qualquer usuário, independente do workspace
    if (isAdmin && !isOwner && existingUser.workspaceId !== session.user.workspaceId) {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    // Apenas owners podem excluir outros owners
    if (existingUser.role === 'owner' && !isOwner) {
      return NextResponse.json(
        { error: 'Apenas proprietários podem excluir outros proprietários' },
        { status: 403 }
      );
    }

    // Excluir o usuário
    await prisma.users.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      message: 'Usuário excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
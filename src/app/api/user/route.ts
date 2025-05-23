import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hash } from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateStrongPassword } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { sendVerificationEmail } from '@/lib/emailService';
import { Prisma } from '@prisma/client';

// Schema de validação para criação de usuário
const createUserSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  role: z.enum(['admin', 'user', 'owner'], { 
    errorMap: () => ({ message: 'Função deve ser admin, user ou owner (proprietário)' }) 
  }),
  workspaceId: z.string().optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
  password: z.string().min(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
});

// POST - Cria um novo usuário
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se o usuário é admin ou owner
    const currentUser = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true, workspaceId: true, name: true },
    });

    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "owner")) {
      return NextResponse.json({ error: "Apenas administradores e proprietários podem criar usuários" }, { status: 403 });
    }

    // Obter dados do corpo da requisição
    const { name, email, role = "user", permissionGroupId } = await request.json();

    // Validações básicas
    if (!name || !email) {
      return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 });
    }

    // Verificar se o email já está em uso
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email já está em uso" },
        { status: 400 }
      );
    }

    // Validar grupo de permissões se fornecido
    let validPermissionGroupId = null;
    if (permissionGroupId && permissionGroupId !== "default") {
      const permissionGroup = await prisma.permission_groups.findFirst({
        where: {
          id: permissionGroupId,
          workspaceId: currentUser.workspaceId
        }
      });
      
      if (!permissionGroup) {
        return NextResponse.json(
          { error: "Grupo de permissões não encontrado" },
          { status: 400 }
        );
      }
      
      validPermissionGroupId = permissionGroupId;
    }

    // Gerar senha temporária e token de verificação
    const tempPassword = generateStrongPassword();
    const hashedPassword = await hash(tempPassword, 10);
    const verifyToken = nanoid(32);
    const userId = nanoid();

    // Criar o usuário
    const user = await prisma.users.create({
      data: {
        id: userId,
        name,
        email,
        password: hashedPassword,
        role,
        workspaceId: currentUser.workspaceId,
        status: "pending",
        verifyToken,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Enviar email de convite
    await sendVerificationEmail(email, verifyToken, {
      isInvitation: true,
      adminName: session.user.name || '',
      userName: name,
      workspaceName: 'NaviBot'
    });

    // Retornar resposta com dados do usuário e senha temporária
    return NextResponse.json(
      {
        message: "Usuário criado com sucesso",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          tempPassword, // Incluir senha temporária apenas na resposta
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}

// GET - Lista todos os usuários (com paginação) ou retorna um usuário específico por ID
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se foi solicitado um usuário específico pelo ID
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("id");

    // Se tiver um ID, retornar detalhes específicos do usuário
    if (userId) {
      const currentUser = await prisma.users.findUnique({
        where: { id: session.user.id }
      });

      // Verificar se o usuário é admin ou se está tentando acessar seus próprios dados
      const isAdmin = currentUser?.role === 'admin';
      const isSelfAccess = session.user.id === userId;

      if (!isAdmin && !isSelfAccess) {
        return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
      }

      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          workspaceId: true,
          // Apenas admin pode ver campos adicionais
          ...(isAdmin ? {
            agentCount: true,
            planId: true,
          } : {})
        }
      });

      if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }

      // Verificar se o usuário pertence ao mesmo workspace (importante para segurança)
      if (user.workspaceId !== session.user.workspaceId) {
        return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
      }

      return NextResponse.json(user);
    }

    // Se não tiver ID, continuar com a lógica de listagem
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // Construir consulta de busca
    const whereClause = {
      workspaceId: session.user.workspaceId,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } }
        ]
      } : {})
    };

    // Total de registros para paginação
    const total = await prisma.users.count({
      where: whereClause,
    });

    // Buscar usuários do workspace atual
    const users = await prisma.users.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}

// PUT - Atualiza um usuário específico
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter o ID do usuário a ser atualizado
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("id");
    
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

    if (existingUser.workspaceId !== session.user.workspaceId) {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    // Verificar se o usuário a ser modificado é um owner, restringir mudanças apenas a outros owners
    if (existingUser.role === 'owner' && !isOwner) {
      return NextResponse.json(
        { error: 'Não é possível modificar um usuário Proprietário. Apenas outros proprietários podem editar proprietários.' },
        { status: 403 }
      );
    }

    // Restrições de campos que podem ser atualizados
    // Usuários comuns só podem atualizar nome e senha
    // Admins podem atualizar role, status, etc.
    const allowedFields = isAdmin 
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

    // Se admin está alterando uma role, validar valor válido
    if (isAdmin && filteredData.role) {
      const validRoles = ['admin', 'user', 'owner'];
      if (!validRoles.includes(filteredData.role as string)) {
        return NextResponse.json(
          { error: 'Role inválida' },
          { status: 400 }
        );
      }
    }

    // Se mudar a senha, fazer hash
    if (updateData.password) {
      const { hash } = await import('bcrypt');
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
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter o ID do usuário a ser excluído
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("id");
    
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

    // Verificar se o usuário existe e pertence ao mesmo workspace
    const userToDelete = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (userToDelete.workspaceId !== session.user.workspaceId) {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    // Impedir exclusão de um owner através da API por não-owners
    if (userToDelete?.role === 'owner' && !isOwner) {
      return NextResponse.json(
        { error: 'Não é possível excluir um usuário Proprietário. Apenas outros proprietários podem remover proprietários.' },
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
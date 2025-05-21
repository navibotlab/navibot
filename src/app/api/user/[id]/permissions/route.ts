import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { users } from "@prisma/client";

// Interface para estender o tipo User do Prisma
interface UserWithPermissions extends users {
  permissions?: Record<string, any>;
}

// Definir permissões padrão por role
const DEFAULT_PERMISSIONS = {
  owner: {
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

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Não autenticado", { status: 401 });
    }

    // Extrair o ID do usuário do contexto
    const { id } = await context.params;

    const user = await prisma.$queryRaw<UserWithPermissions[]>`
      SELECT * FROM users WHERE id = ${id}
    `;

    if (!user?.[0]) {
      return new NextResponse("Usuário não encontrado", { status: 404 });
    }

    // Aplicar permissões padrão com base na role se não houver permissões definidas
    const userPermissions = user[0].permissions || 
      (user[0].role && DEFAULT_PERMISSIONS[user[0].role as keyof typeof DEFAULT_PERMISSIONS]) || 
      DEFAULT_PERMISSIONS.user;

    // Lista de permissões disponíveis para UI
    const rawPermissions = [
      // Users
      { key: "users.view", name: "Visualizar usuários", description: "Permite visualizar usuários do sistema", category: "Usuários" },
      { key: "users.create", name: "Criar usuários", description: "Permite criar novos usuários", category: "Usuários" },
      { key: "users.update", name: "Editar usuários", description: "Permite editar usuários existentes", category: "Usuários" },
      { key: "users.delete", name: "Excluir usuários", description: "Permite excluir usuários", category: "Usuários" },
      { key: "users.manage", name: "Gerenciar permissões", description: "Permite gerenciar permissões de usuários", category: "Usuários" },
      
      // Leads
      { key: "leads.view", name: "Visualizar leads", description: "Permite visualizar leads", category: "Leads" },
      { key: "leads.create", name: "Criar leads", description: "Permite criar novos leads", category: "Leads" },
      { key: "leads.update", name: "Editar leads", description: "Permite editar leads existentes", category: "Leads" },
      { key: "leads.delete", name: "Excluir leads", description: "Permite excluir leads", category: "Leads" },
      
      // Conversations
      { key: "conversations.view", name: "Visualizar conversas", description: "Permite visualizar conversas", category: "Conversas" },
      { key: "conversations.reply", name: "Responder conversas", description: "Permite responder a conversas", category: "Conversas" },
      { key: "conversations.delete", name: "Excluir conversas", description: "Permite excluir conversas", category: "Conversas" },
      
      // Agents
      { key: "agents.view", name: "Visualizar agentes", description: "Permite visualizar agentes", category: "Agentes" },
      { key: "agents.create", name: "Criar agentes", description: "Permite criar novos agentes", category: "Agentes" },
      { key: "agents.update", name: "Editar agentes", description: "Permite editar agentes existentes", category: "Agentes" },
      { key: "agents.delete", name: "Excluir agentes", description: "Permite excluir agentes", category: "Agentes" },
      
      // Settings
      { key: "settings.view", name: "Visualizar configurações", description: "Permite visualizar configurações", category: "Configurações" },
      { key: "settings.update", name: "Editar configurações", description: "Permite editar configurações", category: "Configurações" },
      
      // Billing
      { key: "billing.view", name: "Visualizar faturamento", description: "Permite visualizar informações de faturamento", category: "Faturamento" },
      { key: "billing.update", name: "Gerenciar faturamento", description: "Permite gerenciar faturamento", category: "Faturamento" },
    ];

    // Retornar o usuário com suas permissões e a lista disponível
    return NextResponse.json({
      ...user[0],
      permissions: userPermissions,
      rawPermissions
    });
  } catch (error) {
    console.error("[USER_PERMISSIONS_GET]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Não autenticado", { status: 401 });
    }

    const body = await request.json();
    const { permissions } = body;

    if (!permissions) {
      return new NextResponse("Permissões são obrigatórias", { status: 400 });
    }

    // Extrair o ID do usuário do contexto
    const { id } = await context.params;

    // Atualizar usuário com as novas permissões
    const user = await prisma.$queryRaw<UserWithPermissions[]>`
      UPDATE users 
      SET permissions = ${JSON.stringify(permissions)}::jsonb 
      WHERE id = ${id}
      RETURNING *
    `;

    if (!user?.[0]) {
      return new NextResponse("Usuário não encontrado", { status: 404 });
    }

    // Retornar o usuário com suas permissões atualizadas
    return NextResponse.json({
      ...user[0],
      permissions: user[0].permissions || {}
    });
  } catch (error) {
    console.error("[USER_PERMISSIONS_PATCH]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
} 
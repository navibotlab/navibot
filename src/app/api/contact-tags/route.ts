import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { headers } from 'next/headers';

// Criar uma instância direta do PrismaClient para garantir que está disponível
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Schema de validação para criação e atualização de tags
const tagSchema = z.object({
  name: z.string().min(1, { message: 'Nome é obrigatório' }),
  color: z.string().min(1, { message: 'Cor é obrigatória' }),
  description: z.string().optional(),
  id: z.string().optional(),
});

// GET - Lista todas as tags de contato do workspace atual
export async function GET(req: NextRequest) {
  try {
    const headersList = await headers();
    const workspaceId = headersList.get('x-workspace-id');
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace não encontrado no contexto' }, { status: 400 });
    }
    
    // Buscar todas as tags do workspace com informações de uso
    // @ts-ignore - O modelo 'contact_tags' existe no runtime mas não é reconhecido pelo TypeScript
    const contactTags = await prisma.contact_tags.findMany({
      where: {
        workspaceId,
      },
      include: {
        // @ts-ignore - A relação 'leads' existe no banco, mas não é reconhecida corretamente pelo TypeScript
        leads: {
          select: {
            id: true
          }
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    // Formatar tags para incluir contagem de uso
    const formattedTags = contactTags.map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      createdAt: tag.created_at, // Note que o campo pode ser created_at em vez de createdAt
      updatedAt: tag.updated_at, // Note que o campo pode ser updated_at em vez de updatedAt
      // @ts-ignore - O relacionamento 'leads' existe no banco de dados mas não é reconhecido pelo TypeScript
      usageCount: tag.leads?.length || 0,
    }));
    
    return NextResponse.json(formattedTags);
  } catch (error) {
    console.error('Erro ao buscar tags de contato:', error);
    return NextResponse.json({ error: 'Erro ao buscar tags de contato' }, { status: 500 });
  }
}

// POST - Cria uma nova tag de contato
export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const workspaceId = headersList.get('x-workspace-id');
    
    console.log("POST /api/contact-tags - Iniciando criação de tag com workspace:", workspaceId);
    
    if (!workspaceId) {
      console.error("POST /api/contact-tags - Erro: Workspace não encontrado no contexto");
      return NextResponse.json({ error: 'Workspace não encontrado no contexto' }, { status: 400 });
    }
    
    const body = await req.json();
    console.log("POST /api/contact-tags - Dados recebidos:", body);
    
    // Validar os dados recebidos
    const validatedData = tagSchema.safeParse(body);
    
    if (!validatedData.success) {
      console.error("POST /api/contact-tags - Erro de validação:", validatedData.error.format());
      return NextResponse.json({ error: validatedData.error.format() }, { status: 400 });
    }
    
    const { name, color, description } = validatedData.data;
    
    // Verificar se já existe uma tag com o mesmo nome no workspace
    // @ts-ignore - O modelo 'contact_tags' existe no runtime mas não é reconhecido pelo TypeScript
    const existingTag = await prisma.contact_tags.findFirst({
      where: {
        name,
        workspaceId,
      },
    });
    
    if (existingTag) {
      console.error("POST /api/contact-tags - Tag duplicada:", name);
      return NextResponse.json({ error: 'Já existe uma tag com este nome' }, { status: 409 });
    }
    
    console.log("POST /api/contact-tags - Criando nova tag:", { name, color });
    
    // Criar a nova tag
    try {
      // @ts-ignore - O modelo 'contact_tags' existe no runtime mas não é reconhecido pelo TypeScript
      const newTag = await prisma.contact_tags.create({
        data: {
          id: nanoid(),
          name,
          color,
          description: description || '',
          workspaceId,
          updated_at: new Date()
        },
      });
      
      console.log("POST /api/contact-tags - Tag criada com sucesso:", newTag);
      
      return NextResponse.json({
        ...newTag,
        usageCount: 0,
        createdAt: newTag.created_at,
        updatedAt: newTag.updated_at
      }, { status: 201 });
    } catch (dbError) {
      console.error("POST /api/contact-tags - Erro no banco de dados:", dbError);
      return NextResponse.json({ error: 'Erro ao criar tag no banco de dados' }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro ao criar tag de contato:', error);
    return NextResponse.json({ error: 'Erro ao criar tag de contato' }, { status: 500 });
  }
}

// PUT - Atualiza uma tag de contato existente
export async function PUT(req: NextRequest) {
  try {
    const headersList = await headers();
    const workspaceId = headersList.get('x-workspace-id');
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace não encontrado no contexto' }, { status: 400 });
    }
    
    // Obter o ID da tag da query
    const id = req.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID da tag é obrigatório' }, { status: 400 });
    }
    
    const body = await req.json();
    
    // Validar os dados recebidos
    const validatedData = tagSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json({ error: validatedData.error.format() }, { status: 400 });
    }
    
    const { name, color, description } = validatedData.data;
    
    // Verificar se a tag existe e pertence ao workspace do usuário
    // @ts-ignore - O modelo 'contact_tags' existe no runtime mas não é reconhecido pelo TypeScript
    const existingTag = await prisma.contact_tags.findFirst({
      where: {
        id,
        workspaceId,
      },
    });
    
    if (!existingTag) {
      return NextResponse.json({ error: 'Tag não encontrada' }, { status: 404 });
    }
    
    // Verificar se já existe outra tag com o mesmo nome no workspace
    // @ts-ignore - O modelo 'contact_tags' existe no runtime mas não é reconhecido pelo TypeScript
    const duplicateTag = await prisma.contact_tags.findFirst({
      where: {
        name,
        workspaceId,
        id: { not: id },
      },
    });
    
    if (duplicateTag) {
      return NextResponse.json({ error: 'Já existe outra tag com este nome' }, { status: 409 });
    }
    
    // Atualizar a tag
    // @ts-ignore - O modelo 'contact_tags' existe no runtime mas não é reconhecido pelo TypeScript
    const updatedTag = await prisma.contact_tags.update({
      where: { id },
      data: {
        name,
        color,
        description,
      },
      include: {
        // @ts-ignore - A relação 'leads' existe no banco, mas não é reconhecida corretamente pelo TypeScript
        leads: {
          select: {
            id: true
          }
        },
      },
    });
    
    return NextResponse.json({
      ...updatedTag,
      // @ts-ignore - O relacionamento 'leads' existe no banco de dados mas não é reconhecido pelo TypeScript
      usageCount: updatedTag.leads?.length || 0,
      createdAt: updatedTag.created_at,
      updatedAt: updatedTag.updated_at
    });
  } catch (error) {
    console.error('Erro ao atualizar tag de contato:', error);
    return NextResponse.json({ error: 'Erro ao atualizar tag de contato' }, { status: 500 });
  }
}

// DELETE - Remove uma tag de contato
export async function DELETE(req: NextRequest) {
  try {
    const headersList = await headers();
    const workspaceId = headersList.get('x-workspace-id');
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace não encontrado no contexto' }, { status: 400 });
    }
    
    // Obter o ID da tag da query
    const id = req.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID da tag é obrigatório' }, { status: 400 });
    }
    
    // Verificar se a tag existe e pertence ao workspace do usuário
    // @ts-ignore - O modelo 'contact_tags' existe no runtime mas não é reconhecido pelo TypeScript
    const existingTag = await prisma.contact_tags.findFirst({
      where: {
        id,
        workspaceId,
      },
      include: {
        // @ts-ignore - A relação 'leads' existe no banco, mas não é reconhecida corretamente pelo TypeScript
        leads: true
      }
    });
    
    if (!existingTag) {
      return NextResponse.json({ error: 'Tag não encontrada' }, { status: 404 });
    }
    
    // Verificar se a tag está em uso e desconectar se necessário
    // @ts-ignore - O relacionamento 'leads' existe no banco de dados mas não é reconhecido pelo TypeScript
    if (existingTag.leads && existingTag.leads.length > 0) {
      // Desconectar a tag de todos os contatos antes de excluir
      // @ts-ignore - O modelo 'contact_tags' existe no runtime mas não é reconhecido pelo TypeScript
      await prisma.contact_tags.update({
        where: { id },
        data: {
          // @ts-ignore - A relação 'leads' existe no banco, mas não é reconhecida corretamente pelo TypeScript
          leads: {
            set: [] // Desconecta todos os leads desta tag
          }
        }
      });
    }
    
    // Excluir a tag
    // @ts-ignore - O modelo 'contact_tags' existe no runtime mas não é reconhecido pelo TypeScript
    await prisma.contact_tags.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, message: 'Tag excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir tag de contato:', error);
    return NextResponse.json({ error: 'Erro ao excluir tag de contato' }, { status: 500 });
  }
} 
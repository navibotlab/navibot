import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';

// Schema de validação para atualização de tags
const tagSchema = z.object({
  name: z.string().min(1, { message: 'Nome é obrigatório' }),
  color: z.string().min(1, { message: 'Cor é obrigatória' }),
  description: z.string().optional(),
});

// GET - Busca uma tag específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'ID da tag é obrigatório' }, { status: 400 });
    }
    
    // Buscar a tag com a contagem de uso
    // @ts-ignore - O relacionamento 'leads' existe no banco de dados mas não é reconhecido pelo TypeScript
    const tag = await prisma.contactTags.findFirst({
      where: {
        id,
        workspaceId,
      },
      include: {
        // @ts-expect-error - A relação 'leads' existe no banco, mas não é reconhecida corretamente pelo TypeScript
        leads: {
          select: {
            id: true
          }
        },
      },
    });
    
    if (!tag) {
      return NextResponse.json({ error: 'Tag não encontrada' }, { status: 404 });
    }
    
    // Formatar para incluir contagem de uso
    const formattedTag = {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      // @ts-ignore - O relacionamento 'leads' existe no banco de dados mas não é reconhecido pelo TypeScript
      usageCount: tag.leads?.length || 0,
    };
    
    return NextResponse.json(formattedTag);
  } catch (error) {
    console.error('Erro ao buscar tag de contato:', error);
    return NextResponse.json({ error: 'Erro ao buscar tag de contato' }, { status: 500 });
  }
}

// PUT - Atualiza uma tag de contato existente
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const id = params.id;
    
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
    const existingTag = await prisma.contactTags.findFirst({
      where: {
        id,
        workspaceId,
      },
    });
    
    if (!existingTag) {
      return NextResponse.json({ error: 'Tag não encontrada' }, { status: 404 });
    }
    
    // Verificar se já existe outra tag com o mesmo nome no workspace
    const duplicateTag = await prisma.contactTags.findFirst({
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
    // @ts-ignore - O relacionamento 'leads' existe no banco de dados mas não é reconhecido pelo TypeScript
    const updatedTag = await prisma.contactTags.update({
      where: { id },
      data: {
        name,
        color,
        description,
      },
      include: {
        // @ts-expect-error - A relação 'leads' existe no banco, mas não é reconhecida corretamente pelo TypeScript
        leads: {
          select: {
            id: true
          }
        },
      },
    });
    
    // Formatar para incluir contagem de uso
    const formattedTag = {
      id: updatedTag.id,
      name: updatedTag.name,
      color: updatedTag.color,
      description: updatedTag.description,
      createdAt: updatedTag.createdAt,
      updatedAt: updatedTag.updatedAt,
      // @ts-ignore - O relacionamento 'leads' existe no banco de dados mas não é reconhecido pelo TypeScript
      usageCount: updatedTag.leads?.length || 0,
    };
    
    return NextResponse.json(formattedTag);
  } catch (error) {
    console.error('Erro ao atualizar tag de contato:', error);
    return NextResponse.json({ error: 'Erro ao atualizar tag de contato' }, { status: 500 });
  }
}

// DELETE - Remove uma tag de contato
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'ID da tag é obrigatório' }, { status: 400 });
    }
    
    // Verificar se a tag existe e pertence ao workspace do usuário
    // @ts-ignore - O relacionamento 'leads' existe no banco de dados mas não é reconhecido pelo TypeScript
    const existingTag = await prisma.contactTags.findFirst({
      where: {
        id,
        workspaceId,
      },
      include: {
        // @ts-expect-error - A relação 'leads' existe no banco, mas não é reconhecida corretamente pelo TypeScript
        leads: true
      }
    });
    
    if (!existingTag) {
      return NextResponse.json({ error: 'Tag não encontrada' }, { status: 404 });
    }
    
    // Verificar se a tag está em uso
    // @ts-ignore - O relacionamento 'leads' existe no banco de dados mas não é reconhecido pelo TypeScript
    if (existingTag.leads && existingTag.leads.length > 0) {
      // Opção 1: Retornar erro se a tag estiver em uso
      // return NextResponse.json({ 
      //   error: 'Tag está em uso por contatos', 
      //   count: existingTag.leads.length 
      // }, { status: 409 });
      
      // Opção 2: Desconectar a tag de todos os contatos antes de excluir
      // @ts-ignore - O relacionamento 'leads' existe no banco de dados mas não é reconhecido pelo TypeScript
      await prisma.contactTags.update({
        where: { id },
        data: {
          // @ts-expect-error - A relação 'leads' existe no banco, mas não é reconhecida corretamente pelo TypeScript
          leads: {
            set: [] // Desconecta todos os leads desta tag
          }
        }
      });
    }
    
    // Remover a tag
    await prisma.contactTags.delete({
      where: { id },
    });
    
    return NextResponse.json({ 
      success: true,
      deleted: {
        id,
        name: existingTag.name
      },
      // @ts-ignore - O relacionamento 'leads' existe no banco de dados mas não é reconhecido pelo TypeScript
      usageCount: existingTag.leads?.length || 0
    });
  } catch (error) {
    console.error('Erro ao excluir tag de contato:', error);
    return NextResponse.json({ error: 'Erro ao excluir tag de contato' }, { status: 500 });
  }
} 
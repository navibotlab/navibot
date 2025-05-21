import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';
import crypto from 'crypto';

// Schema de validação para criação e atualização de tags
const tagSchema = z.object({
  name: z.string().min(1, { message: 'Nome é obrigatório' }),
  color: z.string().min(1, { message: 'Cor é obrigatória' }),
  description: z.string().optional(),
});

// GET - Lista todas as tags de contato do workspace atual
// Ou apenas as tags associadas a um lead específico
export async function GET(req: NextRequest) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    
    // Verificar se foi solicitado filtro por leadId
    const url = new URL(req.url);
    const leadId = url.searchParams.get('leadId');
    
    if (leadId) {
      // Buscar apenas as tags vinculadas ao lead específico
      console.log(`Buscando tags para o lead: ${leadId}`);
      
      // Consulta para buscar as tags associadas a um lead específico
      const leadTags = await prisma.$queryRaw`
        SELECT ct.* 
        FROM contact_tags ct
        JOIN leads_tags lt ON ct.id = lt."tagId"
        WHERE lt."leadId" = ${leadId}
        AND ct."workspaceId" = ${workspaceId}
        ORDER BY ct.name ASC
      `;
      
      // Formatar as tags para o cliente
      // @ts-ignore - Dados vem como objeto plano do queryRaw
      const formattedLeadTags = leadTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        description: tag.description,
        createdAt: tag.created_at,
        updatedAt: tag.updated_at,
      }));
      
      console.log(`Encontradas ${formattedLeadTags.length} tags para o lead ${leadId}`);
      return NextResponse.json(formattedLeadTags);
    }
    
    // Caso não tenha leadId, buscar todas as tags do workspace com contagem de uso
    // @ts-ignore - O relacionamento 'leads' existe no banco de dados mas não é reconhecido pelo TypeScript
    const contactTags = await prisma.contact_tags.findMany({
      where: {
        workspaceId,
      },
      include: {
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
    
    // Formatar para incluir contagem de uso
    const formattedTags = contactTags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      createdAt: tag.created_at,
      updatedAt: tag.updated_at,
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
    const { workspaceId } = await getWorkspaceFromContext();
    const body = await req.json();
    
    // Validar os dados recebidos
    const validatedData = tagSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json({ error: validatedData.error.format() }, { status: 400 });
    }
    
    const { name, color, description } = validatedData.data;
    
    // Verificar se já existe uma tag com o mesmo nome no workspace
    const existingTag = await prisma.contact_tags.findFirst({
      where: {
        name,
        workspaceId,
      },
    });
    
    if (existingTag) {
      return NextResponse.json({ error: 'Já existe uma tag com este nome' }, { status: 409 });
    }
    
    // Criar a nova tag
    const newTag = await prisma.contact_tags.create({
      data: {
        id: crypto.randomUUID(),
        name,
        color,
        description,
        workspaceId,
        updated_at: new Date(),
      },
    });
    
    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar tag de contato:', error);
    return NextResponse.json({ error: 'Erro ao criar tag de contato' }, { status: 500 });
  }
} 
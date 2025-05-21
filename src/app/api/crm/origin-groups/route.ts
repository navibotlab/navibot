import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkPermission } from '@/lib/permissions';

// Schema de validação para criação/atualização de grupos de origem
const originGroupSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres' }),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { 
    message: 'A cor deve estar no formato hexadecimal #RRGGBB' 
  }).optional(),
  order: z.number().int().min(0).optional(),
  icon: z.string().optional()
});

/**
 * GET /api/crm/origin-groups
 * Retorna todos os grupos de origem do workspace atual
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const user = await (prisma as any).users.findUnique({
      where: { id: session.user.id },
      select: { 
        workspaceId: true,
        role: true,
        permissions: true,
        permission_groups: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Verificar permissão
    const hasPermission = 
      user.role === 'admin' || 
      user.role === 'owner' || 
      checkPermission(user.permissions as Record<string, any>, 'crm.origin_groups.view');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para visualizar grupos de origem' }, { status: 403 });
    }
    
    // Obter parâmetros da query
    const url = new URL(request.url);
    const includeLeadCount = url.searchParams.get('includeLeadCount') === 'true';
    
    // Buscar grupos de origem do workspace
    let originGroups = await (prisma as any).origin_groups.findMany({
      where: {
        workspaceId: user.workspaceId
      },
      orderBy: {
        order: 'asc'
      }
    });
    
    // Se solicitado, incluir contagem de leads para cada grupo
    if (includeLeadCount) {
      const originCounts = await prisma.$queryRaw<{ id: string, count: BigInt }[]>`
        SELECT "originGroupId" as id, COUNT(*) as count 
        FROM leads 
        WHERE "workspaceId" = ${user.workspaceId} AND "originGroupId" IS NOT NULL 
        GROUP BY "originGroupId"
      `;
      
      originGroups = originGroups.map((group: any) => {
        const countObj = originCounts.find(oc => oc.id === group.id);
        return {
          ...group,
          leadCount: countObj ? Number(countObj.count) : 0
        };
      });
    }
    
    return NextResponse.json({ data: originGroups });
  } catch (error) {
    console.error('Erro ao buscar grupos de origem:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar grupos de origem' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crm/origin-groups
 * Cria um novo grupo de origem no workspace atual
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const user = await (prisma as any).users.findUnique({
      where: { id: session.user.id },
      select: { 
        workspaceId: true,
        role: true,
        permissions: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Verificar permissão
    const hasPermission = 
      user.role === 'admin' || 
      user.role === 'owner' || 
      checkPermission(user.permissions as Record<string, any>, 'crm.origin_groups.create');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para criar grupos de origem' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Log dos dados recebidos para diagnóstico
    console.log('Dados recebidos para criação do grupo:', body);
    
    // Validar dados
    const validation = originGroupSchema.safeParse(body);
    if (!validation.success) {
      console.log('Erro de validação:', validation.error.format());
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.format() 
      }, { status: 400 });
    }
    
    const { name, description, color, order, icon } = validation.data;
    
    // Verificar se já existe um grupo com o mesmo nome
    const existingGroup = await (prisma as any).origin_groups.findFirst({
      where: {
        name,
        workspaceId: user.workspaceId
      }
    });
    
    if (existingGroup) {
      return NextResponse.json({ 
        error: 'Já existe um grupo de origem com este nome' 
      }, { status: 409 });
    }
    
    // Determinar a ordem do novo grupo, se não fornecida
    let groupOrder = order;
    if (groupOrder === undefined) {
      const lastGroup = await (prisma as any).origin_groups.findFirst({
        where: { workspaceId: user.workspaceId },
        orderBy: { order: 'desc' }
      });
      
      groupOrder = lastGroup ? lastGroup.order + 1 : 0;
    }
    
    // Criar o novo grupo
    try {
      const newGroup = await (prisma as any).origin_groups.create({
        data: {
          id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // UUID gerado para o id
          name,
          description,
          color: color || '#9333EA', // Cor padrão se não fornecida
          icon: icon || 'user', // Ícone padrão se não fornecido
          order: groupOrder,
          workspaceId: user.workspaceId,
          updatedAt: new Date() // Adicionar campo updatedAt
        }
      });
      
      console.log('Grupo criado com sucesso:', newGroup);
      return NextResponse.json(newGroup, { status: 201 });
    } catch (dbError) {
      console.error('Erro no banco de dados ao criar grupo:', dbError);
      return NextResponse.json(
        { error: `Erro ao criar grupo no banco de dados: ${dbError instanceof Error ? dbError.message : 'Erro desconhecido'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao criar grupo de origem:', error);
    return NextResponse.json(
      { error: 'Erro ao criar grupo de origem', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/crm/origin-groups/reorder
 * Reordena os grupos de origem
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const user = await (prisma as any).users.findUnique({
      where: { id: session.user.id },
      select: { 
        workspaceId: true,
        role: true,
        permissions: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Verificar permissão
    const hasPermission = 
      user.role === 'admin' || 
      user.role === 'owner' || 
      checkPermission(user.permissions as Record<string, any>, 'crm.origin_groups.update');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para atualizar grupos de origem' }, { status: 403 });
    }
    
    const url = new URL(request.url);
    
    // Verificar se é uma operação de reordenação
    const isReorder = url.pathname.endsWith('/reorder');
    
    if (isReorder) {
      const body = await request.json();
      
      if (!Array.isArray(body.orders) || body.orders.length === 0) {
        return NextResponse.json({ 
          error: 'Dados inválidos. Esperado um array de orders'
        }, { status: 400 });
      }
      
      // Validar estrutura dos dados
      for (const item of body.orders) {
        if (!item.id || typeof item.order !== 'number') {
          return NextResponse.json({ 
            error: 'Cada item deve ter id e order'
          }, { status: 400 });
        }
      }
      
      // Reordenar grupos
      const results = await Promise.all(
        body.orders.map((item: { id: string, order: number }) => 
          (prisma as any).origin_groups.update({
            where: { 
              id: item.id,
              workspaceId: user.workspaceId // Garantir que o grupo pertence ao workspace
            },
            data: { order: item.order }
          })
        )
      );
      
      return NextResponse.json(results);
    } else {
      // Para atualizações regulares, precisamos do ID na URL
      const pathParts = url.pathname.split('/');
      const groupId = pathParts[pathParts.length - 1];
      
      if (!groupId) {
        return NextResponse.json({ 
          error: 'ID do grupo não fornecido'
        }, { status: 400 });
      }
      
      const body = await request.json();
      
      // Validar dados
      const validation = originGroupSchema.partial().safeParse(body);
      if (!validation.success) {
        return NextResponse.json({ 
          error: 'Dados inválidos', 
          details: validation.error.format() 
        }, { status: 400 });
      }
      
      // Verificar se o grupo existe e pertence ao workspace
      const existingGroup = await (prisma as any).origin_groups.findFirst({
        where: {
          id: groupId,
          workspaceId: user.workspaceId
        }
      });
      
      if (!existingGroup) {
        return NextResponse.json({ error: 'Grupo de origem não encontrado' }, { status: 404 });
      }
      
      // Se o nome for alterado, verificar se não conflita com outro grupo
      if (body.name && body.name !== existingGroup.name) {
        const nameConflict = await (prisma as any).origin_groups.findFirst({
          where: {
            name: body.name,
            workspaceId: user.workspaceId,
            id: { not: groupId }
          }
        });
        
        if (nameConflict) {
          return NextResponse.json({ 
            error: 'Já existe um grupo de origem com este nome' 
          }, { status: 409 });
        }
      }
      
      // Atualizar o grupo
      const updatedGroup = await (prisma as any).origin_groups.update({
        where: { id: groupId },
        data: validation.data
      });
      
      return NextResponse.json(updatedGroup);
    }
  } catch (error) {
    console.error('Erro ao atualizar grupo de origem:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar grupo de origem' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crm/origin-groups/:id
 * Remove um grupo de origem existente, com opção de mover leads para outro grupo
 * NOTA: Implementação movida para [id]/route.ts para seguir os padrões do Next.js
 */
/* 
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const user = await (prisma as any).users.findUnique({
      where: { id: session.user.id },
      select: { 
        workspaceId: true,
        role: true,
        permissions: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Verificar permissão
    const hasPermission = 
      user.role === 'admin' || 
      user.role === 'owner' || 
      checkPermission(user.permissions as Record<string, any>, 'crm.origin_groups.delete');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para remover grupos de origem' }, { status: 403 });
    }
    
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const groupId = pathParts[pathParts.length - 1];
    
    if (!groupId) {
      return NextResponse.json({ 
        error: 'ID do grupo não fornecido'
      }, { status: 400 });
    }
    
    // Verificar se o grupo existe e pertence ao workspace
    const existingGroup = await (prisma as any).origin_groups.findFirst({
      where: {
        id: groupId,
        workspaceId: user.workspaceId
      }
    });
    
    if (!existingGroup) {
      return NextResponse.json({ error: 'Grupo de origem não encontrado' }, { status: 404 });
    }
    
    // Verificar se existem leads neste grupo
    const leadsCount = await (prisma as any).lead.count({
      where: {
        originGroupId: groupId,
        workspaceId: user.workspaceId
      }
    });
    
    if (leadsCount > 0) {
      // Se existem leads, verificar se foi fornecido um grupo destino
      const moveLeadsTo = url.searchParams.get('moveLeadsTo');
      
      if (!moveLeadsTo) {
        return NextResponse.json({ 
          error: 'Este grupo contém leads. Forneça o parâmetro moveLeadsTo para movê-los para outro grupo'
        }, { status: 409 });
      }
      
      // Verificar se o grupo destino existe
      const targetGroup = await (prisma as any).origin_groups.findFirst({
        where: {
          id: moveLeadsTo,
          workspaceId: user.workspaceId
        }
      });
      
      if (!targetGroup) {
        return NextResponse.json({ 
          error: 'Grupo de origem destino não encontrado'
        }, { status: 404 });
      }
      
      // Mover leads para o grupo destino
      await (prisma as any).lead.updateMany({
        where: {
          originGroupId: groupId,
          workspaceId: user.workspaceId
        },
        data: {
          originGroupId: moveLeadsTo
        }
      });
    }
    
    // Remover o grupo
    await (prisma as any).origin_groups.delete({
      where: { id: groupId }
    });
    
    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error) {
    console.error('Erro ao remover grupo de origem:', error);
    return NextResponse.json(
      { error: 'Erro ao remover grupo de origem' },
      { status: 500 }
    );
  }
}
*/ 
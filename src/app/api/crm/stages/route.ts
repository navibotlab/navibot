import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkPermission } from '@/lib/permissions';

// Schema de validação para criação/atualização de estágios
const stageSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres' }),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { 
    message: 'A cor deve estar no formato hexadecimal #RRGGBB' 
  }).optional(),
  order: z.number().int().min(0).optional()
});

/**
 * GET /api/crm/stages
 * Retorna todos os estágios do workspace atual
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
      checkPermission(user.permissions as Record<string, any>, 'crm.stages.view');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para visualizar estágios' }, { status: 403 });
    }
    
    // Obter parâmetros da query
    const url = new URL(request.url);
    const includeLeadCount = url.searchParams.get('includeLeadCount') === 'true';
    const includeCounts = url.searchParams.get('includeCounts') === 'true';
    const includeLeads = url.searchParams.get('includeLeads') === 'true';
    const originId = url.searchParams.get('originId');
    
    console.log('API Stages: Parâmetros da requisição:', { 
      includeLeadCount, 
      includeCounts, 
      includeLeads, 
      originId,
      workspaceId: user.workspaceId
    });
    
    // Preparar a condição where
    const whereCondition: any = {
      workspaceId: user.workspaceId
    };

    // Se originId foi fornecido, buscar estágios relacionados à origem
    let stages = [];
    if (originId) {
      console.log('API Stages: Buscando estágios para a origem:', originId);
      console.log('API Stages: Workspace atual:', user.workspaceId);
      
      // Primeiro verificar se a origem existe e tem um estágio padrão
      const origin = await (prisma as any).origins.findFirst({
        where: {
          id: originId,
          workspaceId: user.workspaceId
        }
      });
      
      if (origin) {
        console.log(`API Stages: Origem encontrada: ${origin.id} ${origin.name}`);
        
        // Verificar se a origem tem um campo "stages" populado (relação já carregada)
        if (origin.stages && Array.isArray(origin.stages) && origin.stages.length > 0) {
          console.log(`API Stages: Origem já tem ${origin.stages.length} estágios relacionados diretamente`);
          stages = origin.stages;
        } else {
          // Buscar a origem novamente com os estágios relacionados incluídos explicitamente
          try {
            console.log(`API Stages: Buscando origem com estágios relacionados incluídos explicitamente`);
            
            // Não inclua _count que está causando erro
            const originWithStages = await (prisma as any).origins.findUnique({
              where: { id: originId },
              include: { 
                stages: true
              }
            });
            
            // Log para diagnóstico completo
            console.log(`API Stages: Origem ${originId} carregada com seus estágios relacionados`);
            
            if (originWithStages?.stages && Array.isArray(originWithStages.stages) && originWithStages.stages.length > 0) {
              console.log(`API Stages: Encontrados ${originWithStages.stages.length} estágios relacionados diretamente`);
              console.log(`API Stages: IDs dos estágios encontrados: ${originWithStages.stages.map((s: { id: string }) => s.id).join(', ')}`);
              stages = originWithStages.stages;
            } else {
              // Verificar a estrutura da tabela no banco para entender a relação
              console.log(`API Stages: Verificando a estrutura da relação no banco de dados`);
              
              try {
                // Verificar se existe um modelo chamado _OriginToStage ou similar
                const relationTables = await prisma.$queryRaw<Array<{tablename: string}>>`
                  SELECT tablename FROM pg_tables 
                  WHERE tablename LIKE '%origin%stage%' OR tablename LIKE '%stage%origin%'
                `;
                
                console.log('Tabelas de relação encontradas:', relationTables);
                
                if (relationTables && relationTables.length > 0) {
                  console.log(`Tabelas de relação encontradas: ${relationTables.map(t => t.tablename).join(', ')}`);
                }
              } catch (tableError) {
                console.log('Erro ao consultar tabelas de relação:', tableError);
              }
              
              // Verificar primeiro se existe um campo originId na tabela stages
              try {
                const stageSchema = await prisma.$queryRaw<Array<{column_name: string; data_type: string}>>`
                  SELECT column_name, data_type
                  FROM information_schema.columns
                  WHERE table_name = 'stages'
                  AND column_name LIKE '%origin%'
                `;
                
                console.log('API Stages: Esquema da tabela stages:', stageSchema);
                
                // Se encontrar uma coluna originId, usar esse campo para buscar
                const originIdColumn = stageSchema.find((col) => 
                  col.column_name.toLowerCase().includes('origin') && 
                  col.column_name.toLowerCase() !== 'origins'
                );
                
                if (originIdColumn) {
                  console.log(`API Stages: Encontrada coluna ${originIdColumn.column_name} na tabela stages, buscando estágios diretamente`);
                  
                  // Criar condição dinâmica baseada no nome da coluna
                  const columnName = originIdColumn.column_name;
                  const whereCondition: any = {
                    workspaceId: user.workspaceId
                  };
                  whereCondition[columnName] = originId;
                  
                  stages = await (prisma as any).stages.findMany({
                    where: whereCondition,
                    orderBy: { order: 'asc' }
                  });
                  
                  console.log(`API Stages: Encontrados ${stages.length} estágios pelo relacionamento direto na coluna ${columnName}`);
                } else {
                  // Se não encontrar coluna de relação direta, usar o ID como padrão
                  stages = await (prisma as any).stages.findMany({
                    where: {
                      workspaceId: user.workspaceId,
                      id: {
                        contains: originId.substring(0, 8)
                      }
                    },
                    orderBy: { order: 'asc' }
                  });
                  
                  console.log(`API Stages: Encontrados ${stages.length} estágios pelo prefixo comum no ID`);
                }
              } catch (schemaError) {
                console.error('API Stages: Erro ao verificar esquema da tabela stages:', schemaError);
                
                // Fallback para busca apenas pelo prefixo no ID
                stages = await (prisma as any).stages.findMany({
                  where: {
                    workspaceId: user.workspaceId,
                    id: {
                      contains: originId.substring(0, 8)
                    }
                  },
                  orderBy: { order: 'asc' }
                });
                
                console.log(`API Stages: Encontrados ${stages.length} estágios pelo prefixo comum no ID`);
              }
            }
          } catch (error) {
            console.error('API Stages: Erro ao buscar origem com estágios:', error);
            
            // Fallback para busca por relacionamento com o estágio padrão
            if (origin.defaultStageId) {
              console.log(`API Stages: Usando estágio padrão como fallback: ${origin.defaultStageId}`);
              
              // Buscar estágios relacionados ao estágio padrão (provavelmente criados juntos)
              const defaultStage = await (prisma as any).stages.findUnique({
                where: { id: origin.defaultStageId }
              });
              
              if (defaultStage) {
                const createdAt = defaultStage.createdAt;
                const timeWindow = 5 * 60 * 1000; // 5 minutos
                
                stages = await (prisma as any).stages.findMany({
                  where: {
                    workspaceId: user.workspaceId,
                    createdAt: {
                      gte: new Date(new Date(createdAt).getTime() - timeWindow),
                      lte: new Date(new Date(createdAt).getTime() + timeWindow)
                    }
                  },
                  orderBy: { order: 'asc' }
                });
                
                console.log(`API Stages: Encontrados ${stages.length} estágios por janela de tempo`);
              }
            }
          }
        }
        
        // ALTERAÇÃO IMPORTANTE: Se includeLeads for true, buscar negócios para os estágios
        // em vez de buscar leads. Esta abordagem prioriza negócios ativos.
        if (includeLeads) {
          console.log('API Stages: Buscando negócios ativos para cada estágio');
          
          // Para cada estágio, buscar negócios ativos relacionados à origem
          for (const stage of stages) {
            const businessList = await (prisma as any).business.findMany({
              where: {
                stageId: stage.id,
                originId: originId,
                workspaceId: user.workspaceId
              },
              include: {
                lead: {
                  include: {
                    tags: true
                  }
                }
              }
            });
            
            console.log(`API Stages: Encontrados ${businessList.length} negócios para o estágio ${stage.name} (${stage.id})`);
            
            // Adicionamos a lista de negócios ao estágio
            stage.business = businessList;
          }
        }
      } else {
        // Se a origem não foi encontrada, retornar um array vazio
        console.warn('API Stages: Origem não encontrada:', originId);
        return NextResponse.json({ 
          error: `Origem com ID ${originId} não encontrada ou não pertence ao workspace atual`, 
          stages: [] 
        }, { status: 404 });
      }
    } else {
      // Buscar todos os estágios do workspace
      console.log('API Stages: originId não fornecido, buscando todos os estágios do workspace');
      stages = await (prisma as any).stages.findMany({
        where: whereCondition,
        orderBy: {
          order: 'asc'
        }
      });
      
      // Se includeLeads for true, buscar todos os negócios para cada estágio
      if (includeLeads) {
        for (const stage of stages) {
          const businessList = await (prisma as any).business.findMany({
            where: {
              stageId: stage.id,
              workspaceId: user.workspaceId
            },
            include: {
              lead: {
                include: {
                  tags: true
                }
              }
            }
          });
          
          console.log(`API Stages: Encontrados ${businessList.length} negócios para o estágio ${stage.name} (${stage.id})`);
          
          // Adicionamos a lista de negócios ao estágio
          stage.business = businessList;
        }
      }
    }
    
    console.log(`API Stages: Encontrados ${stages.length} estágios`);
    
    // Se solicitado, incluir contagem de leads para cada estágio
    if ((includeLeadCount || includeCounts) && !includeLeads) {
      const stageCounts = await prisma.$queryRaw<{ id: string, count: BigInt }[]>`
        SELECT "stageId" as id, COUNT(*) as count 
        FROM leads 
        WHERE "workspaceId" = ${user.workspaceId} AND "stageId" IS NOT NULL 
        GROUP BY "stageId"
      `;
      
      stages = stages.map((stage: any) => {
        const countObj = stageCounts.find(sc => sc.id === stage.id);
        return {
          ...stage,
          leadCount: countObj ? Number(countObj.count) : 0
        };
      });
    }
    
    // Formatar leads para o formato esperado pelo frontend
    if (includeLeads) {
      // Criar uma versão processada dos estágios com seus leads/negócios
      const processedStages = [];
      
      // Processar cada estágio sequencialmente
      for (const stage of stages) {
        // ALTERAÇÃO: Priorizar a lista de negócios em vez de leads
        // Verificamos se temos a lista de negócios do estágio (adicionada pela consulta acima)
        const businessList = stage.business || [];
        
        // Logs para diagnóstico
        console.log(`API Stages: Processando ${businessList.length} negócios para o estágio ${stage.name} (${stage.id})`);
        
        // Se tivermos negócios, mostrar detalhes dos primeiros
        if (businessList.length > 0) {
          console.log('API Stages: Amostra dos negócios encontrados:');
          businessList.slice(0, 3).forEach((business: any, index: number) => {
            console.log(`Negócio ${index + 1}:`, {
              id: business.id,
              title: business.title,
              leadId: business.leadId
            });
          });
        }
        
        // Para cada negócio, criar um item formatado para o frontend
        const formattedLeads = [];
        
        // Processar cada negócio no estágio
        for (const business of businessList) {
          const lead = business.lead || {}; // Informações do lead associado
          
          // Extrair array de tags com suas informações completas
          const tags = Array.isArray(lead.tags) 
            ? lead.tags.map((tag: any) => ({
                name: tag.name,
                color: tag.color || '#6B7280' // Cor padrão se não tiver
              }))
            : [];
          
          // Criar objeto formatado combinando negócio e lead
          formattedLeads.push({
            id: business.id,           // ID do negócio como ID principal
            businessId: business.id,   // businessId explícito
            leadId: business.leadId,   // ID do lead associado
            title: business.title || lead.name || 'Sem nome',              
            fullName: lead.name || business.title || 'Sem nome',              
            phone: lead.phone || '',              
            photo: lead.photo || null,              
            email: lead.email || '',              
            contact: lead.email || '',              
            value: business.value ? `R$ ${Number(business.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',              
            tags,
            createdAt: business.createdAt,              
            progress: business.probability || 50,              
            originId: business.originId,              
            stageId: stage.id,
            type: 'business',     // Sempre definido como 'business' para clareza
          });
        }
        
        // Adicionar estágio processado
        processedStages.push({
          ...stage,
          leadCount: businessList.length,
          leads: formattedLeads // Mantemos o nome 'leads' para compatibilidade com o frontend
        });
      }
      
      // Atualizar stages com os dados processados
      stages = processedStages;
    }
    
    // Resposta padronizada para o frontend
    // Garantir que a resposta seja { stages: [...] } para compatibilidade com o frontend
    return NextResponse.json({ stages });
  } catch (error) {
    console.error('Erro ao buscar estágios:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estágios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crm/stages
 * Cria um novo estágio no workspace atual
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
      checkPermission(user.permissions as Record<string, any>, 'crm.stages.create');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para criar estágios' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Validar dados
    const validation = stageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.format() 
      }, { status: 400 });
    }
    
    const { name, description, color, order } = validation.data;
    
    // Determinar a ordem do novo estágio, se não fornecida
    let stageOrder = order;
    if (stageOrder === undefined) {
      const lastStage = await (prisma as any).stages.findFirst({
        where: { workspaceId: user.workspaceId },
        orderBy: { order: 'desc' }
      });
      
      stageOrder = lastStage ? lastStage.order + 1 : 0;
    }
    
    // Criar o novo estágio
    const newStage = await (prisma as any).stages.create({
      data: {
        id: `stage_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        name,
        description,
        color,
        order: stageOrder,
        workspaceId: user.workspaceId,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(newStage, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar estágio:', error);
    return NextResponse.json(
      { error: 'Erro ao criar estágio' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/crm/stages/reorder
 * Reordena os estágios do funil
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
      checkPermission(user.permissions as Record<string, any>, 'crm.stages.update');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para atualizar estágios' }, { status: 403 });
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
      
      // Reordenar estágios
      const results = await Promise.all(
        body.orders.map((item: { id: string, order: number }) => 
          (prisma as any).stages.update({
            where: { 
              id: item.id,
              workspaceId: user.workspaceId // Garantir que o estágio pertence ao workspace
            },
            data: { order: item.order }
          })
        )
      );
      
      return NextResponse.json(results);
    } else {
      // Para atualizações regulares, precisamos do ID na URL
      const pathParts = url.pathname.split('/');
      const stageId = pathParts[pathParts.length - 1];
      
      if (!stageId) {
        return NextResponse.json({ 
          error: 'ID do estágio não fornecido'
        }, { status: 400 });
      }
      
      const body = await request.json();
      
      // Validar dados
      const validation = stageSchema.partial().safeParse(body);
      if (!validation.success) {
        return NextResponse.json({ 
          error: 'Dados inválidos', 
          details: validation.error.format() 
        }, { status: 400 });
      }
      
      // Verificar se o estágio existe e pertence ao workspace
      const existingStage = await (prisma as any).stages.findFirst({
        where: {
          id: stageId,
          workspaceId: user.workspaceId
        }
      });
      
      if (!existingStage) {
        return NextResponse.json({ error: 'Estágio não encontrado' }, { status: 404 });
      }
      
      // Se o nome for alterado, verificar se não conflita com outro estágio
      if (body.name && body.name !== existingStage.name) {
        const nameConflict = await (prisma as any).stages.findFirst({
          where: {
            name: body.name,
            workspaceId: user.workspaceId,
            id: { not: stageId }
          }
        });
        
        if (nameConflict) {
          return NextResponse.json({ 
            error: 'Já existe um estágio com este nome' 
          }, { status: 409 });
        }
      }
      
      // Atualizar o estágio
      const updatedStage = await (prisma as any).stages.update({
        where: { id: stageId },
        data: validation.data
      });
      
      return NextResponse.json(updatedStage);
    }
  } catch (error) {
    console.error('Erro ao atualizar estágio:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar estágio' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crm/stages/:id
 * Remove um estágio existente, com opção de mover leads para outro estágio
 */
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
      checkPermission(user.permissions as Record<string, any>, 'crm.stages.delete');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para remover estágios' }, { status: 403 });
    }
    
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const stageId = pathParts[pathParts.length - 1];
    
    if (!stageId) {
      return NextResponse.json({ 
        error: 'ID do estágio não fornecido'
      }, { status: 400 });
    }
    
    // Verificar se o estágio existe e pertence ao workspace
    const existingStage = await (prisma as any).stages.findFirst({
      where: {
        id: stageId,
        workspaceId: user.workspaceId
      }
    });
    
    if (!existingStage) {
      return NextResponse.json({ error: 'Estágio não encontrado' }, { status: 404 });
    }
    
    // Verificar se existem leads neste estágio
    const leadsCount = await (prisma as any).lead.count({
      where: {
        stageId,
        workspaceId: user.workspaceId
      }
    });
    
    if (leadsCount > 0) {
      // Se existem leads, verificar se foi fornecido um estágio destino
      const moveLeadsTo = url.searchParams.get('moveLeadsTo');
      
      if (!moveLeadsTo) {
        return NextResponse.json({ 
          error: 'Este estágio contém leads. Forneça o parâmetro moveLeadsTo para movê-los para outro estágio'
        }, { status: 409 });
      }
      
      // Verificar se o estágio destino existe
      const targetStage = await (prisma as any).stages.findFirst({
        where: {
          id: moveLeadsTo,
          workspaceId: user.workspaceId
        }
      });
      
      if (!targetStage) {
        return NextResponse.json({ 
          error: 'Estágio destino não encontrado'
        }, { status: 404 });
      }
      
      // Mover leads para o estágio destino
      await (prisma as any).lead.updateMany({
        where: {
          stageId,
          workspaceId: user.workspaceId
        },
        data: {
          stageId: moveLeadsTo
        }
      });
    }
    
    // Remover o estágio
    await (prisma as any).stages.delete({
      where: { id: stageId }
    });
    
    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error) {
    console.error('Erro ao remover estágio:', error);
    return NextResponse.json(
      { error: 'Erro ao remover estágio' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/permissions';

/**
 * GET /api/crm/origins/[id]/stages
 * Retorna todos os estágios associados a uma origem específica
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Aguardar resolução do objeto params por completo
    const params = await context.params;
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'ID da origem não fornecido' }, { status: 400 });
    }
    
    // Usar o id diretamente
    const originId = id;

    console.log('API Origin Stages: Buscando estágios para a origem:', originId);

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
    const filterOrigin = url.searchParams.get('filterOrigin') === 'true';
    
    console.log(`API Origin Stages: Parâmetros - includeLeads: ${includeLeads}, filterOrigin: ${filterOrigin}`);
    
    // Verificar se a origem existe e pertence ao workspace do usuário
    const origin = await (prisma as any).origins.findFirst({
      where: {
        id: originId,
        workspaceId: user.workspaceId
      }
    });
    
    if (!origin) {
      return NextResponse.json(
        { error: 'Origem não encontrada ou não pertence ao workspace atual' },
        { status: 404 }
      );
    }
    
    console.log(`API Origin Stages: Origem "${origin.name}" encontrada para o workspace ${user.workspaceId}`);
    
    // Preparar a condição where para estágios
    const whereCondition: any = {
      workspaceId: user.workspaceId
    };
    
    // Buscar todos os estágios do workspace
    const allStages = await (prisma as any).stages.findMany({
      where: whereCondition,
      orderBy: {
        order: 'asc'
      },
      ...(includeLeads ? {
        include: {
          // Incluir negócios em vez de leads
          business: {
            where: {
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
          }
        }
      } : {})
    });
    
    // Verificar se o estágio padrão da origem existe nos resultados
    let stages = [...allStages];
    
    if (origin.defaultStageId) {
      console.log(`API Origin Stages: Origem tem estágio padrão: ${origin.defaultStageId}`);
      
      // Verificar se o estágio padrão já está incluído
      const hasDefaultStage = stages.some((stage: any) => stage.id === origin.defaultStageId);
      
      // Se não estiver incluído, buscá-lo e adicioná-lo ao início da lista
      if (!hasDefaultStage) {
        const defaultStage = await (prisma as any).stage.findUnique({
          where: {
            id: origin.defaultStageId,
          },
          ...(includeLeads ? {
            include: {
              business: {
                where: {
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
              }
            }
          } : {})
        });
        
        if (defaultStage) {
          // Adicionar o estágio padrão no início da lista
          stages = [defaultStage, ...stages.filter((stage: any) => stage.id !== origin.defaultStageId)];
        }
      }
    }
    
    console.log(`API Origin Stages: Encontrados ${stages.length} estágios para o workspace`);
    
    // Verificar se há negócios em algum estágio
    let totalBusinesses = 0;
    stages.forEach((stage: any) => {
      if (stage.business && Array.isArray(stage.business)) {
        totalBusinesses += stage.business.length;
      }
    });
    
    console.log(`API Origin Stages: Total de ${totalBusinesses} negócios encontrados`);
    
    // Adicionar logs detalhados dos negócios encontrados
    if (includeLeads && totalBusinesses > 0) {
      console.log('API Origin Stages: Detalhes dos negócios por estágio:');
      stages.forEach((stage: any) => {
        if (stage.business && Array.isArray(stage.business) && stage.business.length > 0) {
          console.log(`  Estágio "${stage.name}" (${stage.id}): ${stage.business.length} negócios`);
          
          // Mostrar detalhes de até 3 negócios para não sobrecarregar o log
          stage.business.slice(0, 3).forEach((business: any, index: number) => {
            console.log(`    Negócio ${index + 1}:`, {
              id: business.id,
              businessId: business.id, // Explicitamente mostrar o businessId
              leadId: business.leadId,
              title: business.title,
              stageId: business.stageId
            });
          });
        }
      });
    }
    
    // Formatar negócios para o formato esperado pelo frontend
    if (includeLeads) {
      stages = stages.map((stage: any) => {
        // Usar business em vez de leads
        let businessItems = stage.business || [];
        
        // Se filterOrigin estiver ativo, garantir que apenas negócios da origem especificada sejam incluídos
        if (filterOrigin) {
          businessItems = businessItems.filter((business: any) => {
            const businessOriginId = business.originId;
            const isFromOrigin = businessOriginId === originId;
            
            if (!isFromOrigin) {
              console.log(`API Origin Stages: Filtrando negócio ${business.id} com originId ${businessOriginId} diferente de ${originId}`);
            }
            
            return isFromOrigin;
          });
          console.log(`API Origin Stages: ${businessItems.length} negócios após filtrar por origem`);
        }
        
        // Para cada negócio, formatar para o formato esperado pelo frontend
        const formattedBusinesses = businessItems.map((business: any) => {
          // CORREÇÃO CRÍTICA: Validar e usar o ID do negócio correto
          
          // Logs detalhados para debug
          console.log(`API Stages: Formatando negócio:`, {
            negocioId: business.id,
            leadId: business.leadId,
            negocioIdTipo: typeof business.id
          });
          
          // Obter informações do lead associado, se existir
          const lead = business.lead || {};
          
          // Verificar se business.id e business.leadId são idênticos (o que seria um erro)
          const idsSaoIdenticos = business.id && business.leadId && business.id.toString() === business.leadId.toString();
          
          if (idsSaoIdenticos) {
            console.error(`ERRO CRÍTICO: ID do negócio é idêntico ao ID do lead: ${business.id}`);
            // Aqui você deveria usar outra identificação para o business, se disponível
          }
          
          // Extrair array de tags do lead
          const tags = lead.tags && Array.isArray(lead.tags) 
            ? lead.tags.map((tag: any) => ({
                name: tag.name,
                color: tag.color || '#6B7280' // Cor padrão se não tiver
              }))
            : [];
            
          // Garantir que os IDs sejam strings para evitar problemas de tipo
          const safeBusinessId = business.id ? String(business.id) : '';
          const safeLeadId = business.leadId ? String(business.leadId) : '';
          
          // Criar um novo objeto em vez de usar o original (evitar referências circulares)
          return {
            // O campo id é mantido por compatibilidade, mas todos os componentes devem usar businessId
            id: safeBusinessId,
            
            // O campo businessId DEVE ser explicitamente usado para todas as operações de negócio
            businessId: safeBusinessId,
            
            title: business.title || 'Sem nome',
            fullName: lead.name || 'Sem nome',
            contact: lead.email || '',
            phone: lead.phone || '',
            value: business.value ? `R$ ${Number(business.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',
            tags,
            createdAt: business.createdAt ? new Date(business.createdAt).toISOString() : new Date().toISOString(),
            progress: business.probability || 50,
            photo: lead.photo || null,
            originId: business.originId || null,
            stageId: String(stage.id),
            leadId: safeLeadId, // ID do lead associado - mantido separado
            email: lead.email || '',
            name: lead.name || business.title || 'Sem nome'
          };
        });
        
        // Criar um novo objeto de estágio para evitar referências circulares
        return {
          id: stage.id,
          name: stage.name,
          order: stage.order || 0,
          color: stage.color || '#3B82F6',
          leads: formattedBusinesses, // Manter o nome "leads" para compatibilidade com o frontend
          leadCount: formattedBusinesses.length
        };
      });
    }
    
    return NextResponse.json({ 
      stages,
      originId,
      origin: {
        id: origin.id,
        name: origin.name
      },
      totalLeads: totalBusinesses
    }, {
      // Adicionar um serializador personalizado para evitar referências circulares
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar estágios da origem:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estágios da origem' },
      { status: 500 }
    );
  }
} 
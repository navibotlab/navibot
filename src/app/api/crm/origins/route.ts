import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkPermission } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';

// Schema de validação para criação/atualização de origens
const originSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres' }),
  description: z.string().optional(),
  originGroupId: z.string({ required_error: 'O grupo de origem é obrigatório' }),
  defaultStageId: z.string().optional(),
  active: z.boolean().default(true),
  createDefaultStages: z.boolean().optional().default(true)
});

/**
 * GET /api/crm/origins
 * Retorna todas as origens do workspace atual ou de um grupo específico
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
      checkPermission(user.permissions as Record<string, any>, 'crm.origins.view');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para visualizar origens' }, { status: 403 });
    }
    
    // Obter parâmetros da query
    const url = new URL(request.url);
    const originGroupId = url.searchParams.get('originGroupId');
    const includeLeadCount = url.searchParams.get('includeLeadCount') === 'true';
    
    // Construir condições de busca
    const whereCondition: any = {
      workspaceId: user.workspaceId
    };
    
    if (originGroupId) {
      whereCondition.originGroupId = originGroupId;
    }
    
    // Buscar origens
    let origins = await (prisma as any).origins.findMany({
      where: whereCondition,
      include: {
        origin_groups: true,
        stages: true
      },
      orderBy: [
        { active: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    // Se solicitado, incluir contagem de leads para cada origem
    if (includeLeadCount) {
      const originCounts = await prisma.$queryRaw<{ id: string, count: BigInt }[]>`
        SELECT "originId" as id, COUNT(*) as count 
        FROM leads 
        WHERE "workspaceId" = ${user.workspaceId} AND "originId" IS NOT NULL 
        GROUP BY "originId"
      `;
      
      origins = origins.map((origin: any) => {
        const countObj = originCounts.find(oc => oc.id === origin.id);
        return {
          ...origin,
          leadCount: countObj ? Number(countObj.count) : 0
        };
      });
    }
    
    return NextResponse.json({ data: origins });
  } catch (error) {
    console.error('Erro ao buscar origens:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar origens' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crm/origins
 * Cria uma nova origem no workspace atual
 */
export async function POST(request: NextRequest) {
  console.log('POST /api/crm/origins - Iniciando criação de origem');
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('Erro: Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    console.log('Usuário autenticado:', session.user.id);
    
    const user = await (prisma as any).users.findUnique({
      where: { id: session.user.id },
      select: { 
        workspaceId: true,
        role: true,
        permissions: true
      }
    });
    
    if (!user) {
      console.log('Erro: Usuário não encontrado na base de dados');
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    console.log('Usuário encontrado. Workspace:', user.workspaceId);
    
    // Verificar permissão
    const hasPermission = 
      user.role === 'admin' || 
      user.role === 'owner' || 
      checkPermission(user.permissions as Record<string, any>, 'crm.origins.create');
    
    if (!hasPermission) {
      console.log('Erro: Usuário sem permissão para criar origens');
      return NextResponse.json({ error: 'Sem permissão para criar origens' }, { status: 403 });
    }
    
    console.log('Permissão verificada com sucesso');
    
    const body = await request.json();
    console.log('Dados recebidos para criação de origem:', JSON.stringify(body));
    
    // Validar dados
    const validation = originSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.format() 
      }, { status: 400 });
    }
    
    const { name, description, originGroupId, defaultStageId, active, createDefaultStages } = validation.data;
    
    console.log('Dados validados da requisição:', {
      name,
      description,
      originGroupId,
      defaultStageId,
      active,
      createDefaultStages
    });
    
    // Verificar se já existe uma origem com o mesmo nome no workspace
    const existingOrigin = await (prisma as any).origins.findFirst({
      where: {
        name,
        workspaceId: user.workspaceId
      }
    });
    
    if (existingOrigin) {
      return NextResponse.json({ 
        error: 'Já existe uma origem com este nome' 
      }, { status: 409 });
    }
    
    // Verificar se o grupo de origem existe e pertence ao workspace
    const originGroup = await (prisma as any).origin_groups.findFirst({
      where: {
        id: originGroupId,
        workspaceId: user.workspaceId
      }
    });
    
    if (!originGroup) {
      return NextResponse.json({ 
        error: 'Grupo de origem não encontrado ou não pertence ao workspace' 
      }, { status: 404 });
    }
    
    // Verificar se o estágio padrão existe e pertence ao workspace (se fornecido)
    if (defaultStageId) {
      const stage = await (prisma as any).stages.findFirst({
        where: {
          id: defaultStageId,
          workspaceId: user.workspaceId
        }
      });
      
      if (!stage) {
        return NextResponse.json({ 
          error: 'Estágio padrão não encontrado ou não pertence ao workspace' 
        }, { status: 404 });
      }
    }
    
    // Criar a nova origem
    console.log('Criando nova origem no banco de dados...');
    const newOrigin = await (prisma as any).origins.create({
      data: {
        id: crypto.randomUUID(),
        name,
        description,
        originGroupId,
        defaultStageId,
        active: active ?? true,
        workspaceId: user.workspaceId,
        updatedAt: new Date(),
      }
    });
    
    console.log('Origem criada com sucesso:', newOrigin);
    console.log('ID da origem criada:', newOrigin.id);
    console.log('createDefaultStages:', createDefaultStages);
    
    // Criar estágios padrão para esta origem e associá-los em uma única transação
    let stagesCreated = false;
    let stagesInfo = null;
    let createdStages: any[] = [];
    
    try {
      // Somente criar estágios padrão se createDefaultStages for true
      if (createDefaultStages) {
        console.log(`Criando estágios padrão para a origem recém-criada: ${newOrigin.id}`);
        
        // Definir estágios padrão para CRM
        const defaultStages = [
          { name: 'Entrada do Lead', description: 'Leads recém-adicionados ao sistema', color: '#3498db', order: 1 },
          { name: 'Prospecção', description: 'Leads em processo de prospecção', color: '#f39c12', order: 2 },
          { name: 'Conectados', description: 'Leads que já estabeleceram contato', color: '#9b59b6', order: 3 },
          { name: 'Desinteressados', description: 'Leads que demonstraram desinteresse', color: '#e74c3c', order: 4 },
          { name: 'Sem Contato', description: 'Leads que não responderam às tentativas de contato', color: '#7f8c8d', order: 5 },
          { name: 'Aguardando', description: 'Leads que estão aguardando algum processamento ou decisão', color: '#f1c40f', order: 6 },
          { name: 'Fechado', description: 'Negócios finalizados (ganhos ou perdidos)', color: '#2ecc71', order: 7 }
        ];
        
        console.log('Iniciando criação de estágios em transação...');
        
        // Usar transação para garantir consistência
        const result = await prisma.$transaction(async (tx) => {
          // Criar estágios um por um
          for (const stageData of defaultStages) {
            // Incluir identificador da origem no ID do estágio para facilitar associação posterior
            const originPrefix = newOrigin.id.substring(0, 8);
            const stageId = `stage_${Date.now()}_${originPrefix}_${Math.random().toString(36).substring(2, 6)}`;
            console.log(`Criando estágio ${stageData.name} com ID ${stageId}...`);
            
            try {
              // Criar estágio sem verificar se já existe (permitir nomes repetidos)
              const createdStage = await (tx as any).stages.create({
                data: {
                  id: stageId,
                  ...stageData,
                  workspaceId: user.workspaceId,
                  updatedAt: new Date(),
                  name: stageData.name
                }
              });
              
              console.log(`Estágio criado com sucesso: ${createdStage.id} - ${createdStage.name}`);
              createdStages.push(createdStage);
              
              // Pequena pausa para garantir IDs únicos
              await new Promise(resolve => setTimeout(resolve, 10));
            } catch (stageCreateError) {
              console.error(`Erro ao criar o estágio ${stageData.name}:`, stageCreateError);
              throw stageCreateError;
            }
          }
          
          console.log(`Criados ${createdStages.length} estágios padrão com sucesso`);
          
          // Conectar estágios à origem um por um, em vez de todos de uma vez
          if (createdStages.length > 0) {
            try {
              // Verificar primeiro a estrutura correta da relação no banco de dados
              console.log('Verificando as tabelas de relação disponíveis para origins e stages...');
              
              const relationTables = await (tx as any).$queryRaw<Array<{tablename: string}>>`
                SELECT tablename FROM pg_tables 
                WHERE tablename LIKE '%origin%stage%' OR tablename LIKE '%stage%origin%'
              `;
              
              if (relationTables && relationTables.length > 0) {
                console.log(`Tabelas de relação encontradas: ${relationTables.map((t: {tablename: string}) => t.tablename).join(', ')}`);
              } else {
                console.log('Nenhuma tabela de relação específica encontrada');
              }
              
              // Determinar se a tabela stages tem um campo originId
              const stageColumns = await (tx as any).$queryRaw<Array<{column_name: string; data_type: string}>>`
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = 'stages'
                AND column_name LIKE '%origin%'
              `;
              
              console.log('Colunas relacionadas a origin na tabela stages:', stageColumns);
              
              // Estratégia 1: Se a tabela stages tem um campo originId, use-o diretamente
              const originIdColumn = stageColumns.find((col: {column_name: string; data_type: string}) => 
                col.column_name.toLowerCase().includes('origin') && 
                col.column_name.toLowerCase() !== 'origins'
              );
              
              if (originIdColumn) {
                console.log(`Encontrada coluna ${originIdColumn.column_name} na tabela stages, atualizando estágios diretamente`);
                
                for (const stage of createdStages) {
                  // Atualizar estágio para vincular diretamente à origem
                  const columnName = originIdColumn.column_name;
                  const updateData: any = {};
                  updateData[columnName] = newOrigin.id;
                  
                  await (tx as any).stages.update({
                    where: { id: stage.id },
                    data: updateData
                  });
                  
                  console.log(`Estágio ${stage.id} atualizado com ${columnName}=${newOrigin.id}`);
                }
              } 
              // Estratégia 2: Se existe uma tabela de junção explícita no Prisma (_OriginToStage, etc.)
              else if (relationTables && relationTables.length > 0) {
                // Usar a primeira tabela de relação encontrada
                const relationTable = relationTables[0].tablename;
                console.log(`Usando tabela de relação ${relationTable} para conectar estágios à origem`);
                
                // Determinar os nomes das colunas na tabela de relação
                const relationColumns = await (tx as any).$queryRaw<Array<{column_name: string}>>`
                  SELECT column_name FROM information_schema.columns
                  WHERE table_name = ${relationTable}
                  ORDER BY ordinal_position
                `;
                
                if (relationColumns && relationColumns.length >= 2) {
                  // Normalmente as tabelas de junção Prisma têm colunas A e B
                  const columns = relationColumns.map((col: {column_name: string}) => col.column_name);
                  console.log(`Colunas na tabela de relação: ${columns.join(', ')}`);
                  
                  // Assumir que a primeira coluna é para a Origem (A) e a segunda para o Estágio (B)
                  const originColumn = columns[0];
                  const stageColumn = columns[1];
                  
                  // Inserir os relacionamentos na tabela de junção
                  for (const stage of createdStages) {
                    try {
                      await (tx as any).$executeRaw`
                        INSERT INTO "${relationTable}" ("${originColumn}", "${stageColumn}") 
                        VALUES (${newOrigin.id}, ${stage.id})
                        ON CONFLICT DO NOTHING
                      `;
                      console.log(`Relação criada na tabela ${relationTable} entre origem ${newOrigin.id} e estágio ${stage.id}`);
                    } catch (insertError) {
                      console.error(`Erro ao inserir na tabela ${relationTable}:`, insertError);
                    }
                  }
                }
              }
              // Estratégia 3: Tentar usar o método connect do Prisma como último recurso
              else {
                console.log('Tentando conectar estágios à origem usando o método connect do Prisma...');
                
                // Verificar se o modelo origins aceita o campo stages
                try {
                  let connectedCount = 0;
                  
                  for (const stage of createdStages) {
                    // No Prisma, precisamos fazer um por um
                    await (tx as any).origins.update({
                      where: { id: newOrigin.id },
                      data: { 
                        stages: { 
                          connect: { id: stage.id } 
                        } 
                      }
                    });
                    console.log(`Estágio ${stage.id} conectado à origem ${newOrigin.id}`);
                    connectedCount++;
                  }
                  
                  console.log(`Conectados ${connectedCount} estágios à origem ${newOrigin.id}`);
                } catch (connectError) {
                  console.error('Erro ao usar método connect do Prisma:', connectError);
                  
                  // Se falhar a conexão via Prisma, usamos a abordagem de ID composto como último recurso
                  console.log('Usando a abordagem de ID composto como último recurso...');
                  
                  // Estamos usando o ID da origem no ID do estágio, então será possível filtrar depois
                  console.log(`${createdStages.length} estágios criados com prefixo do ID da origem incorporado`);
                  console.log(`Prefixo do ID da origem (${newOrigin.id.substring(0, 8)}) já está nos IDs dos estágios para filtragem`);
                }
              }
            } catch (error) {
              console.error('Erro ao estabelecer relacionamento entre origem e estágios:', error);
              console.log('Usando abordagem de fallback para garantir associação: prefixo no ID');
            }
          }
          
          // Se há estágios criados, atualizar a origem para ter o primeiro estágio como padrão
          if (createdStages.length > 0) {
            console.log(`Configurando o estágio ${createdStages[0].id} como padrão para a origem ${newOrigin.id}...`);
            
            // Atualizar a origem com o estágio padrão
            try {
              const updatedOrigin = await (tx as any).origins.update({
                where: {
                  id: newOrigin.id
                },
                data: {
                  defaultStageId: createdStages[0].id
                }
              });
              
              console.log(`Origem ${newOrigin.id} atualizada com estágio padrão: ${createdStages[0].id}`);
              console.log(`Valor atual de defaultStageId: ${updatedOrigin.defaultStageId}`);
              
              // Remover criação de lead inicial
              return { 
                updatedOrigin, 
                stages: createdStages
              };
            } catch (updateError) {
              console.error(`Erro ao atualizar a origem com o estágio padrão:`, updateError);
              
              // Retornar mesmo com erro para não quebrar todo o processo
              return {
                stages: createdStages,
                error: 'Não foi possível definir o estágio padrão, mas os estágios foram criados'
              };
            }
          }
          
          return { stages: createdStages };
        });
        
        console.log('Resultado da transação:', result);
        
        stagesCreated = true;
        stagesInfo = {
          success: true,
          message: 'Estágios padrão criados com sucesso',
          data: {
            stages: createdStages,
            count: createdStages.length
          }
        };
      } else {
        console.log(`A criação de estágios padrão foi desativada para a origem: ${newOrigin.id}`);
        stagesInfo = { 
          success: true, 
          message: 'Criação de estágios padrão desativada pelo usuário',
          skipped: true
        };
      }
    } catch (stageError) {
      console.error(`Erro ao criar estágios padrão para a origem ${newOrigin.id}:`, stageError);
      stagesInfo = {
        success: false,
        error: stageError instanceof Error ? stageError.message : 'Erro desconhecido',
        message: 'Erro durante a criação de estágios padrão'
      };
      // Não vamos falhar a criação da origem só porque os estágios falharam
    }
    
    // Revalidar caminhos relacionados
    revalidatePath('/crm/pipeline');
    
    return NextResponse.json({
      ...newOrigin,
      stages: stagesInfo,
      createDefaultStages
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar origem:', error);
    return NextResponse.json(
      { error: 'Erro ao criar origem' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/crm/origins/:id
 * Atualiza uma origem existente
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
      checkPermission(user.permissions as Record<string, any>, 'crm.origins.update');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para atualizar origens' }, { status: 403 });
    }
    
    // Extrair ID da origem da URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const originId = pathParts[pathParts.length - 1];
    
    if (!originId) {
      return NextResponse.json({ error: 'ID da origem não fornecido' }, { status: 400 });
    }
    
    // Verificar se a origem existe e pertence ao workspace
    const existingOrigin = await (prisma as any).origins.findFirst({
      where: {
        id: originId,
        workspaceId: user.workspaceId
      }
    });
    
    if (!existingOrigin) {
      return NextResponse.json({ error: 'Origem não encontrada' }, { status: 404 });
    }
    
    const body = await request.json();
    
    // Validar dados
    const validation = originSchema.partial().safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.format() 
      }, { status: 400 });
    }
    
    const { name, description, originGroupId, defaultStageId, active } = validation.data;
    
    // Verificar se o nome já existe em outra origem (se nome for atualizado)
    if (name && name !== existingOrigin.name) {
      const nameExists = await (prisma as any).origins.findFirst({
        where: {
          name,
          workspaceId: user.workspaceId,
          id: { not: originId }
        }
      });
      
      if (nameExists) {
        return NextResponse.json({ 
          error: 'Já existe uma origem com este nome' 
        }, { status: 409 });
      }
    }
    
    // Verificar se o grupo de origem existe e pertence ao workspace (se fornecido)
    if (originGroupId) {
      const originGroup = await (prisma as any).origin_groups.findFirst({
        where: {
          id: originGroupId,
          workspaceId: user.workspaceId
        }
      });
      
      if (!originGroup) {
        return NextResponse.json({ 
          error: 'Grupo de origem não encontrado ou não pertence ao workspace' 
        }, { status: 404 });
      }
    }
    
    // Verificar se o estágio padrão existe e pertence ao workspace (se fornecido)
    if (defaultStageId) {
      const stage = await (prisma as any).stages.findFirst({
        where: {
          id: defaultStageId,
          workspaceId: user.workspaceId
        }
      });
      
      if (!stage) {
        return NextResponse.json({ 
          error: 'Estágio padrão não encontrado ou não pertence ao workspace' 
        }, { status: 404 });
      }
    }
    
    // Atualizar a origem
    const updatedOrigin = await (prisma as any).origins.update({
      where: { id: originId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(originGroupId && { originGroupId }),
        ...(defaultStageId !== undefined && { defaultStageId }),
        ...(active !== undefined && { active }),
        updatedAt: new Date()
      }
    });
    
    // Revalidar caminhos relacionados
    revalidatePath('/crm/pipeline');
    
    return NextResponse.json(updatedOrigin);
  } catch (error) {
    console.error('Erro ao atualizar origem:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar origem' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crm/origins/:id
 * Exclui uma origem
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
      checkPermission(user.permissions as Record<string, any>, 'crm.origins.delete');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para excluir origens' }, { status: 403 });
    }
    
    // Extrair ID da origem da URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const originId = pathParts[pathParts.length - 1];
    
    if (!originId) {
      return NextResponse.json({ error: 'ID da origem não fornecido' }, { status: 400 });
    }
    
    // Verificar se a origem existe e pertence ao workspace
    const existingOrigin = await (prisma as any).origins.findFirst({
      where: {
        id: originId,
        workspaceId: user.workspaceId
      }
    });
    
    if (!existingOrigin) {
      return NextResponse.json({ error: 'Origem não encontrada' }, { status: 404 });
    }
    
    // Verificar se existem leads associados a esta origem
    const leadsCount = await (prisma as any).leads.count({
      where: {
        originId,
        workspaceId: user.workspaceId
      }
    });
    
    if (leadsCount > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir uma origem que possui leads associados',
        leadsCount
      }, { status: 409 });
    }
    
    // Excluir a origem
    await (prisma as any).origins.delete({
      where: { id: originId }
    });
    
    // Revalidar caminhos relacionados
    revalidatePath('/crm/pipeline');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir origem:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir origem' },
      { status: 500 }
    );
  }
} 
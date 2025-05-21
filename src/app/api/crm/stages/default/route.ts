import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';
import { checkPermission } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

// Definição dos estágios padrão
const DEFAULT_STAGES = [
  {
    name: 'Entrada do Lead',
    description: 'Leads recém-adicionados ao sistema',
    color: '#3498db',
    order: 1
  },
  {
    name: 'Prospecção',
    description: 'Leads em processo de prospecção',
    color: '#f39c12',
    order: 2
  },
  {
    name: 'Conectados',
    description: 'Leads que já estabeleceram contato',
    color: '#9b59b6',
    order: 3
  },
  {
    name: 'Desinteressados',
    description: 'Leads que demonstraram desinteresse',
    color: '#e74c3c',
    order: 4
  },
  {
    name: 'Sem Contato',
    description: 'Leads que não responderam às tentativas de contato',
    color: '#7f8c8d',
    order: 5
  },
  {
    name: 'Aguardando',
    description: 'Leads que estão aguardando algum processamento ou decisão',
    color: '#f1c40f',
    order: 6
  },
  {
    name: 'Fechado',
    description: 'Negócios finalizados (ganhos ou perdidos)',
    color: '#2ecc71',
    order: 7
  }
];

/**
 * POST /api/crm/stages/default
 * Cria os estágios padrão para o workspace atual, se ainda não existirem
 */
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/crm/stages/default - Iniciando criação de estágios padrão');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('Erro: Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { workspaceId } = await getWorkspaceFromContext();
    
    if (!workspaceId) {
      console.log('Erro: Workspace não encontrado');
      return NextResponse.json({ error: 'Workspace não encontrado' }, { status: 404 });
    }
    
    console.log('Workspace identificado:', workspaceId);
    
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { 
        role: true,
        permissions: true
      }
    });
    
    if (!user) {
      console.log('Erro: Usuário não encontrado na base de dados');
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Verificar permissão
    const hasPermission = 
      user.role === 'admin' || 
      user.role === 'owner' || 
      checkPermission(user.permissions as Record<string, any>, 'crm.stages.create');
    
    if (!hasPermission) {
      console.log('Erro: Usuário sem permissão para criar estágios');
      return NextResponse.json({ error: 'Sem permissão para criar estágios' }, { status: 403 });
    }
    
    // Obter o originId do corpo da requisição
    let originId: string | null = null;
    let body: any = {};
    try {
      body = await request.json();
      originId = body.originId || null;
      console.log('Dados recebidos:', body);
      console.log('Criando estágios padrão para a origem:', originId);
    } catch (error) {
      console.log('Nenhum corpo de requisição fornecido para originId ou erro ao parsear JSON:', error);
      // Não forçar falha se não houver body, continuamos criando estágios sem origem
    }
    
    // Verificar se a origem existe
    if (originId) {
      try {
        // Usar type casting para acessar o modelo origins
        const origin = await (prisma as any).origins.findFirst({
          where: {
            id: originId,
            workspaceId
          }
        });
        
        if (!origin) {
          console.log(`Erro: Origem com ID ${originId} não encontrada`);
          return NextResponse.json({ 
            error: `Origem com ID ${originId} não encontrada` 
          }, { status: 404 });
        }
        
        console.log('Origem encontrada:', origin.name);
      } catch (originError) {
        console.error('Erro ao verificar existência da origem:', originError);
        return NextResponse.json({ 
          error: 'Erro ao verificar existência da origem',
          details: originError instanceof Error ? originError.message : 'Erro desconhecido'
        }, { status: 500 });
      }
    }
    
    // Verificar se já existem estágios
    let existingStagesCount = 0;
    try {
      existingStagesCount = await (prisma as any).stages.count({
        where: {
          workspaceId
        }
      });
      console.log(`Encontrados ${existingStagesCount} estágios existentes no workspace`);
    } catch (countError) {
      console.error('Erro ao contar estágios existentes:', countError);
      // Não vamos falhar por causa disso, assumimos que não há estágios
    }
    
    // Se já existem estágios para esta origem, verificar associações
    if (existingStagesCount > 0 && originId) {
      try {
        // Verificar se algum desses estágios está associado à origem através de leads
        // Usar type casting para acessar o modelo leads
        const leadsWithOrigin = await (prisma as any).leads.count({
          where: {
            originId: originId,
            stageId: { not: null },
            workspaceId
          }
        });
        
        console.log(`Origem ${originId} possui ${leadsWithOrigin} leads associados a estágios`);
        
        if (leadsWithOrigin > 0) {
          return NextResponse.json({ 
            message: `A origem ${originId} já possui ${leadsWithOrigin} leads associados a estágios. Nenhum estágio padrão foi criado.`,
            existingCount: leadsWithOrigin
          });
        }
      } catch (leadsError) {
        console.error('Erro ao verificar leads associados à origem:', leadsError);
        // Continuar mesmo com erro, tentando criar os estágios
      }
    }
    
    // Criar os estágios padrão
    console.log('Iniciando criação dos estágios padrão...');
    let createdStages: any[] = [];
    
    try {
      // Usar Promise.all para criar todos os estágios em paralelo
      createdStages = await Promise.all(
        DEFAULT_STAGES.map(async (stage, index) => {
          // Gerar ID único para cada estágio
          const stageId = `stage_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${index}`;
          console.log(`Criando estágio ${index + 1}/${DEFAULT_STAGES.length}: ${stage.name} (ID: ${stageId})`);
          
          try {
            return await (prisma as any).stages.create({
              data: {
                id: stageId,
                name: stage.name,
                description: stage.description,
                color: stage.color,
                order: stage.order,
                workspaceId,
                updatedAt: new Date(),
              }
            });
          } catch (stageError) {
            console.error(`Erro ao criar estágio ${stage.name}:`, stageError);
            // Retornar objeto de erro em vez de lançar exceção para não interromper a Promise.all
            return { error: true, name: stage.name, message: stageError instanceof Error ? stageError.message : 'Erro desconhecido' };
          }
        })
      );
      
      // Filtrar estágios com erro
      const failedStages = createdStages.filter(stage => stage.error);
      const successfulStages = createdStages.filter(stage => !stage.error);
      
      if (failedStages.length > 0) {
        console.warn(`${failedStages.length} estágios falharam ao serem criados:`, failedStages);
      }
      
      console.log(`Criados ${successfulStages.length} estágios padrão com sucesso`);
      
      // Usar apenas estágios bem-sucedidos a partir daqui
      createdStages = successfulStages;
      
    } catch (createError) {
      console.error('Erro ao criar estágios padrão:', createError);
      return NextResponse.json({ 
        error: 'Erro ao criar estágios padrão',
        details: createError instanceof Error ? createError.message : 'Erro desconhecido'
      }, { status: 500 });
    }
    
    // Se temos um originId e estágios foram criados, atualizar a origem para ter o primeiro estágio como padrão
    if (originId && createdStages.length > 0) {
      try {
        console.log(`Atualizando origem ${originId} com estágio padrão ${createdStages[0].id}`);
        
        // Usar type casting para acessar o modelo origins
        const updatedOrigin = await (prisma as any).origins.update({
          where: {
            id: originId
          },
          data: {
            defaultStageId: createdStages[0].id
          }
        });
        
        console.log(`Origem ${originId} atualizada com estágio padrão: ${createdStages[0].id}`);
        console.log('Resultado da atualização:', updatedOrigin);
        
        // Adicionalmente, crie pelo menos um lead para esta origem no estágio inicial
        try {
          const initialLeadId = `lead_initial_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          console.log(`Criando lead inicial ${initialLeadId} para origem ${originId} no estágio ${createdStages[0].id}`);
          
          // Usar type casting para acessar o modelo leads
          const initialLead = await (prisma as any).leads.create({
            data: {
              id: initialLeadId,
              name: `Lead inicial - ${new Date().toLocaleString('pt-BR')}`,
              phone: "Telefone não informado", // Campo obrigatório no modelo
              workspaceId: workspaceId,
              originId: originId,
              stageId: createdStages[0].id,
              value: 0,
              probability: 0,
              updatedAt: new Date()
            }
          });
          
          console.log(`Lead inicial criado para origem ${originId} no estágio ${createdStages[0].id}`);
          console.log('Lead inicial:', initialLead);
        } catch (leadError) {
          console.error('Erro ao criar lead inicial:', leadError);
          // Não falhar por causa disso
        }
      } catch (updateError) {
        console.error('Erro ao atualizar origem com estágio padrão:', updateError);
        // Continuar mesmo com erro, os estágios foram criados
      }
    }
    
    console.log('Processo de criação de estágios padrão concluído com sucesso');
    
    // Revalidar caminhos relacionados para atualizar a UI
    revalidatePath('/crm/pipeline');
    
    return NextResponse.json({
      success: true,
      message: 'Estágios padrão criados com sucesso',
      stages: createdStages,
      count: createdStages.length,
      originId: originId || undefined
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao criar estágios padrão:', error);
    
    // Log detalhado do erro para diagnóstico
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Erro ao criar estágios padrão',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 
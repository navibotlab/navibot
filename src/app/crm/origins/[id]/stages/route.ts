import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Criar uma instância direta do PrismaClient para garantir que está disponível
const prismaClient = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Função para obter os IDs de estágios padrão para uma origem
async function getDefaultStageIdsForOrigin(originId: string): Promise<string[]> {
  try {
    // @ts-ignore
    const origin = await prismaClient.origins.findUnique({
      where: { id: originId },
      select: { defaultStageId: true }
    });
    
    if (origin?.defaultStageId) {
      return [origin.defaultStageId];
    }
    
    return [];
  } catch (error) {
    console.error(`Erro ao obter estágios padrão para origem ${originId}:`, error);
    return [];
  }
}

// Função para criar estágios padrão para uma origem
async function createDefaultStagesForOrigin(originId: string): Promise<any[]> {
  try {
    // @ts-ignore
    const origin = await prismaClient.origins.findUnique({
      where: { id: originId },
      select: { workspaceId: true }
    });
    
    if (!origin) {
      throw new Error(`Origem não encontrada: ${originId}`);
    }
    
    const workspaceId = origin.workspaceId;
    
    // Nomes e cores dos estágios padrão
    const defaultStages = [
      { name: 'Qualificação', color: '#4285F4', order: 0 },
      { name: 'Proposta', color: '#34A853', order: 1 },
      { name: 'Negociação', color: '#FBBC04', order: 2 },
      { name: 'Fechamento', color: '#EA4335', order: 3 }
    ];
    
    // Criar estágios em paralelo
    const createdStages = await Promise.all(
      defaultStages.map(async (stage, index) => {
        // @ts-ignore
        return prismaClient.stages.create({
          data: {
            id: `default-stage-${originId}-${index}`,
            name: stage.name,
            color: stage.color,
            order: stage.order,
            workspaceId,
            createdAt: new Date(),
            updatedAt: new Date(),
            origins: {
              connect: { id: originId }
            }
          }
        });
      })
    );
    
    return createdStages;
  } catch (error) {
    console.error(`Erro ao criar estágios padrão para origem ${originId}:`, error);
    return [];
  }
}

// Função auxiliar para obter o workspace_id da origem
async function getWorkspaceIdForOrigin(originId: string): Promise<string> {
  try {
    // @ts-ignore
    const origin = await prismaClient.origins.findUnique({
      where: { id: originId },
      select: { workspaceId: true }
    });
    
    if (!origin) {
      throw new Error(`Origem não encontrada: ${originId}`);
    }
    
    return origin.workspaceId;
  } catch (error) {
    console.error(`Erro ao obter workspaceId para origem ${originId}:`, error);
    // Valor padrão para não quebrar a aplicação
    return "default_workspace_id";
  }
}

// GET - Buscar estágios de uma origem
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Verificar se o params.id existe
  const { id: originId } = params;
  
  console.log(`Buscando estágios para a origem: ${originId}`);
  
  try {
    // Extrair opções de consulta da URL
    const { searchParams } = new URL(request.url);
    const includeLeads = searchParams.get('includeLeads') === 'true';
    const createTestLead = searchParams.get('createTestLead') === 'true';
    
    console.log(`Parâmetros: includeLeads=${includeLeads}, createTestLead=${createTestLead}`);
    
    // Buscar estágios associados à origem
    // @ts-ignore
    const stages = await prismaClient.stages.findMany({
      where: {
        OR: [
          { origins: { some: { id: originId } } },
          { id: { in: await getDefaultStageIdsForOrigin(originId) } }
        ]
      },
      orderBy: {
        order: 'asc'
      },
      include: includeLeads ? {
        leads: {
          where: {
            // Apenas leads da origem especificada
            originId
          },
          include: {
            tags: true // Incluir tags para formatação
          },
          orderBy: {
            updatedAt: 'desc'
          }
        }
      } : undefined
    });
    
    console.log(`Encontrados ${stages.length} estágios para a origem ${originId}`);
    
    // Se não houver estágios, criar estágios padrão
    if (stages.length === 0) {
      console.log(`Nenhum estágio encontrado para a origem ${originId}. Criando estágios padrão...`);
      const defaultStages = await createDefaultStagesForOrigin(originId);
      
      // Incluir leads se solicitado
      if (includeLeads) {
        console.log('Incluindo leads na resposta de estágios padrão...');
        for (const stage of defaultStages) {
          // @ts-ignore
          stage.leads = [];
        }
      }
      
      return NextResponse.json({ stages: defaultStages });
    }
    
    // Verificar se temos leads associados aos estágios
    let totalLeads = 0;
    let needsTestLead = createTestLead;
    let firstStageId = '';
    
    if (includeLeads) {
      for (const stage of stages) {
        // @ts-ignore - O campo leads existe no resultado quando includeLeads=true
        if (stage.leads) {
          // @ts-ignore
          totalLeads += stage.leads.length;
          // @ts-ignore
          console.log(`Estágio "${stage.name}" (${stage.id}): ${stage.leads.length} leads`);
          
          // @ts-ignore - Formatação dos leads para o mesmo formato usado no frontend
          stage.leads = stage.leads.map((lead: any) => ({
            ...lead,
            labels: lead.tags.map((tag: any) => ({
              id: tag.id,
              name: tag.name,
              color: tag.color
            }))
          }));
        }
        
        // Guardar o ID do primeiro estágio para criar lead de teste se necessário
        if (!firstStageId) {
          // @ts-ignore
          firstStageId = stage.id;
        }
      }
      
      console.log(`Total de leads encontrados em todos os estágios: ${totalLeads}`);
      
      // Se não tiver nenhum lead e solicitou criar um lead de teste
      if (totalLeads === 0 && createTestLead && firstStageId) {
        needsTestLead = true;
      }
    }
    
    // Criar lead de teste se necessário
    if (needsTestLead && firstStageId) {
      try {
        console.log(`Criando lead de teste para o estágio ${firstStageId} na origem ${originId}...`);
        
        const testLeadName = `Lead de teste (${new Date().toLocaleString('pt-BR')})`;
        const testPhoneNumber = `12999${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        
        // @ts-ignore
        const testLead = await prismaClient.leads.create({
          data: {
            name: testLeadName,
            phone: testPhoneNumber,
            workspaceId: await getWorkspaceIdForOrigin(originId),
            stageId: firstStageId,
            originId: originId,
            value: 1000.00,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          include: {
            tags: true
          }
        });
        
        console.log(`Lead de teste criado com sucesso: ${testLead.id}`);
        
        // Adicionar o lead de teste ao primeiro estágio
        for (const stage of stages) {
          // @ts-ignore
          if (stage.id === firstStageId) {
            // @ts-ignore
            if (!stage.leads) stage.leads = [];
            
            // @ts-ignore
            stage.leads.push({
              ...testLead,
              labels: testLead.tags.map((tag: any) => ({
                id: tag.id,
                name: tag.name,
                color: tag.color
              }))
            });
            
            // @ts-ignore
            console.log(`Adicionado lead de teste ao estágio "${stage.name}" (${stage.id}). Total agora: ${stage.leads.length}`);
            
            break;
          }
        }
        
        totalLeads++;
      } catch (error) {
        console.error('Erro ao criar lead de teste:', error);
      }
    }
    
    return NextResponse.json({ stages, totalLeads });
  } catch (error) {
    console.error('Erro ao buscar estágios:', error);
    return NextResponse.json({ error: 'Erro ao buscar estágios' }, { status: 500 });
  }
} 
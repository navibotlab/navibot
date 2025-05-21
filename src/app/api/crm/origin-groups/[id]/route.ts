import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

/**
 * DELETE /api/crm/origin-groups/:id
 * Remove um grupo de origem existente, junto com todas as origens e negócios associados
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Aguardar resolução do objeto params para evitar o erro
    const resolvedParams = await Promise.resolve(params);
    const groupId = resolvedParams.id;
    
    if (!groupId) {
      return NextResponse.json({ 
        error: 'ID do grupo não fornecido'
      }, { status: 400 });
    }

    console.log(`[SERVER] Tentando excluir grupo de origem: ${groupId}`);
    
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
    
    // 1. Buscar todas as origens associadas ao grupo
    const origins = await (prisma as any).origins.findMany({
      where: {
        originGroupId: groupId,
        workspaceId: user.workspaceId
      },
      include: {
        stages: true // Incluir os estágios de cada origem
      }
    });

    // Extrair os IDs das origens para uso posterior
    const originIds = origins.map((origin: any) => origin.id);
    console.log(`[SERVER] Encontradas ${origins.length} origens associadas ao grupo ${groupId}`, originIds);
    
    // Variáveis para contagem de itens excluídos
    let totalDeletedBusinesses = 0;
    let totalDeletedLeads = 0;
    let totalDeletedStages = 0;
    
    // Usar uma transação para garantir consistência: se qualquer operação falhar, nada será excluído
    const result = await prisma.$transaction(async (tx) => {
      // Para cada origem, excluir estágios e negócios associados
      for (const origin of origins) {
        const originId = origin.id;
        
        // 2.1 Excluir negócios (business) associados à origem
        console.log(`[SERVER] Excluindo negócios da origem ${originId}`);
        const deletedBusinesses = await (tx as any).business.deleteMany({
          where: {
            originId: originId,
            workspaceId: user.workspaceId
          }
        });
        totalDeletedBusinesses += deletedBusinesses.count;
        console.log(`[SERVER] Excluídos ${deletedBusinesses.count} negócios da origem ${originId}`);
        
        // 2.2 Excluir leads associados à origem
        console.log(`[SERVER] Excluindo leads da origem ${originId}`);
        const deletedLeads = await (tx as any).leads.deleteMany({
          where: {
            originId: originId,
            workspaceId: user.workspaceId
          }
        });
        totalDeletedLeads += deletedLeads.count;
        console.log(`[SERVER] Excluídos ${deletedLeads.count} leads da origem ${originId}`);
        
        // 2.3 Se a origem tem um estágio padrão, remover a referência antes de excluir
        if (origin.defaultStageId) {
          console.log(`[SERVER] Removendo referência a estágio padrão da origem ${originId}`);
          await (tx as any).origins.update({
            where: { id: originId },
            data: { defaultStageId: null }
          });
        }
        
        // 2.4 Excluir estágios relacionados a esta origem
        if (origin.stages && origin.stages.length > 0) {
          const stageIds = origin.stages.map((stage: any) => stage.id);
          console.log(`[SERVER] Excluindo ${stageIds.length} estágios da origem ${originId}`);
          
          const deletedStages = await (tx as any).stages.deleteMany({
            where: {
              id: { in: stageIds }
            }
          });
          totalDeletedStages += deletedStages.count;
          console.log(`[SERVER] Excluídos ${deletedStages.count} estágios da origem ${originId}`);
        }
      }
      
      // 3. Excluir todas as origens associadas ao grupo
      console.log(`[SERVER] Excluindo ${origins.length} origens do grupo ${groupId}`);
      const deletedOrigins = await (tx as any).origins.deleteMany({
        where: {
          originGroupId: groupId,
          workspaceId: user.workspaceId
        }
      });
      
      // 4. Finalmente, excluir o grupo
      console.log(`[SERVER] Excluindo o grupo ${groupId}`);
      const deletedGroup = await (tx as any).origin_groups.delete({
        where: { id: groupId }
      });
      
      return {
        deletedGroup,
        deletedOriginsCount: deletedOrigins.count,
        totalDeletedBusinesses,
        totalDeletedLeads,
        totalDeletedStages
      };
    });
    
    // Revalidar caminhos relacionados
    revalidatePath('/crm/pipeline');
    
    console.log(`[SERVER] Grupo ${groupId} e todas as suas origens e negócios foram excluídos com sucesso`);
    
    return NextResponse.json({ 
      success: true,
      message: "Grupo, origens e negócios associados foram excluídos com sucesso",
      deletedOriginsCount: result.deletedOriginsCount,
      deletedBusinessCount: result.totalDeletedBusinesses,
      deletedLeadsCount: result.totalDeletedLeads,
      deletedStagesCount: result.totalDeletedStages
    });
  } catch (error) {
    console.error('[SERVER] Erro ao remover grupo de origem:', error);
    console.error('[SERVER] Detalhes do erro:', error instanceof Error ? error.message : 'Erro desconhecido');
    console.error('[SERVER] Stack trace:', error instanceof Error ? error.stack : 'Stack trace indisponível');
    
    return NextResponse.json(
      { 
        error: 'Erro ao remover grupo de origem',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 
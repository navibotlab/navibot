import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

/**
 * DELETE /api/crm/origins/[id]
 * Exclui uma origem específica por ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Aguardar resolução do objeto params
  const resolvedParams = await Promise.resolve(params);
  const originId = resolvedParams.id;
  
  console.log('DELETE /api/crm/origins/[id] - Iniciando exclusão de origem', originId);
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('Erro: Usuário não autenticado');
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
      console.log('Erro: Usuário não encontrado na base de dados');
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    console.log('ID da origem a ser excluída:', originId);
    console.log('Workspace do usuário:', user.workspaceId);
    
    // Verificar permissão
    const hasPermission = 
      user.role === 'admin' || 
      user.role === 'owner' || 
      checkPermission(user.permissions as Record<string, any>, 'crm.origins.delete');
    
    if (!hasPermission) {
      console.log('Erro: Usuário sem permissão para excluir origens');
      return NextResponse.json({ error: 'Sem permissão para excluir origens' }, { status: 403 });
    }
    
    // Verificar se a origem existe e pertence ao workspace
    const existingOrigin = await (prisma as any).origins.findFirst({
      where: {
        id: originId,
        workspaceId: user.workspaceId
      }
    });
    
    if (!existingOrigin) {
      console.log('Erro: Origem não encontrada ou não pertence ao workspace do usuário');
      return NextResponse.json({ error: 'Origem não encontrada' }, { status: 404 });
    }
    
    console.log('Origem encontrada:', existingOrigin.name);
    
    // IMPORTANTE: Verificar se existem negócios (business) associados a esta origem
    // No schema Prisma, há uma restrição onDelete:Restrict que impede a exclusão 
    // de uma origem se existirem negócios associados a ela
    const businessCount = await (prisma as any).business.count({
      where: {
        originId,
        workspaceId: user.workspaceId
      }
    });
    
    console.log('Negócios associados a esta origem:', businessCount);
    
    // Usar transação para garantir atomicidade da operação
    const result = await prisma.$transaction(async (tx) => {
      // Verificar estágios associados a esta origem
      // O modelo Stages não possui um campo originId diretamente, mas sim uma relação com origins
      // Precisamos buscar estágios que tenham uma relação com a origem específica
      console.log('Buscando estágios relacionados a esta origem...');
      
      // Na verdade, no schema, origins é que tem uma relação com stages através do campo defaultStageId
      const origin = await (tx as any).origins.findUnique({
        where: { id: originId },
        include: { stages: true }
      });
      
      // Se a origem tem um estágio padrão, precisamos remover a referência antes de excluir
      if (origin && origin.defaultStageId) {
        console.log('Removendo referência a estágio padrão da origem...');
        await (tx as any).origins.update({
          where: { id: originId },
          data: { defaultStageId: null }
        });
      }
      
      // Excluir todos os negócios associados a esta origem, se houver
      let deletedBusinessCount = 0;
      if (businessCount > 0) {
        console.log('Excluindo negócios associados a esta origem...');
        const deletedBusiness = await (tx as any).business.deleteMany({
          where: {
            originId,
            workspaceId: user.workspaceId
          }
        });
        deletedBusinessCount = deletedBusiness.count;
        console.log(`${deletedBusinessCount} negócios foram excluídos`);
      }

      // Excluir estágios relacionados a esta origem
      console.log('Excluindo estágios relacionados a esta origem...');
      let deletedStagesCount = 0;
      if (origin && origin.stages && origin.stages.length > 0) {
        const stageIds = origin.stages.map((stage: any) => stage.id);
        const deletedStages = await (tx as any).stages.deleteMany({
          where: {
            id: { in: stageIds }
          }
        });
        deletedStagesCount = deletedStages.count;
        console.log(`${deletedStagesCount} estágios foram excluídos`);
      }
      
      // Verificar leads associados à origem e remover a referência
      const leadsWithOrigin = await (tx as any).leads.count({
        where: {
          originId,
          workspaceId: user.workspaceId
        }
      });
      
      console.log('Leads com esta origem:', leadsWithOrigin);
      
      // Atualizar leads para remover referência à origem
      if (leadsWithOrigin > 0) {
        console.log('Atualizando leads para remover referência à origem...');
        await (tx as any).leads.updateMany({
          where: {
            originId,
            workspaceId: user.workspaceId
          },
          data: {
            originId: null
          }
        });
      }
      
      // Por fim, excluir a origem
      console.log('Excluindo a origem...');
      try {
        const deleted = await (tx as any).origins.delete({
          where: { id: originId }
        });
        
        return {
          success: true,
          deletedOrigin: deleted,
          deletedBusinessCount,
          deletedStagesCount,
          updatedLeadsCount: leadsWithOrigin
        };
      } catch (deleteError) {
        console.error('Erro ao excluir origem dentro da transação:', deleteError);
        
        // Verificar se o erro está relacionado a alguma restrição de chave estrangeira
        const errorMessage = deleteError instanceof Error ? deleteError.message : 'Erro desconhecido';
        
        if (errorMessage.includes('foreign key constraint') || 
            errorMessage.includes('violates foreign key constraint')) {
          throw new Error('Não é possível excluir esta origem porque ela está sendo usada por outros registros no sistema');
        }
        
        throw deleteError;
      }
    });
    
    // Revalidar caminhos relacionados
    revalidatePath('/crm/pipeline');
    
    console.log('Origem excluída com sucesso:', result);
    return NextResponse.json({ 
      message: 'Origem excluída com sucesso',
      ...result
    });
  } catch (error) {
    console.error('Erro ao excluir origem:', error);
    
    // Imprimir a pilha de erros para diagnóstico
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    
    let errorMessage = 'Erro ao excluir origem';
    let statusCode = 500;
    
    if (error instanceof Error) {
      // Verificar mensagens específicas de erro para fornecer respostas mais precisas
      if (error.message.includes('negócios associados') || 
          error.message.includes('foreign key constraint')) {
        errorMessage = 'Não é possível excluir esta origem porque existem negócios ou outros registros associados a ela';
        statusCode = 409; // Conflict
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Erro ao excluir origem', 
        message: errorMessage,
        details: error instanceof Error ? error.stack : null
      },
      { status: statusCode }
    );
  }
}

/**
 * GET /api/crm/origins/[id]
 * Obtém detalhes de uma origem específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Aguardar resolução do objeto params
  const resolvedParams = await Promise.resolve(params);
  const originId = resolvedParams.id;
  
  console.log('GET /api/crm/origins/[id] - Iniciando busca de origem', originId);
  
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
      checkPermission(user.permissions as Record<string, any>, 'crm.origins.view');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para visualizar origens' }, { status: 403 });
    }
    
    console.log('ID da origem a ser buscada:', originId);
    
    // Buscar origem com tratamento de erro adequado
    try {
      const origin = await (prisma as any).origins.findFirst({
        where: {
          id: originId,
          workspaceId: user.workspaceId
        },
        include: {
          origin_groups: true,
          // Aqui precisamos apenas incluir stages, sem opções adicionais que causam erro
          stages: true 
        }
      });
      
      if (!origin) {
        console.log('Origem não encontrada:', originId);
        return NextResponse.json({ error: 'Origem não encontrada' }, { status: 404 });
      }
      
      // Se precisarmos ordenar os estágios, fazemos isso após obter o resultado
      if (origin.stages && Array.isArray(origin.stages)) {
        origin.stages.sort((a: any, b: any) => a.order - b.order);
      }
      
      console.log('Origem encontrada com sucesso:', origin.name);
      return NextResponse.json({ data: origin });
    } catch (dbError) {
      console.error('Erro de banco de dados ao buscar origem:', dbError);
      return NextResponse.json(
        { 
          error: 'Erro ao buscar origem do banco de dados',
          message: dbError instanceof Error ? dbError.message : 'Erro desconhecido'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao buscar origem:', error);
    
    // Log detalhado do erro para diagnóstico
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Erro ao buscar origem',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/crm/origins/[id]
 * Atualiza uma origem específica
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Aguardar resolução do objeto params
  const resolvedParams = await Promise.resolve(params);
  const originId = resolvedParams.id;
  
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
    
    // Atualizar a origem
    const updatedOrigin = await (prisma as any).origins.update({
      where: { id: originId },
      data: {
        name: body.name ?? existingOrigin.name,
        description: body.description ?? existingOrigin.description,
        originGroupId: body.originGroupId ?? existingOrigin.originGroupId,
        defaultStageId: body.defaultStageId ?? existingOrigin.defaultStageId,
        active: body.active ?? existingOrigin.active,
        updatedAt: new Date()
      }
    });
    
    // Revalidar caminhos relacionados
    revalidatePath('/crm/pipeline');
    
    return NextResponse.json({ data: updatedOrigin });
  } catch (error) {
    console.error('Erro ao atualizar origem:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar origem' },
      { status: 500 }
    );
  }
} 
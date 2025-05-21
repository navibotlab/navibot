import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';
import { z } from 'zod';
import { headers } from 'next/headers';

// Criar uma instância direta do PrismaClient para garantir que está disponível
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Schema para validação dos dados recebidos
const updateStageSchema = z.object({
  stageId: z.string(),
  value: z.number().optional(),
  ownerId: z.string().optional(),
  origin: z.string().optional(),
  originId: z.string().optional(),
});

// PUT - Atualizar o estágio de um lead (usado pelo drag-and-drop)
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const headersList = await headers();
    const workspaceId = headersList.get('x-workspace-id');
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace não encontrado no contexto' },
        { status: 400 }
      );
    }
    
    // Aguardar resolução do objeto params por completo
    const params = await context.params;
    const leadId = params.id;
    
    console.log(`Atualizando estágio do lead ${leadId} no workspace ${workspaceId}`);
    
    if (!leadId) {
      return NextResponse.json(
        { error: 'ID do lead não fornecido' },
        { status: 400 }
      );
    }
    
    // Verificar se o lead existe e pertence ao workspace
    // @ts-ignore - O modelo 'leads' existe no runtime mas não é reconhecido pelo TypeScript
    const existingLead = await prisma.leads.findFirst({
      where: {
        id: leadId,
        workspaceId
      }
    });
    
    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead não encontrado ou não pertence a este workspace' },
        { status: 404 }
      );
    }
    
    // Processar dados da requisição
    const data = await request.json();
    console.log('Dados recebidos para atualização:', data);
    console.log('OriginId recebido na requisição:', data.originId);
    
    // Verificar se o estágio de destino existe e pertence ao workspace
    if (data.stageId) {
      // @ts-ignore - O modelo 'stages' existe no runtime mas não é reconhecido pelo TypeScript
      const stageExists = await prisma.stages.findFirst({
        where: {
          id: data.stageId,
          workspaceId
        }
      });
      
      if (!stageExists) {
        return NextResponse.json(
          { error: 'Estágio de destino não encontrado ou não pertence a este workspace' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'ID do estágio de destino não fornecido' },
        { status: 400 }
      );
    }
    
    // Preservar o originId existente ou atualizar se fornecido
    const updateData: {
      stageId: any;
      value?: number;
      ownerId?: any;
      source?: any;
      originId?: string;
    } = {
      stageId: data.stageId,
      // Manter outros campos importantes
      ...(data.value !== undefined && { value: parseFloat(data.value) }),
      ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
      ...(data.origin !== undefined && { source: data.origin }),
    };
    
    // Tratamento explícito do originId
    if (data.originId !== undefined) {
      // Se um originId foi fornecido, usá-lo
      updateData.originId = data.originId;
      console.log(`Definindo originId para: ${data.originId}`);
    } else {
      // Se nenhum originId foi fornecido, manter o atual
      console.log(`Mantendo originId atual: ${existingLead.originId || 'nenhum'}`);
    }
    
    console.log('Dados a serem atualizados:', updateData);
    
    // Logging adicional para debug
    console.log(`originId atual: ${existingLead.originId}, novo originId: ${data.originId || 'não alterado'}`);
    
    // Verificar se é o mesmo lead em uma origem diferente
    if (data.originId && existingLead.originId !== data.originId) {
      console.log(`Movendo lead entre origens: de ${existingLead.originId || 'sem origem'} para ${data.originId}`);
    }
    
    // Atualizar o lead com o novo estágio
    // @ts-ignore - O modelo 'leads' existe no runtime mas não é reconhecido pelo TypeScript
    const updatedLead = await prisma.leads.update({
      where: { id: leadId },
      data: updateData,
      include: {
        tags: true
      }
    });
    
    // Formatar a resposta para incluir as tags no formato esperado pelo frontend
    const formattedLead = {
      ...updatedLead,
      labels: updatedLead.tags.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color
      }))
    };
    
    console.log('Lead atualizado com sucesso');
    return NextResponse.json(formattedLead);
  } catch (error) {
    console.error('Erro ao atualizar estágio do lead:', error);
    if (error instanceof Error) {
      console.error('Nome do erro:', error.name);
      console.error('Mensagem do erro:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    // Verificar a disponibilidade dos modelos no Prisma
    try {
      const modelos = Object.keys(prisma).filter(key => !key.startsWith('$'));
      console.log('Modelos disponíveis no Prisma:', modelos);
    } catch (e) {
      console.error('Erro ao listar modelos:', e);
    }
    
    return NextResponse.json(
      { error: 'Erro ao atualizar estágio do lead' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar o stage de um lead (mantido para compatibilidade)
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    
    // Aguardar resolução do objeto params por completo
    const params = await context.params;
    const leadId = params.id;
    
    if (!leadId) {
      return NextResponse.json(
        { error: 'ID do lead não fornecido' },
        { status: 400 }
      );
    }
    
    // Verificar se o lead existe e pertence ao workspace
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        workspaceId: workspaceId
      }
    });
    
    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead não encontrado ou não pertence a este workspace' },
        { status: 404 }
      );
    }
    
    // Processar dados da requisição
    const data = await request.json();
    
    try {
      updateStageSchema.parse({
        ...data,
        value: data.value ? parseFloat(data.value) : undefined
      });
    } catch (error) {
      console.error('Erro de validação:', error);
      return NextResponse.json(
        { error: 'Dados inválidos para atualização de estágio' },
        { status: 400 }
      );
    }
    
    // Preparar dados para atualização
    const updateData: any = {};
    
    if (data.stageId) {
      // Verificar se o estágio existe e pertence ao workspace
      const stageExists = await prisma.stage.findFirst({
        where: {
          id: data.stageId,
          workspaceId: workspaceId
        }
      });
      
      if (!stageExists) {
        return NextResponse.json(
          { error: 'Estágio não encontrado ou não pertence a este workspace' },
          { status: 400 }
        );
      }
      
      updateData.stageId = data.stageId;
    }
    
    if (data.value !== undefined) {
      updateData.value = parseFloat(data.value);
    }
    
    if (data.ownerId) {
      // Verificar se o usuário existe e pertence ao workspace
      const userExists = await prisma.users.findFirst({
        where: {
          id: data.ownerId,
          workspaceId: workspaceId
        }
      });
      
      if (!userExists) {
        return NextResponse.json(
          { error: 'Usuário não encontrado ou não pertence a este workspace' },
          { status: 400 }
        );
      }
      
      updateData.ownerId = data.ownerId;
    }
    
    if (data.origin) {
      updateData.source = data.origin;
    }
    
    // Atualizar o lead
    const updatedLead = await prisma.lead.update({
      where: {
        id: leadId
      },
      data: updateData
    });
    
    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Erro ao atualizar estágio do lead:', error);
    if (error instanceof Error) {
      console.error('Nome do erro:', error.name);
      console.error('Mensagem do erro:', error.message);
      console.error('Stack trace:', error.stack);
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar estágio do lead' },
      { status: 500 }
    );
  }
} 
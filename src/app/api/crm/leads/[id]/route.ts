import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';

// GET - Buscar informações do lead
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    
    // Aguardar resolução do objeto params por completo
    const params = await context.params;
    const id = params.id;
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace não encontrado no contexto' },
        { status: 400 }
      );
    }
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do lead não fornecido' },
        { status: 400 }
      );
    }

    // @ts-ignore - O modelo 'leads' existe no runtime mas não é reconhecido pelo TypeScript
    const lead = await prisma.leads.findFirst({
      where: { 
        id,
        workspaceId 
      },
      include: {
        tags: true
      }
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead não encontrado neste workspace' },
        { status: 404 }
      );
    }

    // Formatar o lead para manter compatibilidade com o frontend
    return NextResponse.json({
      ...lead,
      labels: lead.tags.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar lead:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar informações do lead' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar dados de um lead
export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    
    // Aguardar resolução do objeto params por completo
    const params = await context.params;
    const id = params.id;
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace não encontrado no contexto' },
        { status: 400 }
      );
    }
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do lead não fornecido' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { name, labels = [] } = data;

    // Verificar se o lead existe e pertence ao workspace
    // @ts-ignore - O modelo 'leads' existe no runtime mas não é reconhecido pelo TypeScript
    const leadExists = await prisma.leads.findFirst({
      where: { 
        id,
        workspaceId
      }
    });

    if (!leadExists) {
      return NextResponse.json(
        { error: 'Lead não encontrado neste workspace' },
        { status: 404 }
      );
    }

    // Desconectar todas as etiquetas existentes e conectar as novas
    // Este é um padrão comum para atualizar relações muitos-para-muitos
    // @ts-ignore - O modelo 'leads' existe no runtime mas não é reconhecido pelo TypeScript
    const updatedLead = await prisma.leads.update({
      where: { id },
      data: {
        name: name || null,
        tags: {
          // Primeiro desconectamos todas as tags
          set: [],
          // Depois conectamos as novas (ou as mesmas, se não mudaram)
          connect: Array.isArray(labels) ? labels.map(label => ({ id: label.id })) : []
        }
      },
      include: {
        tags: true
      }
    });

    // Retornamos o lead atualizado com as etiquetas no formato esperado pelo frontend
    return NextResponse.json({
      ...updatedLead,
      labels: updatedLead.tags.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color
      }))
    });
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar o lead' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar o stage de um lead
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    
    // Aguardar resolução do objeto params por completo
    const params = await context.params;
    const leadId = params.id;
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace não encontrado no contexto' },
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
    
    // Atualizar o lead
    const data = await request.json();
    // @ts-ignore - O modelo 'leads' existe no runtime mas não é reconhecido pelo TypeScript
    const updatedLead = await prisma.leads.update({
      where: { id: leadId },
      data: {
        stageId: data.stageId
      }
    });
    
    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar lead' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir lead completamente
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Obter o workspaceId usando a função de contexto
    const { workspaceId } = await getWorkspaceFromContext();
    console.log('Excluindo lead - workspaceId:', workspaceId);
    
    // Obter o ID do lead dos parâmetros da rota
    const leadId = context.params.id;
    console.log('Excluindo lead - leadId:', leadId);
    
    if (!workspaceId) {
      console.error('Workspace ID não disponível no contexto');
      return NextResponse.json(
        { error: 'Workspace não encontrado no contexto' },
        { status: 400 }
      );
    }
    
    // Verificar se o lead existe e pertence ao workspace antes de tentar excluí-lo
    // @ts-ignore - O modelo 'leads' existe no runtime mas não é reconhecido pelo TypeScript
    const existingLead = await prisma.leads.findFirst({
      where: {
        id: leadId,
        workspaceId
      }
    });
    
    if (!existingLead) {
      console.error(`Lead ${leadId} não encontrado no workspace ${workspaceId}`);
      return NextResponse.json(
        { error: 'Lead não encontrado ou não pertence a este workspace' },
        { status: 404 }
      );
    }
    
    console.log(`Lead ${leadId} encontrado, procedendo com a exclusão`);
    
    try {
      // Deletar mensagens das conversas do lead
      const conversations = await prisma.conversations.findMany({ where: { lead_id: leadId } });
      const conversationIds = conversations.map(c => c.id);
      if (conversationIds.length > 0) {
        console.log(`Deletando ${conversationIds.length} conversas e mensagens vinculadas ao lead ${leadId}`);
        await prisma.messages.deleteMany({ where: { conversation_id: { in: conversationIds } } });
        await prisma.conversations.deleteMany({ where: { id: { in: conversationIds } } });
      }
      // Deletar outros relacionamentos obrigatórios
      await prisma.notes.deleteMany({ where: { leadId: leadId } });
      await prisma.tasks.deleteMany({ where: { leadId: leadId } });
      await prisma.lead_custom_fields.deleteMany({ where: { leadId: leadId } });
      // Desconectar etiquetas
      await prisma.leads.update({
        where: { id: leadId },
        data: { tags: { set: [] } }
      });
      // Agora tenta deletar o lead
      await prisma.leads.delete({
        where: { id: leadId }
      });
      
      console.log(`Lead ${leadId} excluído com sucesso, junto com conversas e mensagens vinculadas.`);
      return NextResponse.json(
        { message: 'Lead excluído com sucesso' },
        { status: 200 }
      );
    } catch (deleteError) {
      console.error('Erro ao excluir lead:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao excluir lead: ' + (deleteError instanceof Error ? deleteError.message : String(deleteError)) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro detalhado ao excluir lead:', error);
    console.error('Detalhes do erro:', {
      nome: error instanceof Error ? error.name : 'Erro desconhecido',
      mensagem: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'Stack não disponível'
    });
    
    return NextResponse.json(
      { error: 'Erro ao excluir lead: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 
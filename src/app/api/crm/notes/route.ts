import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkPermission } from '@/lib/permissions';

// Schema de validação para criação/atualização de notas
const noteSchema = z.object({
  content: z.string().min(2, { message: 'O conteúdo deve ter pelo menos 2 caracteres' }),
  leadId: z.string().uuid({ message: 'ID do lead inválido' })
});

/**
 * GET /api/crm/notes
 * Retorna todas as notas do workspace atual, com filtro opcional de lead
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { 
        workspaceId: true,
        role: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Verificar permissão - assumimos que quem pode visualizar leads pode ver suas notas
    const canViewNotes = 
      user.role === 'admin' || 
      user.role === 'owner' || 
      await checkPermission(session.user.id, 'crm.leads.view');
    
    if (!canViewNotes) {
      return NextResponse.json({ error: 'Sem permissão para visualizar notas' }, { status: 403 });
    }
    
    // Obter parâmetros da query
    const url = new URL(request.url);
    const leadId = url.searchParams.get('leadId');
    
    // Construir filtro
    const whereClause: any = {
      workspaceId: user.workspaceId
    };
    
    if (leadId) {
      whereClause.leadId = leadId;
    }
    
    // Buscar notas - como o modelo Note ainda não existe, isso gerará erro
    // É necessário primeiro criar o modelo no schema do Prisma
    return NextResponse.json(
      { 
        error: 'Modelo Note ainda não implementado no schema do Prisma',
        message: 'Por favor, adicione o modelo Note ao schema do Prisma antes de utilizar esta API'
      }, 
      { status: 501 }
    );

    // Código a ser descomentado após a criação do modelo Note
    /*
    const notes = await prisma.note.findMany({
      where: whereClause,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ data: notes });
    */
  } catch (error) {
    console.error('Erro ao buscar notas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar notas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crm/notes
 * Cria uma nova nota para um lead específico
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        workspaceId: true,
        role: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Verificar permissão - assumimos que quem pode editar leads pode criar notas
    const canCreateNotes = 
      user.role === 'admin' || 
      user.role === 'owner' || 
      await checkPermission(session.user.id, 'crm.leads.update');
    
    if (!canCreateNotes) {
      return NextResponse.json({ error: 'Sem permissão para criar notas' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Validar dados
    const validation = noteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.format() 
      }, { status: 400 });
    }
    
    const { content, leadId } = validation.data;
    
    // Verificar se o lead existe e pertence ao workspace
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        workspaceId: user.workspaceId
      }
    });
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }
    
    // Modelo Note ainda não implementado
    return NextResponse.json(
      { 
        error: 'Modelo Note ainda não implementado no schema do Prisma',
        message: 'Por favor, adicione o modelo Note ao schema do Prisma antes de utilizar esta API'
      }, 
      { status: 501 }
    );

    // Código a ser descomentado após a criação do modelo Note
    /*
    // Criar a nova nota
    const newNote = await prisma.note.create({
      data: {
        content,
        leadId,
        userId: user.id,
        workspaceId: user.workspaceId,
      }
    });
    
    return NextResponse.json(newNote, { status: 201 });
    */
  } catch (error) {
    console.error('Erro ao criar nota:', error);
    return NextResponse.json(
      { error: 'Erro ao criar nota' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/crm/notes/:id
 * Atualiza uma nota existente
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        workspaceId: true,
        role: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const noteId = pathParts[pathParts.length - 1];
    
    if (!noteId) {
      return NextResponse.json({ 
        error: 'ID da nota não fornecido'
      }, { status: 400 });
    }
    
    // Modelo Note ainda não implementado
    return NextResponse.json(
      { 
        error: 'Modelo Note ainda não implementado no schema do Prisma',
        message: 'Por favor, adicione o modelo Note ao schema do Prisma antes de utilizar esta API'
      }, 
      { status: 501 }
    );

    // Código a ser descomentado após a criação do modelo Note
    /*
    // Verificar se a nota existe e pertence ao workspace
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        workspaceId: user.workspaceId
      }
    });
    
    if (!existingNote) {
      return NextResponse.json({ error: 'Nota não encontrada' }, { status: 404 });
    }
    
    // Verificar permissão - apenas o criador da nota, admins ou owners podem editar
    const canUpdateNote = 
      user.role === 'admin' || 
      user.role === 'owner' || 
      existingNote.userId === user.id;
    
    if (!canUpdateNote) {
      return NextResponse.json({ error: 'Sem permissão para atualizar esta nota' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Validar dados
    const validation = noteSchema.partial().safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.format() 
      }, { status: 400 });
    }
    
    const updateData: any = {};
    
    // Apenas permitir atualização do conteúdo
    if (validation.data.content) {
      updateData.content = validation.data.content;
    }
    
    // Não permitir mudar o lead associado à nota
    if (validation.data.leadId && validation.data.leadId !== existingNote.leadId) {
      return NextResponse.json({ 
        error: 'Não é possível alterar o lead associado a esta nota' 
      }, { status: 400 });
    }
    
    // Atualizar a nota
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: updateData
    });
    
    return NextResponse.json(updatedNote);
    */
  } catch (error) {
    console.error('Erro ao atualizar nota:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar nota' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crm/notes/:id
 * Remove uma nota existente
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        workspaceId: true,
        role: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const noteId = pathParts[pathParts.length - 1];
    
    if (!noteId) {
      return NextResponse.json({ 
        error: 'ID da nota não fornecido'
      }, { status: 400 });
    }
    
    // Modelo Note ainda não implementado
    return NextResponse.json({ 
      error: 'Modelo Note ainda não implementado no schema do Prisma',
      message: 'Por favor, adicione o modelo Note ao schema do Prisma antes de utilizar esta API'
    }, { status: 501 });

    // Código a ser descomentado após a criação do modelo Note
    /*
    // Verificar se a nota existe e pertence ao workspace
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        workspaceId: user.workspaceId
      }
    });
    
    if (!existingNote) {
      return NextResponse.json({ error: 'Nota não encontrada' }, { status: 404 });
    }
    
    // Verificar permissão - apenas o criador da nota, admins ou owners podem remover
    const canDeleteNote = 
      user.role === 'admin' || 
      user.role === 'owner' || 
      existingNote.userId === user.id;
    
    if (!canDeleteNote) {
      return NextResponse.json({ error: 'Sem permissão para remover esta nota' }, { status: 403 });
    }
    
    // Remover a nota
    await prisma.note.delete({
      where: { id: noteId }
    });
    
    return NextResponse.json({ success: true }, { status: 204 });
    */
  } catch (error) {
    console.error('Erro ao remover nota:', error);
    return NextResponse.json(
      { error: 'Erro ao remover nota' },
      { status: 500 }
    );
  }
} 
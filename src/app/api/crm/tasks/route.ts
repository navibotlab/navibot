import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkPermission } from '@/lib/permissions';

// Schema de validação para criação/atualização de tarefas
const taskSchema = z.object({
  title: z.string().min(2, { message: 'O título deve ter pelo menos 2 caracteres' }),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  isCompleted: z.boolean().optional(),
  leadId: z.string().uuid({ message: 'ID do lead inválido' }),
  assignedToId: z.string().uuid({ message: 'ID do usuário inválido' }).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional()
});

/**
 * GET /api/crm/tasks
 * Retorna todas as tarefas do workspace atual, com filtros opcionais
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
        id: true,
        workspaceId: true,
        role: true,
        permissions: true,
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Verificar permissão
    const hasPermission = 
      user.role === 'admin' || 
      user.role === 'owner' || 
      checkPermission(user.permissions as Record<string, any>, 'crm.tasks.view');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para visualizar tarefas' }, { status: 403 });
    }
    
    // Obter parâmetros da query
    const url = new URL(request.url);
    const leadId = url.searchParams.get('leadId');
    const assignedToId = url.searchParams.get('assignedToId');
    const isCompleted = url.searchParams.get('isCompleted');
    const priority = url.searchParams.get('priority');
    const dueDateStart = url.searchParams.get('dueDateStart');
    const dueDateEnd = url.searchParams.get('dueDateEnd');
    const onlyMine = url.searchParams.get('onlyMine') === 'true';
    
    // Construir filtro
    const whereClause: any = {
      workspaceId: user.workspaceId
    };
    
    if (leadId) {
      whereClause.leadId = leadId;
    }
    
    if (assignedToId) {
      whereClause.assignedToId = assignedToId;
    } else if (onlyMine) {
      whereClause.assignedToId = user.id;
    }
    
    if (isCompleted !== null) {
      whereClause.isCompleted = isCompleted === 'true';
    }
    
    if (priority) {
      whereClause.priority = priority;
    }
    
    if (dueDateStart || dueDateEnd) {
      whereClause.dueDate = {};
      
      if (dueDateStart) {
        whereClause.dueDate.gte = new Date(dueDateStart);
      }
      
      if (dueDateEnd) {
        whereClause.dueDate.lte = new Date(dueDateEnd);
      }
    }
    
    // Buscar tarefas
    const tasks = await (prisma as any).task.findMany({
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
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: [
        { isCompleted: 'asc' },
        { dueDate: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return NextResponse.json({ data: tasks });
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar tarefas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crm/tasks
 * Cria uma nova tarefa no workspace atual
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
      checkPermission(user.permissions as Record<string, any>, 'crm.tasks.create');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para criar tarefas' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Validar dados
    const validation = taskSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.format() 
      }, { status: 400 });
    }
    
    const { 
      title, 
      description, 
      dueDate, 
      isCompleted, 
      leadId, 
      assignedToId,
      priority 
    } = validation.data;
    
    // Verificar se o lead existe e pertence ao workspace
    const lead = await (prisma as any).lead.findFirst({
      where: {
        id: leadId,
        workspaceId: user.workspaceId
      }
    });
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }
    
    // Se há um assignedToId, verificar se o usuário existe e pertence ao workspace
    if (assignedToId) {
      const assignedUser = await (prisma as any).users.findFirst({
        where: {
          id: assignedToId,
          workspaceId: user.workspaceId
        }
      });
      
      if (!assignedUser) {
        return NextResponse.json({ error: 'Usuário atribuído não encontrado' }, { status: 404 });
      }
    }
    
    // Criar a nova tarefa
    const newTask = await (prisma as any).task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        isCompleted: isCompleted || false,
        priority: priority || 'MEDIUM',
        workspaceId: user.workspaceId,
        leadId,
        assignedToId,
      }
    });
    
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    return NextResponse.json(
      { error: 'Erro ao criar tarefa' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/crm/tasks/:id
 * Atualiza uma tarefa existente
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
      checkPermission(user.permissions as Record<string, any>, 'crm.tasks.update');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para atualizar tarefas' }, { status: 403 });
    }
    
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const taskId = pathParts[pathParts.length - 1];
    
    if (!taskId) {
      return NextResponse.json({ 
        error: 'ID da tarefa não fornecido'
      }, { status: 400 });
    }
    
    // Verificar se a tarefa existe e pertence ao workspace
    const existingTask = await (prisma as any).task.findFirst({
      where: {
        id: taskId,
        workspaceId: user.workspaceId
      }
    });
    
    if (!existingTask) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }
    
    const body = await request.json();
    
    // Validar dados
    const validation = taskSchema.partial().safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.format() 
      }, { status: 400 });
    }
    
    const updateData = { ...validation.data };
    
    // Se houver leadId, verificar se o lead existe e pertence ao workspace
    if (updateData.leadId) {
      const lead = await (prisma as any).lead.findFirst({
        where: {
          id: updateData.leadId,
          workspaceId: user.workspaceId
        }
      });
      
      if (!lead) {
        return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
      }
    }
    
    // Se há um assignedToId, verificar se o usuário existe e pertence ao workspace
    if (updateData.assignedToId) {
      const assignedUser = await (prisma as any).users.findFirst({
        where: {
          id: updateData.assignedToId,
          workspaceId: user.workspaceId
        }
      });
      
      if (!assignedUser) {
        return NextResponse.json({ error: 'Usuário atribuído não encontrado' }, { status: 404 });
      }
    }
    
    // Se houver dueDate, converter para Date
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate) as any;
    }
    
    // Atualizar a tarefa
    const updatedTask = await (prisma as any).task.update({
      where: { id: taskId },
      data: updateData
    });
    
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar tarefa' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crm/tasks/:id
 * Remove uma tarefa existente
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
      checkPermission(user.permissions as Record<string, any>, 'crm.tasks.delete');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Sem permissão para remover tarefas' }, { status: 403 });
    }
    
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const taskId = pathParts[pathParts.length - 1];
    
    if (!taskId) {
      return NextResponse.json({ 
        error: 'ID da tarefa não fornecido'
      }, { status: 400 });
    }
    
    // Verificar se a tarefa existe e pertence ao workspace
    const existingTask = await (prisma as any).task.findFirst({
      where: {
        id: taskId,
        workspaceId: user.workspaceId
      }
    });
    
    if (!existingTask) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }
    
    // Remover a tarefa
    await (prisma as any).task.delete({
      where: { id: taskId }
    });
    
    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error) {
    console.error('Erro ao remover tarefa:', error);
    return NextResponse.json(
      { error: 'Erro ao remover tarefa' },
      { status: 500 }
    );
  }
} 
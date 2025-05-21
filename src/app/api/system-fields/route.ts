import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';
import { z } from 'zod';
import { initializeSystemFields } from './service';
import { nanoid } from 'nanoid';

// Schema para validação dos campos do sistema
const systemFieldSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  key: z.string().min(1, "Identificador é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  required: z.boolean().default(false),
  editable: z.boolean().default(true),
  options: z.array(z.string()).optional().default([]),
  group: z.string().default("Informações Gerais"),
  description: z.string().optional(),
});

// GET - Obter todos os campos do sistema
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    console.log(`GET /api/system-fields - Buscando campos para workspace: ${workspaceId}`);
    
    // Verifica se existe um ID específico na query
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      console.log(`GET /api/system-fields - Buscando campo específico: ${id}`);
      // Busca um campo específico
      const field = await (prisma as any).system_fields.findFirst({
        where: {
          id,
          workspaceId
        }
      });
      
      if (!field) {
        console.error(`GET /api/system-fields - Campo não encontrado: ${id}`);
        return NextResponse.json({ error: 'Campo não encontrado' }, { status: 404 });
      }
      
      console.log(`GET /api/system-fields - Campo encontrado: ${field.name}`);
      return NextResponse.json(field);
    }
    
    // Busca todos os campos
    console.log(`GET /api/system-fields - Buscando todos os campos para workspace: ${workspaceId}`);
    let fields = [];
    
    try {
      fields = await (prisma as any).system_fields.findMany({
        where: {
          workspaceId
        },
        orderBy: {
          name: 'asc'
        }
      });
      
      console.log(`GET /api/system-fields - ${fields.length} campos encontrados`);
    } catch (dbError) {
      console.error('Erro ao consultar banco de dados:', dbError);
      return NextResponse.json(
        { error: 'Erro ao buscar campos no banco de dados' },
        { status: 500 }
      );
    }
    
    // Se não houver campos, inicializa os campos padrão e busca novamente
    if (fields.length === 0) {
      console.log(`GET /api/system-fields - Inicializando campos padrão para o workspace ${workspaceId}`);
      try {
        await initializeSystemFields(workspaceId);
        
        // Busca campos novamente após a inicialização
        fields = await (prisma as any).system_fields.findMany({
          where: {
            workspaceId
          },
          orderBy: {
            name: 'asc'
          }
        });
        
        console.log(`GET /api/system-fields - ${fields.length} campos inicializados e carregados`);
      } catch (initError) {
        console.error('Erro ao inicializar campos padrão:', initError);
        // Continuar retornando array vazio mesmo com erro na inicialização
      }
    }
    
    return NextResponse.json(fields);
    
  } catch (error) {
    console.error('Erro ao buscar campos do sistema:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar campos do sistema' },
      { status: 500 }
    );
  }
}

// POST - Criar um novo campo do sistema
export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    console.log(`POST /api/system-fields - Criando campo para workspace: ${workspaceId}`);
    
    const body = await request.json();
    console.log('POST /api/system-fields - Dados recebidos:', body);
    
    // Validação dos dados
    const validationResult = systemFieldSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('POST /api/system-fields - Erro de validação:', validationResult.error.format());
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { name, key, type, required, editable, options, group, description } = validationResult.data;
    
    // Verificar se já existe um campo com a mesma chave
    try {
      const existingField = await (prisma as any).system_fields.findFirst({
        where: {
          key,
          workspaceId
        }
      });
      
      if (existingField) {
        console.log(`POST /api/system-fields - Campo duplicado: ${key}`);
        return NextResponse.json(
          { error: `Já existe um campo com o identificador "${key}"` },
          { status: 409 }
        );
      }
    } catch (findError) {
      console.error('Erro ao verificar campo existente:', findError);
    }
    
    console.log(`POST /api/system-fields - Criando campo: ${name} (${key})`);
    
    try {
      // Criar o campo
      const newField = await (prisma as any).system_fields.create({
        data: {
          id: nanoid(),
          name,
          key,
          type,
          required: required || false,
          editable: editable || true,
          options: options || [],
          group: group || 'Informações Gerais',
          description,
          workspaceId,
          updatedAt: new Date()
        }
      });
      
      console.log(`POST /api/system-fields - Campo criado com sucesso: ${newField.id}`);
      return NextResponse.json(newField, { status: 201 });
    } catch (createError) {
      console.error('Erro ao criar campo no banco de dados:', createError);
      return NextResponse.json(
        { error: 'Erro ao criar campo no banco de dados' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao criar campo do sistema:', error);
    return NextResponse.json(
      { error: 'Erro ao criar campo do sistema' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um campo do sistema existente
export async function PUT(request: NextRequest) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log(`PUT /api/system-fields - Atualizando campo ${id} no workspace ${workspaceId}`);
    
    if (!id) {
      console.error('PUT /api/system-fields - ID do campo não fornecido');
      return NextResponse.json(
        { error: 'ID do campo não fornecido' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    console.log(`PUT /api/system-fields - Dados recebidos:`, body);
    
    // Validação dos dados
    const validationResult = systemFieldSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('PUT /api/system-fields - Erro na validação de dados:', validationResult.error.format());
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { name, key, type, required, editable, options, group, description } = validationResult.data;
    
    // Verificar se o campo existe
    let existingField;
    try {
      existingField = await (prisma as any).system_fields.findFirst({
        where: {
          id,
          workspaceId
        }
      });
      
      if (!existingField) {
        console.error(`PUT /api/system-fields - Campo ${id} não encontrado`);
        return NextResponse.json(
          { error: 'Campo não encontrado' },
          { status: 404 }
        );
      }
      
      console.log(`PUT /api/system-fields - Campo encontrado: ${existingField.name}`);
    } catch (findError) {
      console.error('PUT /api/system-fields - Erro ao buscar campo:', findError);
      return NextResponse.json(
        { error: 'Erro ao verificar existência do campo' },
        { status: 500 }
      );
    }
    
    // Verificar se está tentando alterar a chave para uma que já existe
    if (key !== existingField.key) {
      try {
        const duplicateKey = await (prisma as any).system_fields.findFirst({
          where: {
            key,
            workspaceId,
            NOT: {
              id
            }
          }
        });
        
        if (duplicateKey) {
          console.error(`PUT /api/system-fields - Chave duplicada: ${key}`);
          return NextResponse.json(
            { error: `Já existe um campo com o identificador "${key}"` },
            { status: 409 }
          );
        }
      } catch (duplicateError) {
        console.error('PUT /api/system-fields - Erro ao verificar chave duplicada:', duplicateError);
      }
    }
    
    // Atualizar o campo
    try {
      console.log(`PUT /api/system-fields - Atualizando campo: ${name} (${key})`);
      const updatedField = await (prisma as any).system_fields.update({
        where: {
          id
        },
        data: {
          name,
          key,
          type,
          required,
          editable,
          options: options || [],
          group: group || 'Informações Gerais',
          description,
          updatedAt: new Date()
        }
      });
      
      console.log(`PUT /api/system-fields - Campo atualizado com sucesso: ${updatedField.id}`);
      return NextResponse.json(updatedField);
    } catch (updateError) {
      console.error('PUT /api/system-fields - Erro ao atualizar campo:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar campo no banco de dados' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('PUT /api/system-fields - Erro geral:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar campo do sistema' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um campo do sistema
export async function DELETE(request: NextRequest) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log(`DELETE /api/system-fields - Tentando excluir campo ${id} do workspace ${workspaceId}`);
    
    if (!id) {
      console.error('DELETE /api/system-fields - ID do campo não fornecido');
      return NextResponse.json(
        { error: 'ID do campo não fornecido' },
        { status: 400 }
      );
    }
    
    // Verificar se o campo existe
    let existingField;
    try {
      existingField = await (prisma as any).system_fields.findFirst({
        where: {
          id,
          workspaceId
        }
      });
      
      if (!existingField) {
        console.error(`DELETE /api/system-fields - Campo ${id} não encontrado no workspace ${workspaceId}`);
        return NextResponse.json(
          { error: 'Campo não encontrado' },
          { status: 404 }
        );
      }
      
      console.log(`DELETE /api/system-fields - Campo encontrado: ${existingField.name} (${existingField.key})`);
    } catch (findError) {
      console.error('DELETE /api/system-fields - Erro ao verificar existência do campo:', findError);
      return NextResponse.json(
        { error: 'Erro ao verificar existência do campo' },
        { status: 500 }
      );
    }
    
    // Verificar se é um campo padrão não editável
    if (!existingField.editable) {
      console.error(`DELETE /api/system-fields - Tentativa de excluir campo não editável: ${existingField.name}`);
      return NextResponse.json(
        { error: 'Este campo do sistema não pode ser excluído' },
        { status: 403 }
      );
    }
    
    // Excluir o campo
    try {
      await (prisma as any).system_fields.delete({
        where: {
          id
        }
      });
      
      console.log(`DELETE /api/system-fields - Campo ${existingField.name} excluído com sucesso`);
      return NextResponse.json({ success: true });
    } catch (deleteError) {
      console.error('DELETE /api/system-fields - Erro ao excluir campo:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao excluir campo no banco de dados' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('DELETE /api/system-fields - Erro geral:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir campo do sistema' },
      { status: 500 }
    );
  }
} 
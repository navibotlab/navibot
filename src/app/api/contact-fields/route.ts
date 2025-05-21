import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Schema para validação dos campos
const contactFieldSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["text", "number", "date", "select", "checkbox", "textarea"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  default_value: z.string().optional(),
  description: z.string().optional(),
  order: z.number().optional()
});

// Tipo para os campos de contato
type ContactField = {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[];
  placeholder?: string;
  default_value?: string;
  description?: string;
  order: number;
  created_at: string;
  updated_at: string;
};

// Array temporário para armazenar os campos (simulando o banco de dados)
// Nota: Isso será perdido quando o servidor for reiniciado
let contactFields: ContactField[] = [];

// Função auxiliar para verificar autenticação (simplificada para desenvolvimento)
async function checkAuth(req: NextRequest): Promise<boolean> {
  // Em um ambiente de produção, você deve implementar uma verificação de autenticação adequada
  // Por enquanto, vamos permitir todas as solicitações para facilitar o desenvolvimento
  return true;
}

// GET - Listar todos os campos de contato
export async function GET(req: NextRequest) {
  try {
    const isAuthenticated = await checkAuth(req);
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Ordenar os campos por ordem
    const sortedFields = [...contactFields].sort((a, b) => a.order - b.order);
    
    return NextResponse.json(sortedFields);
  } catch (error) {
    console.error('Erro ao buscar campos de contato:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar um novo campo de contato
export async function POST(req: NextRequest) {
  try {
    const isAuthenticated = await checkAuth(req);
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const body = await req.json();
    
    // Validar os dados recebidos
    const validationResult = contactFieldSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const fieldData = validationResult.data;
    
    // Obter o maior valor de order para adicionar o novo campo no final
    const maxOrderField = contactFields.length > 0 
      ? contactFields.reduce((prev, current) => (prev.order > current.order) ? prev : current) 
      : null;
    
    const nextOrder = maxOrderField ? maxOrderField.order + 1 : 1;
    
    // Criar o novo campo
    const now = new Date().toISOString();
    const newField: ContactField = {
      id: uuidv4(),
      ...fieldData,
      order: fieldData.order || nextOrder,
      created_at: now,
      updated_at: now
    };
    
    // Adicionar ao array
    contactFields.push(newField);
    
    return NextResponse.json(newField, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar campo de contato:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Atualizar um campo de contato existente
export async function PUT(req: NextRequest) {
  try {
    const isAuthenticated = await checkAuth(req);
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const body = await req.json();
    const { id, ...fieldData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID do campo é obrigatório' }, { status: 400 });
    }
    
    // Validar os dados recebidos
    const validationResult = contactFieldSchema.safeParse(fieldData);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    // Verificar se o campo existe
    const fieldIndex = contactFields.findIndex(field => field.id === id);
    
    if (fieldIndex === -1) {
      return NextResponse.json({ error: 'Campo não encontrado' }, { status: 404 });
    }
    
    // Atualizar o campo
    const updatedField: ContactField = {
      ...contactFields[fieldIndex],
      ...validationResult.data,
      updated_at: new Date().toISOString()
    };
    
    contactFields[fieldIndex] = updatedField;
    
    return NextResponse.json(updatedField);
  } catch (error) {
    console.error('Erro ao atualizar campo de contato:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Remover um campo de contato
export async function DELETE(req: NextRequest) {
  try {
    const isAuthenticated = await checkAuth(req);
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID do campo é obrigatório' }, { status: 400 });
    }
    
    // Verificar se o campo existe
    const fieldIndex = contactFields.findIndex(field => field.id === id);
    
    if (fieldIndex === -1) {
      return NextResponse.json({ error: 'Campo não encontrado' }, { status: 404 });
    }
    
    // Excluir o campo
    contactFields.splice(fieldIndex, 1);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir campo de contato:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 
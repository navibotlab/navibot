import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Interface para o objeto Permission
interface Permission {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  defaultValue: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schema de validação para criação de permissão
const createPermissionSchema = z.object({
  key: z.string().min(3, { message: 'A chave da permissão deve ter pelo menos 3 caracteres' }),
  name: z.string().min(3, { message: 'O nome da permissão deve ter pelo menos 3 caracteres' }),
  description: z.string().optional(),
  category: z.string().min(2, { message: 'A categoria deve ter pelo menos 2 caracteres' }),
  subcategory: z.string().optional(),
  defaultValue: z.boolean().default(false)
});

// GET: Listar todas as permissões
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o usuário é admin ou owner
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
    }

    // Obter todas as permissões
    const permissions = await prisma.$queryRaw<Permission[]>`
      SELECT * FROM permissions 
      ORDER BY category ASC, subcategory ASC, name ASC
    `;

    // Agrupar permissões por categoria e subcategoria
    const groupedPermissions = permissions.reduce((acc: Record<string, Record<string, Permission[]>>, permission: Permission) => {
      const { category, subcategory } = permission;
      
      if (!acc[category]) {
        acc[category] = {};
      }
      
      const subCat = subcategory || 'default';
      if (!acc[category][subCat]) {
        acc[category][subCat] = [];
      }
      
      acc[category][subCat].push(permission);
      return acc;
    }, {});

    return NextResponse.json(groupedPermissions);
  } catch (error) {
    console.error('Erro ao listar permissões:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST: Criar uma nova permissão
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o usuário é owner (apenas owners podem criar permissões)
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Apenas proprietários podem criar permissões' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validar os dados recebidos
    const validationResult = createPermissionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    const { key, name, description, category, subcategory, defaultValue } = validationResult.data;

    // Verificar se já existe uma permissão com a mesma chave
    const existingPermission = await prisma.$queryRaw<Permission[]>`
      SELECT * FROM permissions WHERE key = ${key} LIMIT 1
    `;

    if (existingPermission.length > 0) {
      return NextResponse.json({ error: 'Já existe uma permissão com esta chave' }, { status: 409 });
    }

    // Criar a permissão
    const permission = await prisma.$executeRaw`
      INSERT INTO permissions (id, key, name, description, category, subcategory, "defaultValue", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${key}, ${name}, ${description}, ${category}, ${subcategory}, ${defaultValue}, NOW(), NOW())
      RETURNING *
    `;

    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar permissão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
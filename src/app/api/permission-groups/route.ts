import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Interface para o objeto PermissionGroup
interface PermissionGroup {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isCustom: boolean;
  workspaceId: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

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
  enabled?: boolean; // Campo adicional para quando retornamos permissões de um grupo
}

// Interface para PermissionGroupWithPermissions
interface PermissionGroupWithPermissions extends PermissionGroup {
  permissions: Permission[];
}

// Schema de validação para criação de grupo de permissões
const createPermissionGroupSchema = z.object({
  name: z.string().min(3, { message: 'O nome do grupo deve ter pelo menos 3 caracteres' }),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  isCustom: z.boolean().default(false),
  permissionIds: z.array(z.string()).optional()
});

// GET: Listar todos os grupos de permissões do workspace atual
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o usuário é admin ou owner
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true, workspaceId: true }
    });

    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
    }

    const workspaceId = user.workspaceId;

    // Obter todos os grupos de permissões do workspace
    const permissionGroups = await prisma.$queryRaw<PermissionGroup[]>`
      SELECT * FROM permission_groups 
      WHERE "workspaceId" = ${workspaceId}
      ORDER BY name ASC
    `;

    // Para cada grupo, buscar suas permissões
    const groupsWithPermissions: PermissionGroupWithPermissions[] = [];

    for (const group of permissionGroups) {
      // Buscar todas as permissões deste grupo
      const permissions = await prisma.$queryRaw<Permission[]>`
        SELECT p.*, pgi.enabled
        FROM permissions p
        JOIN permission_group_items pgi ON p.id = pgi."permissionId"
        WHERE pgi."permissionGroupId" = ${group.id}
        ORDER BY p.category ASC, p.subcategory ASC, p.name ASC
      `;

      groupsWithPermissions.push({
        ...group,
        permissions
      });
    }

    return NextResponse.json(groupsWithPermissions);
  } catch (error) {
    console.error('Erro ao listar grupos de permissões:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST: Criar um novo grupo de permissões
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o usuário é admin ou owner
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true, workspaceId: true, id: true }
    });

    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validar os dados recebidos
    const validationResult = createPermissionGroupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    const { name, description, isDefault, isCustom, permissionIds } = validationResult.data;
    const workspaceId = user.workspaceId;
    const createdBy = user.id;

    // Verificar se já existe um grupo com o mesmo nome no workspace
    const existingGroup = await prisma.$queryRaw<PermissionGroup[]>`
      SELECT * FROM permission_groups 
      WHERE name = ${name} AND "workspaceId" = ${workspaceId}
      LIMIT 1
    `;

    if (existingGroup.length > 0) {
      return NextResponse.json({ error: 'Já existe um grupo com este nome' }, { status: 409 });
    }

    // Criar o grupo
    const newGroupId = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO permission_groups (id, name, description, "isDefault", "isCustom", "workspaceId", "createdBy", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${name}, ${description}, ${isDefault}, ${isCustom}, ${workspaceId}, ${createdBy}, NOW(), NOW())
      RETURNING id
    `;

    const groupId = newGroupId[0]?.id;

    if (!groupId) {
      return NextResponse.json({ error: 'Erro ao criar grupo de permissões' }, { status: 500 });
    }

    // Se foram enviados IDs de permissões, adicionar ao grupo
    if (permissionIds && permissionIds.length > 0) {
      // Adicionamos cada permissão individualmente
      for (const permissionId of permissionIds) {
        await prisma.$executeRaw`
          INSERT INTO permission_group_items (id, "permissionGroupId", "permissionId", enabled, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${groupId}, ${permissionId}, true, NOW(), NOW())
        `;
      }
    }

    // Retornar o grupo criado com suas permissões
    const newGroup = await prisma.$queryRaw<PermissionGroup[]>`
      SELECT * FROM permission_groups WHERE id = ${groupId}
    `;

    const permissions = await prisma.$queryRaw<Permission[]>`
      SELECT p.*, pgi.enabled
      FROM permissions p
      JOIN permission_group_items pgi ON p.id = pgi."permissionId"
      WHERE pgi."permissionGroupId" = ${groupId}
      ORDER BY p.category ASC, p.subcategory ASC, p.name ASC
    `;

    return NextResponse.json({
      ...newGroup[0],
      permissions
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar grupo de permissões:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
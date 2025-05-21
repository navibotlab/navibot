import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

/**
 * Endpoint para adicionar grupos de permissões predefinidos ao banco de dados.
 * Acesse via GET /api/seed-permissions
 */

interface Permission {
  key: string;
  enabled: boolean;
}

// Tipo para os resultados das consultas raw
interface PermissionEntity {
  id: string;
  key: string;
  name: string;
}

// Instanciar Prisma com tipagem explícita
const prisma = new PrismaClient();

async function seedPermissionGroups() {
  try {
    console.log('Iniciando seed de grupos de permissões...');

    // Grupos de permissões predefinidos
    const permissionGroups = [
      {
        name: 'Owner',
        description: 'Acesso completo a todas as funcionalidades do sistema',
        isDefault: true,
        isCustom: false,
      },
      {
        name: 'Admin',
        description: 'Acesso administrativo com gerenciamento de usuários e recursos',
        isDefault: true,
        isCustom: false,
      },
      {
        name: 'User',
        description: 'Acesso básico para operações diárias',
        isDefault: true,
        isCustom: false,
      }
    ];

    // Permissões para cada grupo
    const permissionsMap = {
      Owner: {
        users: {
          view: true,
          create: true,
          update: true,
          delete: true,
          manage: true
        },
        leads: {
          view: true,
          create: true,
          update: true,
          delete: true
        },
        conversations: {
          view: true,
          reply: true,
          delete: true
        },
        agents: {
          view: true,
          create: true,
          update: true,
          delete: true
        },
        settings: {
          view: true,
          update: true
        },
        billing: {
          view: true,
          update: true
        }
      },
      Admin: {
        users: {
          view: true,
          create: true,
          update: true,
          delete: true,
          manage: false
        },
        leads: {
          view: true,
          create: true,
          update: true,
          delete: true
        },
        conversations: {
          view: true,
          reply: true,
          delete: true
        },
        agents: {
          view: true,
          create: true,
          update: true,
          delete: true
        },
        settings: {
          view: true,
          update: true
        },
        billing: {
          view: true,
          update: false
        }
      },
      User: {
        users: {
          view: true,
          create: false,
          update: false,
          delete: false,
          manage: false
        },
        leads: {
          view: true,
          create: true,
          update: true,
          delete: false
        },
        conversations: {
          view: true,
          reply: true,
          delete: false
        },
        agents: {
          view: true,
          create: false,
          update: false,
          delete: false
        },
        settings: {
          view: true,
          update: false
        },
        billing: {
          view: true,
          update: false
        }
      }
    };

    // Função para converter permissões em uma lista plana de itens
    function flattenPermissions(permissions: Record<string, any>, prefix = ''): Permission[] {
      return Object.entries(permissions).flatMap(([key, value]) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'boolean') {
          return [{ key: newKey, enabled: value }];
        }
        
        return flattenPermissions(value as Record<string, any>, newKey);
      });
    }

    // Obter workspace para associar os grupos (por padrão usamos o primeiro)
    const workspace = await prisma.workspace.findFirst();
    
    if (!workspace) {
      throw new Error('Nenhum workspace encontrado');
    }

    // Obter todas as permissões disponíveis no sistema
    const allPermissions = await prisma.$queryRaw<PermissionEntity[]>`SELECT * FROM permissions`;
    
    const results = [];
    
    // Criar grupos de permissões e suas permissões
    for (const group of permissionGroups) {
      console.log(`Criando grupo de permissões: ${group.name}`);
      
      // Verificar se o grupo já existe
      const existingGroups = await prisma.$queryRaw`
        SELECT * FROM permission_groups 
        WHERE name = ${group.name} 
        AND "isDefault" = ${group.isDefault}
        AND "workspaceId" = ${workspace.id}
      `;
      
      const existingGroupArray = existingGroups as any[];
      
      if (existingGroupArray.length > 0) {
        console.log(`Grupo ${group.name} já existe, atualizando...`);
        
        const existingGroup = existingGroupArray[0];
        // Atualizar grupo existente
        await prisma.$executeRaw`
          UPDATE permission_groups
          SET description = ${group.description}, "isCustom" = ${group.isCustom}
          WHERE id = ${existingGroup.id}
        `;
        
        const groupId = existingGroup.id;
        results.push(`Grupo ${group.name} atualizado`);
        
        // Verificar se o permissionsMap tem a chave correspondente ao grupo
        const permissionsForGroup = permissionsMap[group.name as keyof typeof permissionsMap];
        
        if (permissionsForGroup) {
          // Obter permissões em formato plano
          const flatPermissions = flattenPermissions(permissionsForGroup);
          
          // Atualizar permissões do grupo
          for (const perm of flatPermissions) {
            await updateGroupPermission(groupId, perm, allPermissions);
          }
        }
      } else {
        // Criar novo grupo com um ID gerado
        const groupId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Criar novo grupo
        await prisma.$executeRaw`
          INSERT INTO permission_groups (id, name, description, "isDefault", "isCustom", "workspaceId", "createdAt", "updatedAt")
          VALUES (${groupId}, ${group.name}, ${group.description}, ${group.isDefault}, ${group.isCustom}, ${workspace.id}, NOW(), NOW())
        `;
        
        results.push(`Grupo ${group.name} criado`);
        
        // Verificar se o permissionsMap tem a chave correspondente ao grupo
        const permissionsForGroup = permissionsMap[group.name as keyof typeof permissionsMap];
        
        if (permissionsForGroup) {
          // Obter permissões em formato plano
          const flatPermissions = flattenPermissions(permissionsForGroup);
          
          // Atualizar permissões do grupo
          for (const perm of flatPermissions) {
            await updateGroupPermission(groupId, perm, allPermissions);
          }
        }
      }
    }
    
    console.log('Seed de grupos de permissões concluído com sucesso!');
    return results;
  } finally {
    // Fechar a conexão do Prisma ao finalizar
    await prisma.$disconnect();
  }
}

// Função auxiliar para atualizar as permissões de um grupo
async function updateGroupPermission(
  groupId: string, 
  perm: Permission, 
  allPermissions: PermissionEntity[]
) {
  // Encontrar ID da permissão pelo nome
  const permissionEntity = allPermissions.find((p) => p.key === perm.key);
  
  if (permissionEntity) {
    // Verificar se o item de permissão já existe
    const existingItems = await prisma.$queryRaw`
      SELECT * FROM permission_group_items
      WHERE "permissionGroupId" = ${groupId}
      AND "permissionId" = ${permissionEntity.id}
    `;
    
    const existingItemArray = existingItems as any[];
    
    if (existingItemArray.length > 0) {
      const existingItem = existingItemArray[0];
      // Atualizar item existente
      await prisma.$executeRaw`
        UPDATE permission_group_items
        SET enabled = ${perm.enabled}
        WHERE id = ${existingItem.id}
      `;
    } else {
      // Gerar um ID único para o novo item
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Criar novo item
      await prisma.$executeRaw`
        INSERT INTO permission_group_items ("id", "permissionGroupId", "permissionId", enabled, "createdAt", "updatedAt")
        VALUES (${itemId}, ${groupId}, ${permissionEntity.id}, ${perm.enabled}, NOW(), NOW())
      `;
    }
  } else {
    console.warn(`Permissão ${perm.key} não encontrada no banco de dados`);
  }
}

export async function GET() {
  try {
    // Executar o seed
    const results = await seedPermissionGroups();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Grupos de permissões criados com sucesso',
      details: results
    });
  } catch (error: any) {
    console.error('Erro durante o seed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao criar grupos de permissões',
        error: error.message 
      },
      { status: 500 }
    );
  }
} 
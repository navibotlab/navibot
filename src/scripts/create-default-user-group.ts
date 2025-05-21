import { PrismaClient } from '@prisma/client';

/**
 * Script para adicionar o grupo de permissão padrão "Usuário Padrão" ao banco de dados.
 * Execute com: npx ts-node --compiler-options {\"module\":\"CommonJS\"} src/scripts/create-default-user-group.ts
 */

interface Permission {
  key: string;
  enabled: boolean;
}

// Instanciando o prisma diretamente para evitar problemas com o tipo
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando criação do grupo de permissão padrão "Usuário Padrão"...');

  try {
    // Obter todos os workspaces
    const workspaces = await prisma.workspace.findMany();
    
    if (workspaces.length === 0) {
      console.log('Nenhum workspace encontrado. O script não pode continuar.');
      return;
    }

    // Permissões padrão para usuários comuns
    const defaultPermissions = {
      dashboard: { view: true },
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
      users: {
        view: true,
        create: false,
        update: false,
        delete: false,
        manage: false
      },
      settings: {
        view: false,
        update: false
      },
      billing: {
        view: false,
        update: false
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

    // Buscar todas as permissões disponíveis
    const allPermissions = await prisma.$queryRaw`SELECT * FROM "permissions"` as any[];
    
    if (allPermissions.length === 0) {
      console.log('Nenhuma permissão encontrada no banco de dados.');
      return;
    }

    console.log(`${allPermissions.length} permissões encontradas no banco de dados.`);

    // Processar cada workspace
    for (const workspace of workspaces) {
      console.log(`Processando workspace: ${workspace.id} - ${workspace.name}`);

      // Verificar se o grupo já existe
      const existingGroup = await prisma.$queryRaw`
        SELECT * FROM "permission_groups"
        WHERE name = 'Usuário Padrão' AND "workspaceId" = ${workspace.id}
        LIMIT 1
      ` as any[];
      
      if (existingGroup && existingGroup.length > 0) {
        const groupData = existingGroup[0];
        console.log(`Grupo "Usuário Padrão" já existe para o workspace ${workspace.id}. Atualizando...`);
        
        // Atualizar o grupo existente
        await prisma.$executeRaw`
          UPDATE "permission_groups"
          SET description = 'Permissões padrão para usuários comuns',
              "isDefault" = true,
              "isCustom" = false
          WHERE id = ${groupData.id}
        `;

        // Obter permissões em formato plano
        const flatPermissions = flattenPermissions(defaultPermissions);
        
        // Atualizar permissões do grupo
        for (const perm of flatPermissions) {
          // Encontrar ID da permissão pelo nome
          const permissionEntity = allPermissions.find(p => p.key === perm.key);
          
          if (permissionEntity) {
            // Verificar se o item de permissão já existe
            const existingItem = await prisma.$queryRaw`
              SELECT * FROM "permission_group_items"
              WHERE "permissionGroupId" = ${groupData.id} AND "permissionId" = ${permissionEntity.id}
              LIMIT 1
            ` as any[];
            
            if (existingItem && existingItem.length > 0) {
              // Atualizar item existente
              await prisma.$executeRaw`
                UPDATE "permission_group_items"
                SET enabled = ${perm.enabled}
                WHERE id = ${existingItem[0].id}
              `;
            } else {
              // Criar novo item
              await prisma.$executeRaw`
                INSERT INTO "permission_group_items" ("id", "permissionGroupId", "permissionId", enabled, "createdAt", "updatedAt")
                VALUES (${`item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`}, ${groupData.id}, ${permissionEntity.id}, ${perm.enabled}, NOW(), NOW())
              `;
            }
          } else {
            console.warn(`Permissão ${perm.key} não encontrada no banco de dados.`);
          }
        }
      } else {
        console.log(`Criando grupo "Usuário Padrão" para o workspace ${workspace.id}...`);
        
        // Gerar um ID para o novo grupo
        const groupId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Criar novo grupo
        await prisma.$executeRaw`
          INSERT INTO "permission_groups" (id, name, description, "isDefault", "isCustom", "workspaceId", "createdAt", "updatedAt")
          VALUES (${groupId}, 'Usuário Padrão', 'Permissões padrão para usuários comuns', true, false, ${workspace.id}, NOW(), NOW())
        `;

        // Obter permissões em formato plano
        const flatPermissions = flattenPermissions(defaultPermissions);
        
        // Criar itens de permissão para o grupo
        for (const perm of flatPermissions) {
          // Encontrar ID da permissão pelo nome
          const permissionEntity = allPermissions.find(p => p.key === perm.key);
          
          if (permissionEntity) {
            // Gerar um ID para o novo item
            const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            
            await prisma.$executeRaw`
              INSERT INTO "permission_group_items" (id, "permissionGroupId", "permissionId", enabled, "createdAt", "updatedAt")
              VALUES (${itemId}, ${groupId}, ${permissionEntity.id}, ${perm.enabled}, NOW(), NOW())
            `;
          } else {
            console.warn(`Permissão ${perm.key} não encontrada no banco de dados.`);
          }
        }
      }
    }

    console.log('Criação do grupo de permissão padrão "Usuário Padrão" concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a execução do script:', error);
  }
}

main()
  .catch((e) => {
    console.error('Erro durante a execução:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
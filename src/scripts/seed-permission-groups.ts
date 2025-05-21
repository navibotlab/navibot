import { prisma } from '@/lib/prisma';

/**
 * Script para adicionar grupos de permissões predefinidos ao banco de dados.
 * Execute com: npx ts-node --compiler-options {\"module\":\"CommonJS\"} src/scripts/seed-permission-groups.ts
 */

interface Permission {
  key: string;
  enabled: boolean;
}

interface PermissionEntity {
  id: string;
  key: string;
  name: string;
}

interface PermissionGroupItem {
  id: string;
  permissionGroupId: string;
  permissionId: string;
  enabled: boolean;
}

async function main() {
  console.log('Iniciando seed de grupos de permissões...');

  // Grupos de permissões predefinidos
  const permissionGroups = [
    {
      name: 'Administrador',
      description: 'Acesso completo a todas as funcionalidades do sistema',
      isDefault: true,
      isCustom: false,
    },
    {
      name: 'Gerente',
      description: 'Acesso a gerenciamento de usuários e conteúdos, sem configurações avançadas',
      isDefault: true,
      isCustom: false,
    },
    {
      name: 'Atendente',
      description: 'Acesso limitado às funcionalidades de atendimento e consulta',
      isDefault: true,
      isCustom: false,
    },
    {
      name: 'Visualizador',
      description: 'Acesso apenas para visualização de dados, sem permissão de edição',
      isDefault: true,
      isCustom: false,
    }
  ];

  // Permissões para cada grupo
  const permissionsMap = {
    Administrador: {
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
    Gerente: {
      users: {
        view: true,
        create: true,
        update: true,
        delete: false,
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
    },
    Atendente: {
      users: {
        view: false,
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
        view: false,
        update: false
      },
      billing: {
        view: false,
        update: false
      }
    },
    Visualizador: {
      users: {
        view: true,
        create: false,
        update: false,
        delete: false,
        manage: false
      },
      leads: {
        view: true,
        create: false,
        update: false,
        delete: false
      },
      conversations: {
        view: true,
        reply: false,
        delete: false
      },
      agents: {
        view: true,
        create: false,
        update: false,
        delete: false
      },
      settings: {
        view: false,
        update: false
      },
      billing: {
        view: false,
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

  // Verificar se os modelos existem no prisma
  try {
    console.log("Buscando permissões existentes...");
    const existingPerms = await prisma.$queryRaw`SELECT * FROM "permissions"`;
    console.log(`${(existingPerms as any[]).length} permissões encontradas.`);

    // Criar grupos de permissões e suas permissões
    for (const group of permissionGroups) {
      console.log(`Criando grupo de permissões: ${group.name}`);
      
      // Verificar se o grupo já existe
      const existingGroup = await prisma.$queryRaw`
        SELECT id, name, description, "isDefault", "isCustom"
        FROM "permission_groups"
        WHERE name = ${group.name} AND "isDefault" = true
        LIMIT 1
      `;
      
      const existingGroupArray = existingGroup as any[];
      
      if (existingGroupArray.length > 0) {
        const groupData = existingGroupArray[0];
        console.log(`Grupo ${group.name} já existe, atualizando...`);
        
        // Atualizar grupo existente
        await prisma.$executeRaw`
          UPDATE "permission_groups"
          SET description = ${group.description}, "isCustom" = ${group.isCustom}
          WHERE id = ${groupData.id}
        `;
        
        // Buscar todas as permissões disponíveis
        const allPermissionsRaw = await prisma.$queryRaw`SELECT * FROM "permissions"`;
        const allPermissions = allPermissionsRaw as any[];
        
        // Verificar se o permissionsMap tem a chave correspondente ao grupo
        const permissionsForGroup = permissionsMap[group.name as keyof typeof permissionsMap];
        
        if (permissionsForGroup) {
          // Obter permissões em formato plano
          const flatPermissions = flattenPermissions(permissionsForGroup);
          
          // Atualizar permissões do grupo
          for (const perm of flatPermissions) {
            // Encontrar ID da permissão pelo nome
            const permissionEntity = allPermissions.find(p => p.key === perm.key);
            
            if (permissionEntity) {
              // Verificar se o item de permissão já existe
              const existingItem = await prisma.$queryRaw`
                SELECT id, "permissionGroupId", "permissionId", enabled
                FROM "permission_group_items"
                WHERE "permissionGroupId" = ${groupData.id} AND "permissionId" = ${permissionEntity.id}
                LIMIT 1
              ` as unknown as PermissionGroupItem[];
              
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
                  INSERT INTO "permission_group_items" ("permissionGroupId", "permissionId", enabled)
                  VALUES (${groupData.id}, ${permissionEntity.id}, ${perm.enabled})
                `;
              }
            } else {
              console.warn(`Permissão ${perm.key} não encontrada no banco de dados`);
            }
          }
        }
      } else {
        // Criar novo grupo
        const newGroup = await prisma.$executeRaw`
          INSERT INTO "permission_groups" (name, description, "isDefault", "isCustom")
          VALUES (${group.name}, ${group.description}, ${group.isDefault}, ${group.isCustom})
          RETURNING id
        `;
        
        const newGroupId = (newGroup as any).id || "";
        
        // Buscar todas as permissões disponíveis
        const allPermissionsRaw = await prisma.$queryRaw`SELECT * FROM "permissions"`;
        const allPermissions = allPermissionsRaw as any[];
        
        // Verificar se o permissionsMap tem a chave correspondente ao grupo
        const permissionsForGroup = permissionsMap[group.name as keyof typeof permissionsMap];
        
        if (permissionsForGroup && newGroupId) {
          // Obter permissões em formato plano
          const flatPermissions = flattenPermissions(permissionsForGroup);
          
          // Criar itens de permissão para o grupo
          for (const perm of flatPermissions) {
            // Encontrar ID da permissão pelo nome
            const permissionEntity = allPermissions.find(p => p.key === perm.key);
            
            if (permissionEntity) {
              await prisma.$executeRaw`
                INSERT INTO "permission_group_items" ("permissionGroupId", "permissionId", enabled)
                VALUES (${newGroupId}, ${permissionEntity.id}, ${perm.enabled})
              `;
            } else {
              console.warn(`Permissão ${perm.key} não encontrada no banco de dados`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Erro ao acessar os modelos do Prisma:', error);
    console.log('Verifique se os modelos PermissionGroup, Permission e permission_group_items existem no schema.prisma');
  }
  
  console.log('Seed de grupos de permissões concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
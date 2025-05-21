const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lista de novas permissões para o CRM
const crmPermissions = [
  // Permissões de stages
  {
    key: 'crm.stages.view',
    name: 'Ver estágios do funil',
    description: 'Permite visualizar os estágios do funil de vendas',
    category: 'CRM',
    subcategory: 'Estágios',
    defaultValue: true
  },
  {
    key: 'crm.stages.create',
    name: 'Criar estágios do funil',
    description: 'Permite criar novos estágios no funil de vendas',
    category: 'CRM',
    subcategory: 'Estágios',
    defaultValue: false
  },
  {
    key: 'crm.stages.update',
    name: 'Atualizar estágios do funil',
    description: 'Permite editar estágios existentes no funil de vendas',
    category: 'CRM',
    subcategory: 'Estágios',
    defaultValue: false
  },
  {
    key: 'crm.stages.delete',
    name: 'Excluir estágios do funil',
    description: 'Permite remover estágios do funil de vendas',
    category: 'CRM',
    subcategory: 'Estágios',
    defaultValue: false
  },

  // Permissões de grupos de origem
  {
    key: 'crm.origin_groups.view',
    name: 'Ver grupos de origem',
    description: 'Permite visualizar os grupos de origem dos leads',
    category: 'CRM',
    subcategory: 'Grupos de Origem',
    defaultValue: true
  },
  {
    key: 'crm.origin_groups.create',
    name: 'Criar grupos de origem',
    description: 'Permite criar novos grupos de origem',
    category: 'CRM',
    subcategory: 'Grupos de Origem',
    defaultValue: false
  },
  {
    key: 'crm.origin_groups.update',
    name: 'Atualizar grupos de origem',
    description: 'Permite editar grupos de origem existentes',
    category: 'CRM',
    subcategory: 'Grupos de Origem',
    defaultValue: false
  },
  {
    key: 'crm.origin_groups.delete',
    name: 'Excluir grupos de origem',
    description: 'Permite remover grupos de origem',
    category: 'CRM',
    subcategory: 'Grupos de Origem',
    defaultValue: false
  },

  // Permissões de tarefas
  {
    key: 'crm.tasks.view',
    name: 'Ver tarefas',
    description: 'Permite visualizar tarefas do CRM',
    category: 'CRM',
    subcategory: 'Tarefas',
    defaultValue: true
  },
  {
    key: 'crm.tasks.create',
    name: 'Criar tarefas',
    description: 'Permite criar novas tarefas no CRM',
    category: 'CRM',
    subcategory: 'Tarefas',
    defaultValue: true
  },
  {
    key: 'crm.tasks.update',
    name: 'Atualizar tarefas',
    description: 'Permite editar tarefas existentes',
    category: 'CRM',
    subcategory: 'Tarefas',
    defaultValue: true
  },
  {
    key: 'crm.tasks.delete',
    name: 'Excluir tarefas',
    description: 'Permite remover tarefas',
    category: 'CRM',
    subcategory: 'Tarefas',
    defaultValue: false
  },
  {
    key: 'crm.tasks.assign',
    name: 'Atribuir tarefas',
    description: 'Permite atribuir tarefas a outros usuários',
    category: 'CRM',
    subcategory: 'Tarefas',
    defaultValue: false
  },

  // Permissões de notas
  {
    key: 'crm.notes.view',
    name: 'Ver notas',
    description: 'Permite visualizar notas de leads',
    category: 'CRM',
    subcategory: 'Notas',
    defaultValue: true
  },
  {
    key: 'crm.notes.create',
    name: 'Criar notas',
    description: 'Permite adicionar novas notas aos leads',
    category: 'CRM',
    subcategory: 'Notas',
    defaultValue: true
  },
  {
    key: 'crm.notes.update',
    name: 'Editar notas',
    description: 'Permite editar notas existentes',
    category: 'CRM',
    subcategory: 'Notas',
    defaultValue: true
  },
  {
    key: 'crm.notes.delete',
    name: 'Excluir notas',
    description: 'Permite remover notas',
    category: 'CRM',
    subcategory: 'Notas',
    defaultValue: false
  },

  // Permissões avançadas de leads
  {
    key: 'crm.leads.change_stage',
    name: 'Alterar estágio de leads',
    description: 'Permite mover leads entre estágios do funil',
    category: 'CRM',
    subcategory: 'Leads',
    defaultValue: true
  },
  {
    key: 'crm.leads.change_owner',
    name: 'Alterar proprietário de leads',
    description: 'Permite atribuir leads a outros usuários',
    category: 'CRM',
    subcategory: 'Leads',
    defaultValue: false
  },
  {
    key: 'crm.leads.change_origin',
    name: 'Alterar origem de leads',
    description: 'Permite alterar o grupo de origem dos leads',
    category: 'CRM',
    subcategory: 'Leads',
    defaultValue: false
  },
  {
    key: 'crm.leads.view_all',
    name: 'Ver todos os leads',
    description: 'Permite visualizar todos os leads do workspace',
    category: 'CRM',
    subcategory: 'Leads',
    defaultValue: false
  },
  {
    key: 'crm.leads.view_own',
    name: 'Ver leads próprios',
    description: 'Permite visualizar apenas leads atribuídos ao usuário',
    category: 'CRM',
    subcategory: 'Leads',
    defaultValue: true
  }
];

async function main() {
  console.log('Iniciando adição de permissões do CRM...');
  
  try {
    // Adicionar cada permissão se não existir
    for (const perm of crmPermissions) {
      const existingPerm = await prisma.permission.findUnique({
        where: { key: perm.key }
      });
      
      if (!existingPerm) {
        await prisma.permission.create({
          data: perm
        });
        console.log(`Permissão criada: ${perm.key}`);
      } else {
        console.log(`Permissão já existe: ${perm.key}`);
      }
    }
    
    console.log('Atualizando grupos de permissão padrão...');
    
    // Buscar grupos padrão
    const defaultGroups = await prisma.permissionGroup.findMany({
      where: { isDefault: true }
    });
    
    // Para cada grupo, atribuir as permissões adequadas
    for (const group of defaultGroups) {
      console.log(`Atualizando grupo: ${group.name}`);
      
      // Buscar todas as permissões do CRM
      const permissions = await prisma.permission.findMany({
        where: { category: 'CRM' }
      });
      
      // Com base no papel do grupo, atribuir permissões
      for (const perm of permissions) {
        let enabled = false;
        
        // Admin e Owner têm todas as permissões
        if (group.name === 'Owner' || group.name === 'Admin') {
          enabled = true;
        } 
        // Gerente tem a maioria das permissões, exceto algumas administrativas
        else if (group.name === 'Gerente') {
          enabled = !perm.key.includes('delete') && 
                   !perm.key.includes('crm.stages.create') && 
                   !perm.key.includes('crm.stages.update') &&
                   !perm.key.includes('crm.origin_groups.create') &&
                   !perm.key.includes('crm.origin_groups.update');
          
          // Gerentes podem ver todos os leads
          if (perm.key === 'crm.leads.view_all') {
            enabled = true;
          }
        } 
        // Atendente tem permissões limitadas
        else if (group.name === 'Atendente' || group.name === 'User') {
          // Permissões básicas para atendentes
          enabled = perm.key.includes('view') || 
                   perm.key.includes('crm.notes.create') ||
                   perm.key.includes('crm.tasks.create') ||
                   perm.key.includes('crm.leads.change_stage');
                   
          // Atendentes não podem alterar proprietários ou origens
          if (perm.key.includes('change_owner') || perm.key.includes('change_origin')) {
            enabled = false;
          }
          
          // Atendentes só veem seus próprios leads
          if (perm.key === 'crm.leads.view_all') {
            enabled = false;
          }
          if (perm.key === 'crm.leads.view_own') {
            enabled = true;
          }
        }
        // Visualizador tem apenas permissões de leitura
        else if (group.name === 'Visualizador') {
          enabled = perm.key.includes('view');
          
          // Visualizadores não podem ver todos os leads
          if (perm.key === 'crm.leads.view_all') {
            enabled = false;
          }
        }
        
        // Verificar se o item já existe
        const existingItem = await prisma.permissionGroupItem.findFirst({
          where: {
            permissionGroupId: group.id,
            permissionId: perm.id
          }
        });
        
        if (existingItem) {
          // Atualizar item existente
          await prisma.permissionGroupItem.update({
            where: { id: existingItem.id },
            data: { enabled }
          });
        } else {
          // Criar novo item
          await prisma.permissionGroupItem.create({
            data: {
              permissionGroupId: group.id,
              permissionId: perm.id,
              enabled
            }
          });
        }
      }
    }
    
    console.log('Permissões do CRM adicionadas com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar permissões:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error('Erro durante a execução do script:', e);
    process.exit(1);
  }); 
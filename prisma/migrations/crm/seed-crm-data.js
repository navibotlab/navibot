const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Estágios padrão para o funil de vendas
const defaultStages = [
  {
    name: 'Entrada do Lead',
    description: 'Leads recém-adicionados ao sistema',
    color: '#3498db',
    order: 1
  },
  {
    name: 'Prospecção',
    description: 'Leads em processo de prospecção',
    color: '#f39c12',
    order: 2
  },
  {
    name: 'Conectados',
    description: 'Leads que já estabeleceram contato',
    color: '#9b59b6',
    order: 3
  },
  {
    name: 'Desinteressados',
    description: 'Leads que demonstraram desinteresse',
    color: '#e74c3c',
    order: 4
  },
  {
    name: 'Sem Contato',
    description: 'Leads que não responderam às tentativas de contato',
    color: '#7f8c8d',
    order: 5
  },
  {
    name: 'Aguardando',
    description: 'Leads que estão aguardando algum processamento ou decisão',
    color: '#f1c40f',
    order: 6
  },
  {
    name: 'Fechado',
    description: 'Negócios finalizados (ganhos ou perdidos)',
    color: '#2ecc71',
    order: 7
  }
];

// Grupos de origem padrão
const defaultOriginGroups = [
  {
    name: 'WhatsApp',
    description: 'Leads que entraram via WhatsApp',
    color: '#25D366',
    order: 1
  },
  {
    name: 'Website',
    description: 'Leads que vieram do site da empresa',
    color: '#3498db',
    order: 2
  },
  {
    name: 'Indicação',
    description: 'Leads que vieram por indicação de clientes',
    color: '#f1c40f',
    order: 3
  },
  {
    name: 'Redes Sociais',
    description: 'Leads que vieram de redes sociais',
    color: '#9b59b6',
    order: 4
  },
  {
    name: 'E-mail',
    description: 'Leads que entraram por e-mail',
    color: '#e74c3c',
    order: 5
  },
  {
    name: 'Outros',
    description: 'Leads de outras origens',
    color: '#95a5a6',
    order: 6
  }
];

async function main() {
  try {
    console.log('Iniciando criação de dados padrão para CRM...');
    
    // Buscar todos os workspaces
    const workspaces = await prisma.workspace.findMany();
    
    if (workspaces.length === 0) {
      console.log('Nenhum workspace encontrado. Nenhum dado será criado.');
      return;
    }
    
    // Para cada workspace, criar estágios e grupos de origem padrão
    for (const workspace of workspaces) {
      console.log(`Processando workspace: ${workspace.name} (ID: ${workspace.id})`);
      
      // Verificar se o workspace já tem estágios
      try {
        const existingStages = await prisma.stage.count({
          where: { workspaceId: workspace.id }
        });
        
        // Se não existirem estágios, criar os padrões
        if (existingStages === 0) {
          console.log(`Criando estágios padrão para workspace ${workspace.name}`);
          
          for (const stage of defaultStages) {
            await prisma.stage.create({
              data: {
                ...stage,
                workspaceId: workspace.id
              }
            });
          }
          
          console.log(`${defaultStages.length} estágios padrão criados para workspace ${workspace.name}`);
        } else {
          console.log(`Workspace ${workspace.name} já possui estágios. Pulando criação.`);
        }
      } catch (error) {
        console.error(`Erro ao verificar/criar estágios para workspace ${workspace.name}:`, error);
      }
      
      // Verificar se o workspace já tem grupos de origem
      try {
        const existingOriginGroups = await prisma.originGroup.count({
          where: { workspaceId: workspace.id }
        });
        
        // Se não existirem grupos de origem, criar os padrões
        if (existingOriginGroups === 0) {
          console.log(`Criando grupos de origem padrão para workspace ${workspace.name}`);
          
          for (const group of defaultOriginGroups) {
            await prisma.originGroup.create({
              data: {
                ...group,
                workspaceId: workspace.id
              }
            });
          }
          
          console.log(`${defaultOriginGroups.length} grupos de origem padrão criados para workspace ${workspace.name}`);
        } else {
          console.log(`Workspace ${workspace.name} já possui grupos de origem. Pulando criação.`);
        }
      } catch (error) {
        console.error(`Erro ao verificar/criar grupos de origem para workspace ${workspace.name}:`, error);
      }
    }
    
    console.log('Dados padrão para CRM criados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar dados padrão para CRM:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error('Erro durante a execução do script:', e);
    process.exit(1);
  }); 
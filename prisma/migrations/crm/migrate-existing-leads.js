const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando migração de leads existentes...');
    
    // Buscar todos os workspaces
    const workspaces = await prisma.workspace.findMany();
    
    for (const workspace of workspaces) {
      console.log(`Processando workspace: ${workspace.name} (ID: ${workspace.id})`);
      
      // Buscar o estágio "Novo Lead" para este workspace
      const defaultStage = await prisma.stage.findFirst({
        where: {
          workspaceId: workspace.id,
          name: 'Novo Lead'
        }
      });
      
      if (!defaultStage) {
        console.log(`Workspace ${workspace.name} não possui estágio "Novo Lead". Pulando.`);
        continue;
      }
      
      // Buscar o grupo de origem "Outros" para este workspace
      const defaultOrigin = await prisma.originGroup.findFirst({
        where: {
          workspaceId: workspace.id,
          name: 'Outros'
        }
      });
      
      if (!defaultOrigin) {
        console.log(`Workspace ${workspace.name} não possui grupo de origem "Outros". Pulando.`);
        continue;
      }
      
      // Buscar todos os leads deste workspace que não possuem estágio
      const leadsWithoutStage = await prisma.lead.findMany({
        where: {
          workspaceId: workspace.id,
          stageId: null
        }
      });
      
      console.log(`Encontrados ${leadsWithoutStage.length} leads sem estágio no workspace ${workspace.name}`);
      
      // Atualizar os leads com estágio padrão
      if (leadsWithoutStage.length > 0) {
        // Agrupar leads por fonte para atribuir grupos de origem adequados
        const leadsBySource = {};
        
        for (const lead of leadsWithoutStage) {
          const source = lead.source || 'unknown';
          if (!leadsBySource[source]) {
            leadsBySource[source] = [];
          }
          leadsBySource[source].push(lead);
        }
        
        // Buscar todos os grupos de origem disponíveis
        const allOriginGroups = await prisma.originGroup.findMany({
          where: { workspaceId: workspace.id }
        });
        
        // Mapear fontes para grupos de origem
        const sourceToOriginMap = {
          'whatsapp': allOriginGroups.find(g => g.name === 'WhatsApp')?.id || defaultOrigin.id,
          'web': allOriginGroups.find(g => g.name === 'Website')?.id || defaultOrigin.id,
          'website': allOriginGroups.find(g => g.name === 'Website')?.id || defaultOrigin.id,
          'facebook': allOriginGroups.find(g => g.name === 'Redes Sociais')?.id || defaultOrigin.id,
          'fb': allOriginGroups.find(g => g.name === 'Redes Sociais')?.id || defaultOrigin.id,
          'instagram': allOriginGroups.find(g => g.name === 'Redes Sociais')?.id || defaultOrigin.id,
          'ig': allOriginGroups.find(g => g.name === 'Redes Sociais')?.id || defaultOrigin.id,
          'email': allOriginGroups.find(g => g.name === 'E-mail')?.id || defaultOrigin.id,
          'indicacao': allOriginGroups.find(g => g.name === 'Indicação')?.id || defaultOrigin.id,
          'indicação': allOriginGroups.find(g => g.name === 'Indicação')?.id || defaultOrigin.id,
          'referral': allOriginGroups.find(g => g.name === 'Indicação')?.id || defaultOrigin.id,
          'unknown': defaultOrigin.id
        };
        
        // Para cada grupo de leads por fonte, atualizar com o estágio e origem adequados
        for (const [source, leads] of Object.entries(leadsBySource)) {
          const originGroupId = sourceToOriginMap[source.toLowerCase()] || defaultOrigin.id;
          
          console.log(`Atualizando ${leads.length} leads da fonte "${source}" para o grupo de origem "${originGroupId}" e estágio "${defaultStage.id}"`);
          
          // Atualizar os leads em lotes de 100 para evitar sobrecarga
          const batchSize = 100;
          for (let i = 0; i < leads.length; i += batchSize) {
            const batch = leads.slice(i, i + batchSize);
            
            await Promise.all(
              batch.map(lead => 
                prisma.lead.update({
                  where: { id: lead.id },
                  data: {
                    stageId: defaultStage.id,
                    originGroupId: originGroupId
                  }
                })
              )
            );
          }
        }
        
        console.log(`${leadsWithoutStage.length} leads atualizados no workspace ${workspace.name}`);
      }
    }
    
    console.log('Migração de leads existentes concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao migrar leads existentes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error('Erro durante a execução do script:', e);
    process.exit(1);
  }); 
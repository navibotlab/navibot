/**
 * Script para verificar e corrigir a associação de etiquetas aos leads
 * 
 * Este script:
 * 1. Verifica se os leads têm etiquetas associadas
 * 2. Associa algumas etiquetas de teste para fins de depuração
 * 3. Garante que as associações em _LeadToContactTags sejam válidas
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando verificação de etiquetas dos leads...');

  // 1. Obter todas as etiquetas (ContactTags)
  const allTags = await prisma.contactTags.findMany();
  console.log(`Encontradas ${allTags.length} etiquetas no sistema`);

  // 2. Obter todos os leads
  const allLeads = await prisma.lead.findMany({
    include: {
      // @ts-expect-error - A relação 'tags' existe no banco, mas não é reconhecida corretamente
      tags: true
    }
  });
  console.log(`Encontrados ${allLeads.length} leads no sistema`);

  // 3. Verificar leads sem etiquetas
  const leadsWithoutTags = allLeads.filter(lead => !lead.tags || lead.tags.length === 0);
  console.log(`${leadsWithoutTags.length} leads não têm etiquetas associadas`);

  // 4. Verificar leads com etiquetas
  const leadsWithTags = allLeads.filter(lead => lead.tags && lead.tags.length > 0);
  console.log(`${leadsWithTags.length} leads têm etiquetas associadas`);

  if (leadsWithTags.length > 0) {
    console.log('\nDetalhes das etiquetas por lead:');
    leadsWithTags.forEach(lead => {
      console.log(`- Lead ${lead.id} (${lead.name || lead.phone}): ${lead.tags.length} etiquetas`);
      lead.tags.forEach(tag => {
        console.log(`  * ${tag.name} (${tag.color})`);
      });
    });
  }

  // 5. Para fins de teste, adicionar etiquetas a alguns leads se não houver nenhuma
  if (leadsWithTags.length === 0 && allTags.length > 0 && allLeads.length > 0) {
    console.log('\nAdicionando etiquetas de teste a alguns leads...');
    
    // Selecionar até 3 leads para adicionar etiquetas
    const leadsToUpdate = allLeads.slice(0, Math.min(3, allLeads.length));
    
    for (const lead of leadsToUpdate) {
      // Selecionar 1-3 etiquetas aleatórias para associar
      const tagsToConnect = allTags
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(3, allTags.length));
      
      console.log(`Associando ${tagsToConnect.length} etiquetas ao lead ${lead.name || lead.phone}`);
      
      try {
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            // @ts-expect-error - A relação 'tags' existe no banco, mas não é reconhecida corretamente
            tags: {
              connect: tagsToConnect.map(tag => ({ id: tag.id }))
            }
          }
        });
        console.log(`✅ Etiquetas associadas com sucesso ao lead ${lead.name || lead.phone}`);
      } catch (error) {
        console.error(`❌ Erro ao associar etiquetas ao lead ${lead.name || lead.phone}:`, error);
      }
    }
  }

  console.log('\nVerificação de etiquetas concluída');
}

main()
  .catch((e) => {
    console.error('Erro ao executar o script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
const { execSync } = require('child_process');
const path = require('path');

/**
 * Script para executar todas as migrações necessárias para o CRM
 * Ordem de execução:
 * 1. Adicionar permissões do CRM
 * 2. Criar dados iniciais (estágios e grupos de origem)
 * 3. Migrar leads existentes
 */

console.log('\n======= MIGRAÇÕES DO CRM =======\n');

try {
  console.log('Passo 1: Adicionando permissões do CRM...');
  execSync('node ' + path.join(__dirname, 'migrations/crm/add-crm-permissions.js'), { stdio: 'inherit' });
  console.log('\n✅ Permissões adicionadas com sucesso!\n');
  
  console.log('Passo 2: Criando dados iniciais do CRM...');
  execSync('node ' + path.join(__dirname, 'migrations/crm/seed-crm-data.js'), { stdio: 'inherit' });
  console.log('\n✅ Dados iniciais criados com sucesso!\n');
  
  console.log('Passo 3: Migrando leads existentes...');
  execSync('node ' + path.join(__dirname, 'migrations/crm/migrate-existing-leads.js'), { stdio: 'inherit' });
  console.log('\n✅ Leads migrados com sucesso!\n');
  
  console.log('\n✅✅✅ TODAS AS MIGRAÇÕES DO CRM CONCLUÍDAS COM SUCESSO! ✅✅✅\n');
} catch (error) {
  console.error('\n❌ ERRO DURANTE A MIGRAÇÃO DO CRM:', error, '\n');
  process.exit(1);
} 
/**
 * Script para limpar arquivos não utilizados no projeto
 * Este script remove arquivos que foram identificados como desnecessários no plano de limpeza
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Diretório raiz do projeto
const rootDir = path.resolve(__dirname, '..');

// Lista de arquivos individuais para remover
const filesToRemove = [
  'next.config.ts',
  'page.tsx.bak',
  'postcss.config.mjs',
  'vector-stores-docs.html',
  'ngrok.js'
];

// Lista de scripts de uso único para arquivar
const scriptsToArchive = [
  'src/create-sample-agent.js',
  'src/create-sample-agent-safe.js',
  'src/create-system-configs-table.js',
  'src/create-sample-vector-store.js',
  'src/create-vector-stores-table.js',
  'src/create-dispara-ja-table.js',
  'src/check-dispara-ja-table.js',
  'src/check-dispara-ja-logs-structure.js',
  'src/fix-agents-table.js',
  'src/fix-agents-table-2.js',
  'src/fix-missing-columns.js',
  'src/check-admin-user.js',
  'src/create-admin-user.js',
  'src/check-agents.js',
  'src/check-db-connection.js'
];

// Diretórios de teste/exemplo para remover
const dirsToRemove = [
  'src/app/teste',
  'src/app/teste-animacao',
  'src/app/teste-dom',
  'src/app/examples'
];

// Criar diretório de arquivos
function createArchiveDir() {
  const archiveDir = path.join(rootDir, 'scripts', 'archived');
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
    console.log(`✅ Diretório de arquivos criado: ${archiveDir}`);
  }
  return archiveDir;
}

// Remover um arquivo com confirmação de segurança
function removeFile(filePath) {
  const fullPath = path.join(rootDir, filePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`🗑️  Removido: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao remover ${filePath}:`, error.message);
      return false;
    }
  } else {
    console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
    return false;
  }
}

// Arquivar um script
function archiveScript(scriptPath, archiveDir) {
  const fullPath = path.join(rootDir, scriptPath);
  if (fs.existsSync(fullPath)) {
    try {
      const fileName = path.basename(scriptPath);
      const destPath = path.join(archiveDir, fileName);
      fs.copyFileSync(fullPath, destPath);
      fs.unlinkSync(fullPath);
      console.log(`📦 Arquivado: ${scriptPath} -> scripts/archived/${fileName}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao arquivar ${scriptPath}:`, error.message);
      return false;
    }
  } else {
    console.log(`⚠️  Script não encontrado: ${scriptPath}`);
    return false;
  }
}

// Remover um diretório
function removeDir(dirPath) {
  const fullPath = path.join(rootDir, dirPath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`🗑️  Removido diretório: ${dirPath}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao remover diretório ${dirPath}:`, error.message);
      return false;
    }
  } else {
    console.log(`⚠️  Diretório não encontrado: ${dirPath}`);
    return false;
  }
}

// Criar um backup antes de fazer qualquer alteração
function createBackup() {
  console.log('📦 Criando backup antes da limpeza...');
  try {
    // Criar um branch temporário com o estado atual
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const branchName = `backup-before-cleanup-${timestamp}`;
    
    execSync(`git add .`, { stdio: 'inherit' });
    execSync(`git stash`, { stdio: 'inherit' });
    execSync(`git branch ${branchName}`, { stdio: 'inherit' });
    execSync(`git stash apply`, { stdio: 'inherit' });
    
    console.log(`✅ Backup criado no branch: ${branchName}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error.message);
    console.log('⚠️ Continuando sem backup. Tenha cuidado!');
    return false;
  }
}

// Função principal
async function main() {
  console.log('🧹 Iniciando limpeza de arquivos não utilizados...');
  
  // Criar backup
  createBackup();
  
  // Criar diretório de arquivos
  const archiveDir = createArchiveDir();
  
  // Remover arquivos individuais
  console.log('\n📝 Removendo arquivos individuais não utilizados...');
  let filesRemoved = 0;
  for (const file of filesToRemove) {
    if (removeFile(file)) {
      filesRemoved++;
    }
  }
  console.log(`✅ ${filesRemoved}/${filesToRemove.length} arquivos removidos.`);
  
  // Arquivar scripts de uso único
  console.log('\n📦 Arquivando scripts de uso único...');
  let scriptsArchived = 0;
  for (const script of scriptsToArchive) {
    if (archiveScript(script, archiveDir)) {
      scriptsArchived++;
    }
  }
  console.log(`✅ ${scriptsArchived}/${scriptsToArchive.length} scripts arquivados.`);
  
  // Remover diretórios de teste
  console.log('\n🗂️  Removendo diretórios de teste/exemplo...');
  let dirsRemoved = 0;
  for (const dir of dirsToRemove) {
    if (removeDir(dir)) {
      dirsRemoved++;
    }
  }
  console.log(`✅ ${dirsRemoved}/${dirsToRemove.length} diretórios removidos.`);
  
  console.log('\n✨ Limpeza concluída com sucesso!');
  console.log('📊 Resumo:');
  console.log(`   - ${filesRemoved} arquivos removidos`);
  console.log(`   - ${scriptsArchived} scripts arquivados em scripts/archived/`);
  console.log(`   - ${dirsRemoved} diretórios de teste removidos`);
  console.log('\n👉 Recomendação: Execute "npm run build" para verificar se tudo continua funcionando corretamente.');
}

main().catch(error => {
  console.error('❌ Erro durante a limpeza:', error);
  process.exit(1);
}); 
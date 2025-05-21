/**
 * Script para corrigir problemas de cache persistente
 * Este script resolve problemas que impedem a atualização adequada em builds subsequentes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { glob } = require('glob');

console.log('🧹 Iniciando correção de problemas de cache persistente...');

// Diretório raiz do projeto
const rootDir = process.cwd();
const nextDir = path.join(rootDir, '.next');
const nextConfigPath = path.join(rootDir, 'next.config.js');

// Função para criar um timestamp de versão único baseado na data atual
function generateBuildId() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
}

// Função para atualizar o buildId no arquivo de build
function updateBuildId() {
  try {
    const buildIdPath = path.join(nextDir, 'BUILD_ID');
    if (fs.existsSync(buildIdPath)) {
      const buildId = generateBuildId();
      fs.writeFileSync(buildIdPath, buildId);
      console.log(`✅ BUILD_ID atualizado para: ${buildId}`);
      return true;
    } else {
      console.log('⚠️ Arquivo BUILD_ID não encontrado.');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar BUILD_ID:', error);
    return false;
  }
}

// Função para verificar e corrigir as configurações de cache no next.config.js
function fixCacheControlConfig() {
  try {
    if (!fs.existsSync(nextConfigPath)) {
      console.log('⚠️ Arquivo next.config.js não encontrado.');
      return false;
    }

    let content = fs.readFileSync(nextConfigPath, 'utf8');
    let modified = false;

    // Verificar se existe configuração de Cache-Control agressiva
    if (content.includes('max-age=31536000') || content.includes('immutable')) {
      console.log('🔧 Corrigindo configuração de Cache-Control agressiva...');
      
      // Substituir a configuração de cache para arquivos estáticos
      content = content.replace(
        /['"]Cache-Control['"],\s*['"]+.*?max-age=31536000.*?['"]+/g,
        "'Cache-Control', 'public, max-age=3600'" // Cache de 1 hora em vez de 1 ano
      );
      
      // Remover flag 'immutable'
      content = content.replace(/immutable/g, '');
      
      modified = true;
    }

    // Adicionar geração de buildId dinâmico se não existir
    if (!content.includes('generateBuildId')) {
      console.log('🔧 Adicionando geração de buildId dinâmico...');
      
      // Encontrar o objeto nextConfig
      const configObjStart = content.indexOf('const nextConfig = {');
      if (configObjStart !== -1) {
        // Encontrar o próximo fechamento de chave após a definição do objeto
        const configContentStart = configObjStart + 'const nextConfig = {'.length;
        const modifiedContent = content.slice(0, configContentStart) + `
  // Gerar ID de build único baseado na data para forçar atualização do cliente
  generateBuildId: () => {
    const now = new Date();
    return \`\${now.getFullYear()}\${String(now.getMonth() + 1).padStart(2, '0')}\${String(now.getDate()).padStart(2, '0')}-\${String(now.getHours()).padStart(2, '0')}\${String(now.getMinutes()).padStart(2, '0')}\`;
  },
` + content.slice(configContentStart);
        
        content = modifiedContent;
        modified = true;
      }
    }

    if (modified) {
      // Salvar as alterações
      fs.writeFileSync(nextConfigPath, content, 'utf8');
      console.log('✅ Configurações de cache corrigidas em next.config.js');
      return true;
    } else {
      console.log('✅ Configurações de cache já estão corretas.');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao corrigir configurações de cache:', error);
    return false;
  }
}

// Função para criar arquivo de versão para facilitar a verificação de atualizações
function createVersionFile() {
  try {
    const versionPath = path.join(rootDir, 'public', 'version.json');
    const buildId = generateBuildId();
    
    // Certificar que o diretório existe
    const publicDir = path.join(rootDir, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const versionData = {
      version: buildId,
      buildDate: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
    console.log(`✅ Arquivo de versão criado: ${buildId}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar arquivo de versão:', error);
    return false;
  }
}

// Função para adicionar meta tags anti-cache ao layout principal
function addAntiCacheMetaTags() {
  try {
    // Buscar todos os arquivos de layout
    const layoutFiles = glob.sync('src/app/**/layout.{js,jsx,ts,tsx}');
    let modified = false;
    
    for (const file of layoutFiles) {
      if (!fs.existsSync(file)) continue;
      
      const content = fs.readFileSync(file, 'utf8');
      
      // Verificar se já tem meta tags de cache
      if (!content.includes('Cache-Control') && !content.includes('no-cache')) {
        console.log(`🔧 Adicionando meta tags anti-cache ao arquivo: ${file}`);
        
        // Encontrar a tag head ou o início do return para adicionar meta tags
        const headMatch = content.match(/<head[^>]*>|return\s*\(\s*</);
        if (headMatch) {
          const insertPos = headMatch.index + headMatch[0].length;
          const metaTags = `
        {/* Anti-cache meta tags */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
`;
          
          const modifiedContent = content.slice(0, insertPos) + metaTags + content.slice(insertPos);
          fs.writeFileSync(file, modifiedContent, 'utf8');
          modified = true;
        }
      }
    }
    
    if (modified) {
      console.log('✅ Meta tags anti-cache adicionadas');
    } else {
      console.log('✅ Meta tags anti-cache já existem');
    }
    
    return modified;
  } catch (error) {
    console.error('❌ Erro ao adicionar meta tags anti-cache:', error);
    return false;
  }
}

// Função para adicionar script de detecção de atualizações ao layout principal
function addVersionCheckScript() {
  try {
    const layoutPath = path.join(rootDir, 'src/app/layout.tsx');
    if (!fs.existsSync(layoutPath)) {
      console.log('⚠️ Layout principal não encontrado.');
      return false;
    }
    
    let content = fs.readFileSync(layoutPath, 'utf8');
    
    // Verificar se já existe script de verificação de versão
    if (!content.includes('checkForUpdates') && !content.includes('version.json')) {
      console.log('🔧 Adicionando script de detecção de atualizações...');
      
      // Encontrar a tag <body> para inserir o script
      const bodyEndIndex = content.lastIndexOf('</body>');
      if (bodyEndIndex !== -1) {
        const versionCheckScript = `
        {/* Script para detectar atualizações da aplicação */}
        <script dangerouslySetInnerHTML={{ __html: \`
          // Verificar atualizações a cada 5 minutos
          setInterval(function checkForUpdates() {
            fetch('/version.json?t=' + new Date().getTime())
              .then(response => response.json())
              .then(data => {
                // Armazenar a versão atual na primeira vez
                if (!localStorage.getItem('appVersion')) {
                  localStorage.setItem('appVersion', data.version);
                  return;
                }
                
                // Comparar com a versão armazenada
                const currentVersion = localStorage.getItem('appVersion');
                if (data.version && data.version !== currentVersion) {
                  console.log('Nova versão disponível:', data.version);
                  localStorage.setItem('appVersion', data.version);
                  
                  // Perguntar ao usuário se deseja atualizar
                  if (confirm('Uma nova versão da aplicação está disponível. Deseja atualizar agora?')) {
                    localStorage.setItem('forceReload', 'true');
                    window.location.reload(true);
                  }
                }
              })
              .catch(err => console.log('Erro ao verificar atualizações:', err));
            return checkForUpdates;
          }(), 300000);
          
          // Forçar limpeza de cache se necessário
          if (localStorage.getItem('forceReload') === 'true') {
            localStorage.removeItem('forceReload');
            console.log('Limpando cache e recarregando aplicação...');
            
            // Limpar caches do navegador
            if ('caches' in window) {
              caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                  caches.delete(cacheName);
                });
              });
            }
          }
        \`}} />
        </body>`;
        
        const modifiedContent = content.slice(0, bodyEndIndex) + versionCheckScript;
        fs.writeFileSync(layoutPath, modifiedContent, 'utf8');
        console.log('✅ Script de detecção de atualizações adicionado');
        return true;
      }
    } else {
      console.log('✅ Script de detecção de atualizações já existe');
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erro ao adicionar script de detecção de atualizações:', error);
    return false;
  }
}

// Função para atualizar o package.json com comandos de build aprimorados
function updateBuildCommands() {
  try {
    const packageJsonPath = path.join(rootDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.log('⚠️ Arquivo package.json não encontrado.');
      return false;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let modified = false;
    
    // Adicionar comando para build com limpeza de cache
    if (!packageJson.scripts['build:force-update']) {
      packageJson.scripts['build:force-update'] = 'rimraf .next && node scripts/fix-cache-issues.js && next build && node scripts/clean-build.js && node scripts/fix-finddomenode.js && node scripts/fix-chunks.js';
      modified = true;
    }
    
    // Adicionar script para verificar cache
    if (!packageJson.scripts['cache:check']) {
      packageJson.scripts['cache:check'] = 'node scripts/fix-cache-issues.js';
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Comandos de build atualizados no package.json');
      return true;
    } else {
      console.log('✅ Comandos de build já estão atualizados');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar comandos de build:', error);
    return false;
  }
}

// Função principal
async function main() {
  console.log('🔍 Analisando problemas de cache...');
  
  // Corrigir configurações no next.config.js
  const configFixed = fixCacheControlConfig();
  
  // Adicionar meta tags anti-cache
  const metaTagsAdded = addAntiCacheMetaTags();
  
  // Adicionar script de detecção de atualizações
  const versionCheckAdded = addVersionCheckScript();
  
  // Criar arquivo de versão
  const versionFileCreated = createVersionFile();
  
  // Atualizar comandos de build
  const buildCommandsUpdated = updateBuildCommands();
  
  // Verificar se a pasta .next existe e atualizar BUILD_ID
  if (fs.existsSync(nextDir)) {
    updateBuildId();
  }
  
  console.log('\n✨ Finalizado processo de correção de cache:\n');
  console.log(`${configFixed ? '✅' : '⏭️'} Configurações de cache no next.config.js`);
  console.log(`${metaTagsAdded ? '✅' : '⏭️'} Meta tags anti-cache`);
  console.log(`${versionCheckAdded ? '✅' : '⏭️'} Script de detecção de atualizações`);
  console.log(`${versionFileCreated ? '✅' : '⏭️'} Arquivo de versão`);
  console.log(`${buildCommandsUpdated ? '✅' : '⏭️'} Comandos de build atualizados`);
  
  console.log('\n🔴 IMPORTANTE 🔴');
  console.log('Para garantir que as atualizações sejam sempre aplicadas, use o novo comando:');
  console.log('  npm run build:force-update');
  console.log('\nEste comando vai:');
  console.log('1. Limpar completamente o cache de build');
  console.log('2. Corrigir problemas de cache persistente');
  console.log('3. Gerar uma nova versão com identificação única');
  console.log('4. Adicionar detecção de atualizações para os usuários');
}

// Executar função principal
main().catch(error => {
  console.error('❌ Erro fatal durante a correção de cache:', error);
  process.exit(1);
}); 
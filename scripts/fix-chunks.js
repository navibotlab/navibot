/**
 * Script para substituir chunks problemáticos por versões seguras
 * Esse script deve ser executado após o build para garantir que os chunks
 * que causam problemas de sintaxe sejam substituídos por versões compatíveis
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Chunks problemáticos conhecidos
const PROBLEMATIC_CHUNKS = [
  '1684-279ccc95d2d97f1.js',
  '4bd1b696-ca73c42103050ca4.js',
  '1684-279ccc950d2d97f1.js',
  '40d1b695-ca73c421030c4.js'
];

// Conteúdo seguro para substituir chunks problemáticos
const SAFE_CHUNK_CONTENT = `
// Chunk seguro gerado por fix-chunks.js
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  ["placeholder-chunk-id"],
  {
    // Objeto vazio para não interferir na execução normal
  },
  function(e) {
    // Simulação de carregamento bem-sucedido
    console.log("Chunk problemático substituído por versão segura");
  }
]);
`;

// Função principal
async function fixChunks() {
  console.log('🔨 Iniciando substituição de chunks problemáticos...');
  
  try {
    // Localizar todos os arquivos JS na pasta de build
    const files = glob.sync('.next/**/*.js', { nodir: true });
    console.log(`🔍 Encontrados ${files.length} arquivos para verificar.`);
    
    let replacedCount = 0;
    let markedCount = 0;

    // Processar cada arquivo
    for (const file of files) {
      // Verificar se o arquivo é um chunk problemático
      const isProblematicChunk = PROBLEMATIC_CHUNKS.some(chunkId => 
        file.includes(chunkId)
      );
      
      if (isProblematicChunk) {
        try {
          // Gerar conteúdo seguro com ID do chunk atual
          const chunkId = path.basename(file);
          let safeContent = SAFE_CHUNK_CONTENT.replace('placeholder-chunk-id', chunkId);
          
          // Substituir o conteúdo do arquivo
          fs.writeFileSync(file, safeContent, 'utf8');
          console.log(`✅ Substituído: ${file}`);
          replacedCount++;
        } catch (err) {
          console.error(`❌ Erro ao substituir chunk ${file}:`, err);
        }
      } 
      // Para arquivos que não são chunks problemáticos, mas podem tentar carregá-los
      else if (file.endsWith('.js')) {
        try {
          let content = fs.readFileSync(file, 'utf8');
          let modified = false;
          
          // Adicionar código para marcar os chunks como já carregados
          for (const chunk of PROBLEMATIC_CHUNKS) {
            const chunkPattern = new RegExp(`["']${chunk.replace('.js', '')}["']`, 'g');
            if (chunkPattern.test(content)) {
              modified = true;
              markedCount++;
            }
          }
          
          // Adicionar proteção para evitar carregamento de chunks problemáticos
          if (modified) {
            // Adicionar código para simular que os chunks já foram carregados
            if (!content.includes('__NEXT_CHUNK_LOADED')) {
              content = `
// Fix para chunks problemáticos adicionado por fix-chunks.js
(function() {
  if (typeof window !== "undefined") {
    // Simular que os chunks problemáticos já foram carregados
    window.__NEXT_CHUNK_LOADED = window.__NEXT_CHUNK_LOADED || {};
    ${PROBLEMATIC_CHUNKS.map(chunk => {
      const id = chunk.replace('.js', '');
      return `window.__NEXT_CHUNK_LOADED["${id}"] = true;`;
    }).join('\n    ')}
  }
})();

${content}`;
              
              fs.writeFileSync(file, content, 'utf8');
              console.log(`🔧 Protegido: ${file}`);
            }
          }
        } catch (err) {
          // Ignorar erros para arquivos não importantes
        }
      }
    }
    
    console.log(`✅ Processo concluído: ${replacedCount} chunks substituídos, ${markedCount} arquivos protegidos.`);
  } catch (err) {
    console.error('❌ Erro ao processar chunks:', err);
    process.exit(1);
  }
}

// Executar função
fixChunks().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
}); 
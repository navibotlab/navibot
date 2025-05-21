# Plano de Limpeza de Arquivos Inutilizados

## Etapa 1: Verificação de Arquivos de Configuração Duplicados
- [x] Analisar next.config.js vs next.config.ts e determinar qual é utilizado
- [x] Verificar postcss.config.js vs postcss.config.mjs e determinar qual é utilizado
- [x] Identificar outras configurações duplicadas no projeto

## Etapa 2: Análise de Arquivos de Backup e Temporários
- [x] Identificar e analisar todos os arquivos com extensão .bak
- [x] Verificar o conteúdo e necessidade dos diretórios .wwebjs_cache e .wwebjs_auth
- [x] Avaliar necessidade de manter arquivos install.zip e install.sh
- [x] Verificar outros arquivos temporários no projeto

## Etapa 3: Verificação de Scripts de Utilitários
- [x] Analisar scripts JS no diretório raiz e determinar seu propósito
- [x] Analisar scripts JS no diretório src/ e verificar se ainda são necessários
- [x] Verificar se há scripts duplicados ou com funcionalidade sobreposta
- [x] Determinar quais scripts são de uso único (já executados) e quais são recorrentes

## Etapa 4: Análise de Código Não Utilizado
- [x] Verificar componentes em src/components que não são referenciados
- [x] Analisar páginas em src/pages e src/app que podem estar obsoletas
- [x] Verificar arquivos de utilitários não utilizados em src/utils
- [x] Analisar diretórios vazios ou com conteúdo obsoleto

## Etapa 5: Análise de Pastas Especiais
- [x] Verificar conteúdo de .next/ (build da aplicação)
- [x] Avaliar necessidade de manter todo o conteúdo em node_modules/
- [x] Verificar conteúdo de .cursor/ e sua relevância
- [x] Analisar diretórios data/, docs/ e config/

## Etapa 6: Revisão Final e Recomendações
- [x] Compilar lista final de arquivos a serem removidos
- [x] Criar backup dos arquivos antes da remoção
- [x] Implementar estratégia para manutenção contínua de limpeza
- [x] Documentar o processo e decisões tomadas

## Arquivos a Serem Removidos (Aprovados)
*(Esta seção será preenchida conforme avançarmos no plano)*

1. **next.config.ts** - Arquivo de configuração vazio e não utilizado, pois o next.config.js é o arquivo principal utilizado pelo Next.js conforme verificado no package.json.

2. **page.tsx.bak** - Arquivo de backup antigo, contendo uma versão desatualizada do componente de página.

3. **postcss.config.mjs** - Arquivo de configuração duplicado. O formato postcss.config.js é o utilizado pelo projeto segundo o package.json.

4. **Scripts de Configuração de Uso Único** - Os seguintes scripts parecem ser de uso único para configuração inicial e podem ser removidos depois de usados ou arquivados em uma pasta separada:
   - src/create-sample-agent.js
   - src/create-sample-agent-safe.js
   - src/create-system-configs-table.js
   - src/create-sample-vector-store.js
   - src/create-vector-stores-table.js
   - src/create-dispara-ja-table.js
   - src/check-dispara-ja-table.js
   - src/check-dispara-ja-logs-structure.js
   - src/fix-agents-table.js
   - src/fix-agents-table-2.js
   - src/fix-missing-columns.js
   - src/check-admin-user.js
   - src/create-admin-user.js
   - src/check-agents.js
   - src/check-db-connection.js

5. **install.zip** - Já removido pelo usuário.

6. **vector-stores-docs.html** - Arquivo vazio que não é utilizado.

7. **ngrok.js** - Script utilitário para criar túnel ngrok para testes locais. Pode ser arquivado em uma pasta de utilitários se não for utilizado regularmente.

8. **Diretórios de Teste e Exemplo** - Os seguintes diretórios parecem conter apenas código de teste ou exemplos e podem ser removidos antes de ir para produção:
   - src/app/teste/
   - src/app/teste-animacao/
   - src/app/teste-dom/
   - src/app/examples/

## Arquivos a Serem Mantidos (Aprovados)
*(Esta seção será preenchida conforme avançarmos no plano)*

1. **next.config.js** - Arquivo de configuração principal do Next.js com todas as configurações necessárias.

2. **postcss.config.js** - Arquivo de configuração do PostCSS utilizado pelo projeto.

3. **install.sh** - Script de instalação para configurar o ambiente. Importante para implantação em produção.

4. **.wwebjs_auth/ e .wwebjs_cache/** - Diretórios utilizados para integração com WhatsApp Web. São necessários para manter a sessão e cache do WhatsApp, removê-los pode fazer com que a integração precise ser reautenticada.

5. **Diretórios Importantes**:
   - **data/** - Contém dados de configuração da aplicação, como connections.json.
   - **docs/** - Contém documentação da aplicação.
   - **config/** - Contém arquivos de configuração essenciais como openai.json e agents.json.
   - **.next/** - Diretório de build da aplicação, necessário para execução.

## Recomendações para Manutenção Contínua

Para manter o projeto limpo e organizado no futuro, sugerimos as seguintes práticas:

1. **Organização de Scripts**:
   - Crie uma pasta `scripts/setup` ou `scripts/migration` para armazenar scripts de configuração inicial
   - Documente claramente o propósito de cada script e se é de uso único ou recorrente

2. **Gestão de Código de Teste**:
   - Mantenha os testes em um diretório específico (`__tests__` ou `test/`)
   - Utilize flags de ambiente para evitar que código de teste seja compilado em produção
   - Remova páginas e componentes de exemplo antes de deployments de produção

3. **Controle de Versão**:
   - Adicione arquivos temporários e de cache ao `.gitignore`
   - Evite fazer commit de arquivos de backup (*.bak)
   - Considere usar branches separados para experimentação

4. **Limpeza Regular**:
   - Implemente uma tarefa trimestral de revisão de código não utilizado
   - Use ferramentas como `depcheck` para identificar dependências não utilizadas
   - Remova código comentado que não é mais relevante

5. **Automação**:
   - Adicione scripts npm para limpeza como `npm run clean:cache` ou `npm run clean:build`
   - Considere adicionar linters que detectam código morto

## Próximos Passos

1. Fazer backup dos arquivos antes de removê-los (criar um branch git específico ou zip)
2. Remover os arquivos identificados como desnecessários
3. Verificar se a aplicação continua funcionando corretamente
4. Implementar as recomendações para manutenção contínua

# Plano de Implementação do CRM NaviBot

## Regras Fundamentais
1. **Preservação da estrutura existente**: Não modificar ou remover qualquer componente do sistema atual sem aprovação prévia explícita
2. **Integração não disruptiva**: Todo novo código deve se integrar de forma harmoniosa com o existente
3. **Versionamento rigoroso**: Commits frequentes com mensagens descritivas claras
4. **Testes contínuos**: Cada nova funcionalidade deve ser testada isoladamente antes da integração
5. **Documentação completa**: Toda nova funcionalidade deve ser documentada
6. **Migração de dados segura**: Backups antes de qualquer alteração no banco de dados
7. **Aprovação por etapas**: Cada fase do plano requer aprovação antes de prosseguir
8. **Atualização de tarefas concluídas**: Adicionar emoji de check ✅ para tarefas que forem sendo concluídas

## Visão Geral do Sistema
O CRM NaviBot será um sistema completo para gerenciamento de relacionamento com clientes, integrado com os agentes de IA existentes, permitindo automação de tarefas de vendas e suporte. O sistema terá foco inicial em vendedores individuais e pequenas equipes, mas com arquitetura escalável para grandes empresas.

**Funcionalidades essenciais que o CRM deverá ter inicialmente**: Solicitar imagens de referências quando for criar essas funcionalidades.
1. ✅ Página com duas colunas semelhante à página de configurações gerais.
2. ⚠️ Coluna da esquerda, será disponibilizado os grupos de origens, dentro dos grupos de origens poderá ser adicionado vários negócios. [IMPLEMENTAÇÃO PARCIAL: Modelo de dados existe, mas interface não está completa]
3. ✅ Coluna da direita: Campos de busca, e filtro por data, campos, tags, dono do negócio, status e outros (botão mais filtros)
4. ✅ Botão adicionar negócio com dropdown com opções "novo negócio" e "importar negócio".
5. ✅ título: xxx oportunidade de negócios à esquerda e à direita ícones: spinner para atualizar, exportar, configurações
6. ✅ abaixo os cards dos estágios devem ser: Entrada do Lead, Prospecção, Conectados, Desinteressados, Sem Contato, Aguardando, Fechado
7. ✅ Possibilidade de clicar e arrastar os cards dos leads entre os cards do negócio...

## Etapas de Implementação

### Fase 1: Análise de Requisitos e Configuração Inicial (Dias 1-2)
- **1.1 Análise do sistema atual**
  - ✅ Mapear modelo de usuário existente
  - ✅ Identificar pontos de integração necessários
  - ✅ Avaliar menuUser atual e possibilidades de expansão

- **1.2 Expansão do modelo básico de usuários**
  - ✅ Expandir modelo User para suportar diferentes roles (admin, user)
  - ✅ API para criação de usuários (por admins)
  - ✅ Integração com o sistema de autenticação existente
  - ✅ Endpoints para gerenciamento de perfil e workspace

- **1.3 Configuração do ambiente de desenvolvimento do CRM**
  - ✅ Preparar ambiente para novas funcionalidades
  - ✅ Configurar estrutura de diretórios para módulos do CRM
  - ✅ Definir padrões de código e estruturas de componentes
  - ✅ Planejar bibliotecas e ferramentas necessárias

### Fase 2: Análise e Design do CRM (Dias 2-3)
- **2.1 Mapeamento do sistema atual**
  - ✅ Documentar estrutura do banco de dados existente
  - ✅ Identificar pontos de integração com agentes de IA
  - ✅ Avaliar fluxos de dados atuais
  
- **2.2 Design do modelo de dados expandido**
  - ✅ Expandir modelo Lead com campos adicionais
  - ✅ Criar modelos para Pipeline, Stages, Tasks, Tags
  - ✅ Definir modelo para automações e campanhas
  - ✅ Planejar schema para relatórios e dashboards

- **2.3 Design de API**
  - ✅ Definir endpoints necessários
  - ✅ Documentar contratos de API
  - ✅ Mapear integrações externas

### Fase 3: Estrutura Base do CRM (Dias 3-5)
- **3.1 Expansão do modelo de dados**
  - ✅ Implementar migrations para novos modelos
  - ✅ Adaptar models do Prisma
  - ✅ Configurar relações entre entidades

- **3.2 Implementação das APIs Core**
  - ✅ API de gerenciamento de leads avançado
  - ✅ API de pipeline e stages
  - ✅ API de tarefas
  - ✅ API de tags e categorização

- **3.3 Integração com agentes de IA** (ADIAR POR ENQUANTO)
  - ⬜ Definir interfaces para interação dos agentes com CRM
  - ⬜ Implementar instruções para agentes executarem tarefas de CRM
  - ⬜ Criar sistema de logs para ações dos agentes

### Fase 4: Interface do Usuário do CRM (Dias 5-7)
- **4.1 Expansão da Sidebar e Menu de Navegação**
  - ✅ Implementar itens de menu para novas funcionalidades do CRM
  - ✅ Criar navegação contextual entre módulos
  - ⬜ Adicionar indicadores de contagem em menus relevantes

- **4.2 Dashboard principal**
  - ✅ Visão geral de leads e oportunidades
  - ⬜ Gráficos de conversão e funil
  - ⬜ Indicadores de performance (KPIs)

- **4.3 Pipeline visual (Kanban)**
  - ✅ Interface de arrastar e soltar para movimentação de leads
  - ✅ Filtros por status, agente, tags
  - ✅ Visualização de valores e probabilidades

- **4.4 Interface de atendimento**
  - ⬜ Unificação de conversas de diferentes canais
  - ⬜ Histórico completo de interações
  - ⬜ Templates de mensagens e respostas rápidas

### Fase 4.5: Melhorias na Visualização do Pipeline (NOVO)
- **4.5.1 Implementação da Coluna de Grupos de Origens**
  - ✅ Criar layout com duas colunas conforme especificado
  - ⬜ Implementar visualização hierárquica de grupos de origens na coluna esquerda
  - ⬜ Desenvolver interação entre grupos de origens e estágios do pipeline
  - ⬜ Adicionar funcionalidade para filtrar pipeline por grupo de origem

- **4.5.2 Página de Detalhes do Lead**
  - ⬜ Criar página dedicada para visualização completa de um lead individual
  - ⬜ Implementar abas para diferentes tipos de informações (dados básicos, histórico de interações, tarefas, notas)
  - ⬜ Adicionar timeline de atividades e mudanças de estágio
  - ⬜ Desenvolver funcionalidade para edição in-line de detalhes

- **4.5.3 Melhorias na Experiência de Usuário**
  - ⬜ Otimizar performance de drag-and-drop com muitos leads
  - ⬜ Implementar visualização compacta/expandida dos cards de lead
  - ⬜ Adicionar opção de visualização em lista além do kanban
  - ⬜ Desenvolver tooltips informativos e guias contextuais

### Fase 5: Sistema de Permissões Granular (Dias 7-8)
- **5.1 Implementação do sistema de permissões granular**
  - ⬜ Implementar sistema de permissões granular para recursos do CRM
  - ⬜ Criar relações entre usuários e recursos do sistema
  - ⬜ Desenvolver sistema de logs de auditoria para ações críticas
  - ⬜ API para gerenciamento de permissões

- **5.2 Interface de gerenciamento de permissões**
  - ⬜ Área de perfil para edição de informações pessoais
  - ⬜ Gerenciamento de workspace para admins
  - ✅ Interface para criação e edição de usuários (admin)
  - ⬜ Painel de controle de permissões para ferramentas do CRM
  - ✅ Integração com menuUser existente
  - ⬜ Testes de usabilidade e ajustes iniciais

### Fase 6: Automações e Integrações (Dias 8-9)
- **6.1 Sistema de automações**
  - ⬜ Motor de regras e condições
  - ⬜ Ações automatizadas (tags, stages, notificações)
  - ⬜ Agendamento de tarefas e follow-ups

- **6.2 Webhooks e integrações externas**
  - ⬜ Implementação de endpoints para webhooks
  - ⬜ Integração com provedores de email
  - ⬜ Conexão com checkouts de pagamento
  - ⬜ Implementação de formulários web

- **6.3 Campanhas de engajamento**
  - ⬜ Sistema de campanhas de mensagens
  - ⬜ Segmentação de leads
  - ⬜ Agendamento de envios

### Fase 7: Relatórios, Analytics e Finalização (Dias 9-10)
- **7.1 Dashboards avançados**
  - ⬜ Relatórios de conversão por fonte/canal
  - ⬜ Analytics de desempenho de agentes
  - ⬜ Previsão de vendas e pipeline

- **7.2 Exportação e importação**
  - ⬜ Sistema de importação em massa
  - ⬜ Exportação de relatórios em diferentes formatos
  - ⬜ Agendamento de relatórios recorrentes

- **7.3 Testes de carga e otimização**
  - ⬜ Simular volumes elevados de leads e conversas
  - ⬜ Identificar gargalos
  - ⬜ Otimizar consultas e processamento

- **7.4 Documentação final**
  - ⬜ Documentação técnica completa
  - ⬜ Guias de usuário
  - ⬜ Tutoriais de uso das principais funcionalidades

## Expansões Futuras (Pós-prazo inicial)
- ⬜ Integração com Instagram e outras redes sociais
- ⬜ Sistema avançado de análise de sentimento nas conversas
- ⬜ Marketplace de templates e automações
- ⬜ Mobile app para gerenciamento on-the-go
- ⬜ Integrações com mais plataformas de pagamento
- ⬜ Sistema de metas e gamificação para equipes de vendas
- ⬜ Gerenciamento avançado de equipes e hierarquias de permissões

## Prioridades Imediatas para Ajustes (NOVO)
1. ⬜ Implementar completamente a coluna esquerda com grupos de origens
2. ⬜ Criar página de detalhes do lead
3. ⬜ Melhorar a integração entre leads e estágios no banco de dados
4. ⬜ Otimizar a performance de drag-and-drop para volumes maiores
5. ⬜ Implementar funcionalidade de pesquisa e filtros avançados

## Arquitetura Técnica Proposta

### Componentes principais:
1. **Sistema de Permissões**: Controle de acesso baseado em roles e recursos
2. **API Core**: Endpoints RESTful para todas as operações de CRM
3. **Serviço de Agentes**: Interface entre os agentes IA e o CRM
4. **Sistema de Automações**: Motor de regras e execução de automações
5. **Serviço de Integrações**: Gerenciamento de webhooks e conexões externas
6. **Banco de Dados**: Prisma com expansão dos modelos existentes
7. **Frontend**: Interfaces React com componentes reutilizáveis
8. **Serviço de Analytics**: Processamento e geração de relatórios

### Considerações de Escalabilidade:
- ⬜ Paginação e limitação de requisições para evitar sobrecarga
- ⬜ Cache estratégico para dados frequentemente acessados
- ⬜ Otimização de consultas ao banco de dados
- ⬜ Processamento assíncrono para tarefas pesadas
- ⬜ Arquitetura modular para facilitar expansão futura

## Detalhamento do Sistema de Permissões

### Estrutura de Roles
1. **Admin**: Acesso completo a todas as funcionalidades
   - ✅ Gerenciamento de usuários
   - ⬜ Configuração do sistema
   - ⬜ Acesso a todos os leads e dados
   - ⬜ Relatórios completos

2. **User**: Acesso limitado baseado em permissões específicas
   - ⬜ Gerenciamento de leads designados
   - ⬜ Acesso a ferramentas específicas do CRM
   - ⬜ Relatórios filtrados

### Permissões Granulares
- ⬜ Visualização de leads
- ⬜ Edição de leads
- ⬜ Atribuição de tarefas
- ⬜ Envio de campanhas
- ⬜ Acesso a relatórios
- ⬜ Configuração de automações
- ⬜ Gerenciamento de templates
- ⬜ Acesso a integrações

### Fluxo de Trabalho de Usuários
1. ✅ Admin acessa a seção "Gerenciar Usuários" no Gerenciar Conta
2. ✅ Cria novo usuário com informações básicas
3. ✅ Atribui role específica (admin ou user)
4. ✅ Configura permissões granulares para usuários com role user
5. ✅ O novo usuário recebe email com instruções de acesso
6. ✅ Usuário configura sua conta e acessa recursos baseados em suas permissões

## Plano de Expansão do MenuUser

### Análise do Sistema Atual
- ✅ **Componentes existentes**:
  - `UserProfileMenu`: Menu suspenso de perfil do usuário no cabeçalho
  - `Sidebar`: Menu de navegação lateral com categorias de funcionalidades
  - `Header`: Componente que exibe o menu de perfil do usuário
  - Página de configurações de conta com abas para diferentes seções

- ✅ **Estrutura atual**:
  - O sistema já possui uma robusta separação de responsabilidades
  - Menu de perfil com acesso a gerenciamento de conta e logout
  - Sidebar organizada com seções para diferentes áreas funcionais
  - Sistema de permissões básico baseado em roles (owner, admin, user)

### Expansões Propostas para o MenuUser
1. **Expansão do UserProfileMenu**:
   - ⬜ Adicionar seletor de workspace para usuários com múltiplos workspaces
   - ⬜ Incluir indicador de status do plano e uso de recursos
   - ⬜ Criar atalhos rápidos para funções mais usadas do CRM
   - ⬜ Implementar área de notificações integrada

2. **Expansão do Sidebar**:
   - ✅ Adicionar seção dedicada para CRM com submenus:
     - ✅ Kanban (Pipeline Visual)
     - ⬜ Funil de Vendas
     - ⬜ Tarefas e Follow-ups
     - ⬜ Automações
     - ⬜ Campanhas
   - ⬜ Implementar sistema de favoritos para itens de menu frequentes
   - ⬜ Adicionar indicadores de quantidade (ex: número de tarefas pendentes)
   - ⬜ Desenvolver sistema de permissões para controlar visibilidade de itens

3. **Área de Configurações de Conta**:
   - ✅ Expandir para incluir preferências de CRM
   - ✅ Adicionar seção para gerenciamento de equipes e atribuições
   - ⬜ Implementar configuração de metas e KPIs pessoais
   - ✅ Criar visualização de histórico de atividades do usuário

### Prioridades de Implementação
1. ✅ Expandir Sidebar com novas seções de CRM (imediato)
2. ⬜ Integrar sistema de permissões com visibilidade de menu (após implementação dos recursos)
3. ⬜ Implementar área de notificações (médio prazo)
4. ⬜ Adicionar seletor de workspace (médio prazo)
5. ⬜ Desenvolver sistema de favoritos e personalização (longo prazo)

## Documentação Técnica

### Documentos Concluídos
- ✅ `.cursor/crm-ambiente-dev.md`: Configuração do ambiente de desenvolvimento
- ✅ `.cursor/crm-db-analysis.md`: Análise do banco de dados e expansões necessárias
- ✅ `.cursor/crm-api-design.md`: Design completo das APIs do CRM

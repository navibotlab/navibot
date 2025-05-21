# Plano de Implementação de permissões

## Regras Fundamentais
1. **Preservação da estrutura existente**: Não modificar ou remover qualquer componente do sistema atual sem aprovação prévia explícita
2. **Integração não disruptiva**: Todo novo código deve se integrar de forma harmoniosa com o existente
3. **Versionamento rigoroso**: Commits frequentes com mensagens descritivas claras
4. **Testes contínuos**: Cada nova funcionalidade deve ser testada isoladamente antes da integração
5. **Documentação completa**: Toda nova funcionalidade deve ser documentada
6. **Migração de dados segura**: Backups antes de qualquer alteração no banco de dados
7. **Aprovação por etapas**: Cada fase do plano requer aprovação antes de prosseguir
8. **Atualização de tarefas concluídas**: Adicionar emoji de check ✅ para tarefas que forem sendo concluídas

## Plano de Execução

### Fase 1: Estrutura de Dados e Backend
1. **Modelagem do Banco de Dados**
   - ✅ Criar tabela `permission_groups` para armazenar grupos de permissões predefinidos e personalizados
   - ✅ Criar tabela `permissions` com todas as permissões disponíveis
   - ✅ Criar tabela `user_permissions` para relacionar usuários com suas permissões ou grupos
   - ✅ Criar tabela `permission_group_items` para mapear quais permissões pertencem a quais grupos

2. **Criação de APIs**
   - ✅ Endpoint para listar todas as permissões disponíveis
   - ✅ Endpoint para obter permissões de um usuário específico
   - ✅ Endpoint para atualizar permissões de um usuário
   - ✅ Endpoints para criar/editar/excluir grupos de permissões personalizados
   - ✅ Endpoint para aplicar um grupo de permissões a um usuário

### Fase 2: Interfaces do Usuário
1. **Modal/Página de Permissões**
   - ✅ Implementar interface com abas: "Geral", "Permissões" e "Contas e dispositivos"
   - ✅ Na aba "Permissões", criar seletor de grupo de permissão com opção "Personalizado"
   - ✅ Implementar seções colapsáveis para categorias de permissões (Páginas, Atendimento, Negócios, etc.)
   - ✅ Adicionar toggles para cada permissão individual com descrições
   - ✅ Adicionar botões "Ativar todos" e "Desativar todos" para cada seção
   - ✅ Implementar botão "Salvar grupo personalizado" quando o grupo "Personalizado" estiver selecionado
   - ✅ Implementar botão "Salvar alterações" no rodapé da página

2. **Integração com Menu Dropdown**
   - ✅ Modificar o menu dropdown para que ao clicar em "Permissões" abra o modal/página de permissões
   - ✅ Garantir que o modal/página seja carregado com as permissões atuais do usuário selecionado

3. **Integração com Adicionar/Editar Usuário**
   - ✅ Adicionar seção de permissões nos formulários de adicionar/editar usuário
   - ✅ Permitir selecionar grupo de permissões predefinido ou personalizado
   - ✅ Opcionalmente, permitir ajustes individuais de permissões durante criação/edição

### Fase 3: Implementação de Funcionalidades (100% concluída)
1. **Lógica de Verificação de Permissões**
   - ✅ Implementar middleware/hooks para verificar permissões em rotas protegidas
   - ✅ Criar utilitário para verificar permissões em componentes

2. **Grupos de Permissões Predefinidos**
   - ✅ Implementar grupos padrão (Admin, Usuário Básico, etc.)
   - ✅ Configurar permissões padrão para cada grupo

3. **Gerenciamento de Permissões Personalizadas**
   - ✅ Implementar funcionalidade para salvar configurações personalizadas
   - ✅ Permitir nomear e reutilizar grupos personalizados

4. **Simplificação do Sistema de Permissões**
   - ✅ Modificar o sistema para usar apenas um grupo padrão "Usuário Padrão" para usuários comuns
   - ✅ Remover toda a lógica de seleção de grupos de permissões na interface
   - ✅ Simplificar a interface para mostrar diretamente as permissões do usuário
   - ✅ Corrigir o erro "<!DOCTYPE... is not valid JSON" na API de permissões
   - ✅ Modificar a lógica de permissões para que administradores e proprietários tenham acesso automático

### Fase 4: Testes e Refinamento
1. **Testes Unitários e de Integração**
   - ⬜ Testar API endpoints
   - ⬜ Testar componentes UI
   - ⬜ Testar fluxos de usuário completos

2. **Refinamento da UI/UX**
   - ⬜ Garantir responsividade em diferentes dispositivos
   - ⬜ Implementar feedback visual para ações de usuário (salvamento, alterações, etc.)

## Cronograma Estimado
- ✅ **Fase 1:** 3-5 dias
- ✅ **Fase 2:** 4-7 dias
- ✅ **Fase 3:** 3-5 dias
- ⬜ **Fase 4:** 2-3 dias
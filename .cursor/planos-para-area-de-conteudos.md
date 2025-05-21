# Plano de Implementação: Estrutura Unificada para Área de Conteúdos

## Contexto
O sistema atual possui uma seção "Conteúdos" no sidebar com duas opções: "Campos personalizados" e "Campos do sistema". A proposta é unificar essas opções em uma única entrada e implementar uma estrutura de layout 30/70 com um menu lateral na esquerda e conteúdo dinâmico na direita.

## Regras
- NÃO modificar qualquer código fora do escopo específico deste plano
- NÃO excluir código existente sem garantir que não será necessário
- NÃO alterar a funcionalidade atual, apenas reorganizar a estrutura de navegação
- Cada etapa deve ser implementada, finalizada, testada e receber aprovação explícita antes de prosseguir para a próxima
- Manter estilo visual consistente com o resto da aplicação, especialmente com a página de contatos
- Documentar todas as alterações realizadas
- Solicitar feedback ao final de cada etapa

## ETAPA 1: Reorganização do Sidebar ✅

1. ✅ Identificar o componente do sidebar onde estão as entradas atuais
2. ✅ Criar nova entrada chamada "Configurações de Contato" (ou nome aprovado)
3. ✅ Remover as entradas individuais atuais ("Campos personalizados" e "Campos do sistema")
4. ✅ Implementar redirecionamento da nova entrada para a página com layout 30/70
5. ✅ Escolher ícone adequado para representar a seção
6. ✅ Testar a navegação e solicitar aprovação

## ETAPA 2: Implementação da Estrutura de Layout 30/70 ✅

1. ✅ Criar componente base de layout com divisão 30/70
2. ✅ Implementar coluna esquerda (30%) para o menu lateral
3. ✅ Implementar coluna direita (70%) como container para conteúdo dinâmico
4. ✅ Adicionar sistema de rotas para cada opção do menu
5. ✅ Implementar funcionalidade de responsividade para diferentes tamanhos de tela
6. ✅ Implementar transições suaves entre mudanças de página
7. ✅ Testar o layout em diferentes tamanhos de tela e solicitar aprovação

## ETAPA 3: Menu Lateral com Opções ✅

1. ✅ Desenvolver componente do menu lateral
2. ✅ Adicionar as opções requisitadas:
   - ✅ Campos do Contato
   - ✅ Campos do Sistema
   - ✅ Tags
   - ✅ Etiquetas
   - ✅ Notas
3. ✅ Implementar indicador visual para opção ativa
4. ✅ Adicionar funcionalidade de colapso/expansão para visualização mobile
5. ✅ Implementar persistência da opção selecionada após recarregar a página
6. ✅ Testar navegação entre as opções e solicitar aprovação

## ETAPA 4: Adaptar Páginas Existentes ✅

1. ✅ Migrar página "Campos do Contato" para o novo layout
   - ✅ Adaptar componentes existentes
   - ✅ Manter todas as funcionalidades atuais
   - ✅ Padronizar estilo conforme página de contatos
2. ✅ Migrar página "Campos do Sistema" para o novo layout
   - ✅ Adaptar componentes existentes
   - ✅ Manter todas as funcionalidades atuais
   - ✅ Padronizar estilo conforme página de contatos
3. ✅ Testar funcionalidades para garantir que tudo continua operando corretamente
4. ✅ Solicitar aprovação das páginas adaptadas

## ETAPA 5: Desenvolver Página de Tags ✅

1. ✅ Criar página com layout padronizado
2. ✅ Implementar visualização de tags existentes
3. ✅ Desenvolver funcionalidade para criar novas tags
4. ✅ Implementar edição de tags existentes
5. ✅ Adicionar funcionalidade de exclusão com confirmação
6. ✅ Implementar busca/filtragem de tags
7. ✅ Testar todas as funcionalidades e solicitar aprovação

## ETAPA 6: Desenvolver Página de Etiquetas ✅

1. ✅ Criar página com layout padronizado
2. ✅ Implementar estrutura base para funcionalidades de CRM futuras
3. ✅ Adicionar indicador visual de "Em desenvolvimento"
4. ✅ Implementar versão minimalista funcional
5. ✅ Testar a interface e solicitar aprovação

## ETAPA 7: Desenvolver Página de Notas ✅

1. ✅ Criar página com layout padronizado
2. ✅ Implementar interface para adicionar notas de atendimento
3. ✅ Desenvolver visualização cronológica de notas anteriores
4. ✅ Adicionar filtros por data e conteúdo
5. ✅ Implementar funcionalidade de edição e exclusão
6. ✅ Testar todas as funcionalidades e solicitar aprovação

## ETAPA 8: Consistência Visual e UX [EM ANDAMENTO]

1. ✅ Revisar todas as páginas para garantir consistência visual
2. ✅ Verificar que todos os componentes seguem o mesmo padrão
3. ✅ Implementar feedback visual para todas as ações
4. ✅ Adicionar confirmações para operações destrutivas
5. ✅ Revisar navegação para garantir que é intuitiva
6. [ ] Testar experiência completa do usuário e solicitar aprovação

## ETAPA 9: Criar e implementar funcionalidades às págins criadas [ ]

9.1. ✅ Funcionalidade de adicionar etiqueta, solicitar imagens de referencia. 
- O fluxo é ao clicar em adicionar etiqueta... abre modal... com nome da tag e um seletor de cores... e o botão cancelar e salvar. 
- Deve ser fatorado em componentes separados e importados na página, para que o código não fique tão grande. Gera um diretório dentro da pasta etiquetas para organizar os componentes.
- Seguir estilo da aplicação... 
- A lista de etiquetas deve ter id, cor, nome, uso (mostra a quantidade de vezes que foi usada), ações (com botões de editar e deletar)
- Ao finalizar, solicite teste e aprovação para seguir para a proxima etapa.




9.2. [ ] Funcionalidade de adicionar campo do sistema,
- Campos do sistema são compartilhados entre todos os contatos automaticamente, devem ser adicionados a todos os leads.
- Verifique no schema, se já temos um modelo SystemField ou algo do tipo. Caso não tenha crie o modelo.
- Adicione campos padrões que não podem ser editados: campos do modelo lead que já existem (name, phone (campo obrigatório para todos os contatos), photo), email, cargo, profissão, instagram. todos esses campos são todos opcionais
- A lista de campos do sistema deve ter id, nome do campo, tipo, identificador, uso (mostra a quantidade de vezes que foi usada), ações (com botões de editar e deletar)
- Criar a modal de adicionar campos do sistema, imagem em anexo para inspiração devendo ter os mesmos campos e tipos disponíveis.
- Fazer com que campos do sistema que tenha algum valor, apareçam em infolead na aba de informações de contato básicas. Também ter um botão adicionar campo onde irá aparecer os campos do sistema e o usuário poderá adicionar ao contato e preencher algum valor...
- Seguir estilo da aplicação...
- Ao finalizar, solicite teste e aprovação para seguir para a proxima etapa.



9.3. [ ] Funcionalidade de adicionar notas
9.4. [ ] Executar testes de acessibilidade
9.5. [ ] Preparar documentação final
9.6. [ ] Solicitar aprovação final
9.7. [ ] Lançar nova estrutura



## ETAPA 10: Testes Finais e Lançamento [ ]

1. [ ] Realizar testes de usabilidade com usuários internos
2. [ ] Implementar ajustes com base no feedback recebido
3. [ ] Verificar responsividade em todos os tamanhos de tela
4. [ ] Executar testes de acessibilidade
5. [ ] Preparar documentação final
6. [ ] Solicitar aprovação final
7. [ ] Lançar nova estrutura




### ETAPAS ADICIONAIS
Para próximas etapas, você pode querer considerar:
Adicionar funcionalidade para vincular tags a contatos
Implementar funcionalidade de filtragem de contatos por tag
Adicionar estatísticas de uso para cada tag
# Configuração do Ambiente de Desenvolvimento do CRM NaviBot

## Análise da Estrutura Atual

Após análise da estrutura atual do projeto, identificamos:

- O projeto utiliza Next.js com App Router
- Já existe uma pasta `src/app/crm` com uma implementação básica para leads
- Componentes reutilizáveis são organizados em `src/components`
- A estrutura segue o padrão de rotas do Next.js com subpastas para diferentes recursos
- Existe uma organização clara entre componentes de página e componentes reutilizáveis

## Estrutura de Diretórios Proposta para Expansão do CRM

Para implementar as funcionalidades essenciais do CRM, incluindo a página de Kanban com visão de funil, propomos a seguinte estrutura:

```
src/
├── app/
│   ├── crm/
│   │   ├── layout.tsx (layout compartilhado para todas as páginas do CRM)
│   │   ├── leads/ (visualização tabular existente)
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── CreateLeadDialog.tsx
│   │   │       ├── EditLeadDialog.tsx
│   │   │       └── ...
│   │   ├── kanban/ (nova visualização de pipeline/kanban)
│   │   │   ├── page.tsx (implementação do layout de duas colunas)
│   │   │   └── components/
│   │   │       ├── OriginGroups.tsx (coluna da esquerda)
│   │   │       ├── StagesView.tsx (coluna da direita com os cards kanban)
│   │   │       ├── LeadCard.tsx (card de lead arrastável)
│   │   │       ├── StageColumn.tsx (coluna de estágio)
│   │   │       ├── LeadFilters.tsx (filtros de lead)
│   │   │       └── LeadActions.tsx (ações: adicionar, importar, etc)
│   │   ├── tarefas/ (gerenciamento de tarefas)
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   ├── automacoes/ (regras de automação)
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   └── campanhas/ (gerenciamento de campanhas)
│   │       ├── page.tsx
│   │       └── components/
│   └── admin/
│       ├── configuracoes/
│       │   └── crm/ (configurações específicas do CRM)
│       │       ├── etapas/ (configuração das etapas do funil)
│       │       │   └── page.tsx
│       │       ├── campos/ (configuração de campos personalizados)
│       │       │   └── page.tsx
│       │       └── origens/ (configuração dos grupos de origem)
│       │           └── page.tsx
├── components/
│   ├── crm/ (componentes reutilizáveis do CRM)
│   │   ├── LeadForm.tsx (formulário reutilizável para leads)
│   │   ├── DragContext.tsx (contexto para drag and drop)
│   │   ├── KanbanBoard.tsx (componente kanban reutilizável)
│   │   └── LeadDetails.tsx (visualização de detalhes do lead)
```

## APIs e Serviços

Para suportar as novas funcionalidades do CRM, propomos a seguinte estrutura de APIs:

```
src/
├── app/
│   ├── api/
│   │   ├── crm/
│   │   │   ├── leads/ (API existente de leads)
│   │   │   │   └── route.ts
│   │   │   ├── origins/ (API para grupos de origem)
│   │   │   │   └── route.ts
│   │   │   ├── stages/ (API para etapas do funil)
│   │   │   │   └── route.ts
│   │   │   ├── tasks/ (API para tarefas)
│   │   │   │   └── route.ts
│   │   │   └── automations/ (API para automações)
│   │   │       └── route.ts
```

## Serviços e Utils

Para lógica de negócios reutilizável e funções utilitárias:

```
src/
├── lib/
│   ├── crm/
│   │   ├── leadService.ts (manipulação de leads)
│   │   ├── stageService.ts (manipulação de etapas)
│   │   ├── taskService.ts (manipulação de tarefas)
│   │   └── automationService.ts (serviço de automação)
│   └── dnd/ (utilitários para drag and drop)
│       └── dndUtils.ts
```

## Modelos de Dados

Expansão dos modelos Prisma necessários:

```prisma
// Adicionar a src/prisma/schema.prisma

// Estágio do funil de vendas
model Stage {
  id          String    @id @default(cuid())
  name        String
  description String?
  color       String?
  order       Int
  workspaceId String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  leads       Lead[]
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  
  @@unique([name, workspaceId])
  @@index([workspaceId])
  @@map("stages")
}

// Grupo de origem
model OriginGroup {
  id          String    @id @default(cuid())
  name        String
  description String?
  color       String?
  order       Int
  workspaceId String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  leads       Lead[]
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  
  @@unique([name, workspaceId])
  @@index([workspaceId])
  @@map("origin_groups")
}

// Expansão do modelo Lead existente
model Lead {
  // Campos existentes...
  
  // Novos campos
  stageId       String?
  originGroupId String?
  value         Decimal?  @db.Decimal(10, 2)
  closedAt      DateTime?
  priority      String?   
  probability   Int?      @db.SmallInt
  
  // Relações
  stage        Stage?        @relation(fields: [stageId], references: [id])
  originGroup  OriginGroup?  @relation(fields: [originGroupId], references: [id])
  tasks        Task[]
}

// Tarefas associadas a leads
model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  dueDate     DateTime?
  completed   Boolean   @default(false)
  leadId      String?
  assignedTo  String?
  createdBy   String
  workspaceId String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  lead        Lead?      @relation(fields: [leadId], references: [id])
  assignee    users?     @relation("assignedTasks", fields: [assignedTo], references: [id])
  creator     users      @relation("createdTasks", fields: [createdBy], references: [id])
  workspace   Workspace  @relation(fields: [workspaceId], references: [id])
  
  @@index([leadId])
  @@index([assignedTo])
  @@index([workspaceId])
  @@map("tasks")
}
```

## Ferramentas de Desenvolvimento

Para garantir qualidade e produtividade no desenvolvimento, recomendamos:

1. **TypeScript**: Usar tipagem estrita para todos os novos componentes e APIs
2. **ESLint**: Configurar regras específicas para os novos módulos do CRM
3. **Jest/React Testing Library**: Configurar testes automatizados
4. **Storybook**: Configurar para desenvolvimento e documentação visual de componentes

## Bibliotecas Específicas a Serem Utilizadas

Para implementar as funcionalidades essenciais, recomendamos:

1. **react-beautiful-dnd**: Para implementação da funcionalidade drag-and-drop do Kanban
2. **date-fns**: Para manipulação de datas em filtros e tarefas
3. **react-hook-form**: Para gerenciamento de formulários
4. **recharts**: Para visualizações e dashboards
5. **zod**: Para validação de dados

## Próximos Passos

1. Criar as migrações do Prisma para os novos modelos
2. Configurar os componentes básicos do Kanban
3. Implementar a estrutura de diretórios proposta
4. Configurar o ambiente de testes

## Padrões de Código

Para manter consistência com o código existente, seguiremos:

1. **Nomenclatura**: PascalCase para componentes, camelCase para funções e variáveis
2. **Organização**:
   - Componentes pequenos e focados
   - Lógica de negócios em serviços fora dos componentes
   - Contextos React para estado compartilhado
3. **Estilização**: TailwindCSS seguindo os padrões atuais do projeto
4. **API**: Endpoints RESTful padronizados 
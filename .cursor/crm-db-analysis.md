# Análise do Banco de Dados Atual e Proposta de Expansão para o CRM

## 1. Estrutura Atual Relevante para o CRM

### 1.1 Modelo de Lead

O modelo atual de Lead é bastante básico e contém os seguintes campos:

```prisma
model Lead {
  id            String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name          String?
  phone         String
  photo         String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  workspaceId   String
  conversations Conversation[]
  workspace     Workspace      @relation(fields: [workspaceId], references: [id])
  tags          ContactTags[]  @relation("LeadToContactTags")

  @@unique([phone, workspaceId])
  @@index([workspaceId])
  @@map("leads")
}
```

### 1.2 Modelo de Tags

O sistema atual possui um modelo de tags para contatos:

```prisma
model ContactTags {
  id          String    @id @default(cuid())
  name        String
  color       String
  description String?
  workspaceId String
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  leads       Lead[]    @relation("LeadToContactTags")

  @@index([workspaceId])
  @@map("contact_tags")
}
```

### 1.3 Modelos de Conversas e Mensagens

O sistema já tem modelos para gerenciar conversas e mensagens:

```prisma
model Conversation {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  leadId      String    @map("lead_id") @db.Uuid
  threadId    String?   @map("thread_id")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  workspaceId String
  channel     String?   @default("whatsapp-cloud")
  lead        Lead      @relation(fields: [leadId], references: [id])
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  messages    Message[]

  @@map("conversations")
}

model Message {
  id             String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  conversationId String       @map("conversation_id") @db.Uuid
  content        String
  sender         String       @default("agent")
  read           Boolean      @default(false)
  createdAt      DateTime     @default(now()) @map("created_at")
  mediaUrl       String?      @map("media_url")
  updatedAt      DateTime     @default(now()) @updatedAt @map("updated_at")
  type           String       @default("text")
  isManual       Boolean      @default(false) @map("is_manual")
  external_id    String?      @unique @map("external_id")
  mediaDuration  Int?         @map("media_duration")
  mediaType      String?      @map("media_type")
  conversation   Conversation @relation(fields: [conversationId], references: [id])

  @@map("messages")
}
```

### 1.4 Sistema de Permissões

O sistema já possui uma estrutura para permissões:

```prisma
model PermissionGroup {
  id          String                @id @default(cuid())
  name        String
  description String?
  isDefault   Boolean               @default(false)
  isCustom    Boolean               @default(false)
  workspaceId String
  createdBy   String?
  createdAt   DateTime              @default(now())
  updatedAt   DateTime              @updatedAt
  groupItems  PermissionGroupItem[]
  workspace   Workspace             @relation(fields: [workspaceId], references: [id])
  users       users[]

  @@unique([name, workspaceId])
  @@index([workspaceId])
  @@map("permission_groups")
}

model Permission {
  id           String                @id @default(cuid())
  key          String                @unique
  name         String
  description  String?
  category     String
  subcategory  String?
  defaultValue Boolean               @default(false)
  createdAt    DateTime              @default(now())
  updatedAt    DateTime              @updatedAt
  groupItems   PermissionGroupItem[]

  @@map("permissions")
}

model PermissionGroupItem {
  id                String          @id @default(cuid())
  permissionGroupId String
  permissionId      String
  enabled           Boolean         @default(true)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  permissionGroup   PermissionGroup @relation(fields: [permissionGroupId], references: [id], onDelete: Cascade)
  permission        Permission      @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([permissionGroupId, permissionId])
  @@index([permissionGroupId])
  @@index([permissionId])
  @@map("permission_group_items")
}
```

### 1.5 Campos de Contato Personalizados

O sistema tem suporte para campos de contato personalizados:

```prisma
model ContactField {
  id            String    @id @default(cuid())
  name          String
  type          String
  required      Boolean   @default(false)
  options       String[]  @default([])
  placeholder   String?
  default_value String?
  description   String?
  order         Int
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  workspaceId   String
  workspaces    Workspace @relation(fields: [workspaceId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@index([workspaceId])
  @@map("contact_fields")
}
```

## 2. Análise de Gap e Necessidades para o CRM

Para implementar as funcionalidades de CRM especificadas, precisamos:

1. **Expandir o modelo Lead** - Atualmente é muito básico, sem campos para pipeline, estágios ou valores
2. **Criar modelos para Pipeline e Stages** - Não existem modelos para gerenciar o funil de vendas
3. **Criar modelo para Grupos de Origem** - Necessário para a categorização na coluna esquerda
4. **Sistema de Tarefas** - Não existe modelo para tarefas relacionadas a leads
5. **Campos Dinâmicos** - Mecanismo para armazenar campos customizados de leads
6. **Sistema de Notas** - Para registrar interações não-conversacionais com leads

## 3. Proposta de Expansão do Modelo de Dados

### 3.1 Novos Modelos

#### Stage (Estágio do Funil)

```prisma
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
```

#### OriginGroup (Grupo de Origem)

```prisma
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
```

#### Task (Tarefa)

```prisma
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

#### Note (Nota)

```prisma
model Note {
  id          String    @id @default(cuid())
  content     String
  leadId      String
  createdBy   String
  workspaceId String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  lead        Lead      @relation(fields: [leadId], references: [id])
  creator     users     @relation(fields: [createdBy], references: [id])
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  
  @@index([leadId])
  @@index([createdBy])
  @@index([workspaceId])
  @@map("notes")
}
```

#### LeadCustomField (Campo Personalizado de Lead)

```prisma
model LeadCustomField {
  id          String    @id @default(cuid())
  leadId      String
  fieldId     String
  value       String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  lead        Lead        @relation(fields: [leadId], references: [id])
  field       ContactField @relation(fields: [fieldId], references: [id])
  
  @@unique([leadId, fieldId])
  @@index([leadId])
  @@index([fieldId])
  @@map("lead_custom_fields")
}
```

### 3.2 Expansão do Modelo Lead Existente

```prisma
model Lead {
  id            String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name          String?
  phone         String
  photo         String?
  email         String?        // Novo campo para email
  stageId       String?        // Novo campo para estágio no funil
  originGroupId String?        // Novo campo para grupo de origem
  value         Decimal?       @db.Decimal(10, 2) // Valor do negócio
  probability   Int?           @db.SmallInt // Probabilidade de conversão (0-100)
  expectedCloseDate DateTime?  // Data prevista para fechamento
  closedAt      DateTime?      // Data real de fechamento
  ownerId       String?        // Responsável pelo lead
  status        String?        // Status do lead (active, won, lost)
  priority      String?        // Prioridade (low, medium, high)
  source        String?        // Fonte do lead (fb, ig, website, etc)
  customFields  Json?          // Campos adicionais em formato JSON
  workspaceId   String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  // Relações existentes
  conversations Conversation[]
  workspace     Workspace      @relation(fields: [workspaceId], references: [id])
  tags          ContactTags[]  @relation("LeadToContactTags")
  
  // Novas relações
  stage         Stage?         @relation(fields: [stageId], references: [id])
  originGroup   OriginGroup?   @relation(fields: [originGroupId], references: [id])
  owner         users?         @relation("ownedLeads", fields: [ownerId], references: [id])
  tasks         Task[]
  notes         Note[]
  customValues  LeadCustomField[]

  @@unique([phone, workspaceId])
  @@index([workspaceId])
  @@index([stageId])
  @@index([originGroupId])
  @@index([ownerId])
  @@map("leads")
}
```

### 3.3 Modificações no modelo User (Usuário)

```prisma
model users {
  // Campos existentes...
  
  // Novas relações
  ownedLeads    Lead[]         @relation("ownedLeads")
  assignedTasks Task[]         @relation("assignedTasks")
  createdTasks  Task[]         @relation("createdTasks")
  notes         Note[]
}
```

## 4. Melhorias na API

### 4.1 API de Leads Aprimorada

A API de Leads existente precisa ser expandida para suportar:
- Filtragem por estágio
- Filtragem por grupo de origem
- Filtragem por proprietário
- Orderação por diferentes campos
- Paginação mais robusta

### 4.2 Novas APIs Necessárias

- API para Stages (CRUD de estágios)
- API para OriginGroups (CRUD de grupos de origem)
- API para Tasks (gerenciamento de tarefas)
- API para Notes (gerenciamento de notas)
- API para Movimentação de Leads entre estágios
- API para Estatísticas e Dashboard

## 5. Novas Permissões Necessárias

Para suportar o CRM completo, precisamos adicionar novas permissões ao sistema:

```
crm.stages.view 
crm.stages.create
crm.stages.update
crm.stages.delete

crm.origin_groups.view
crm.origin_groups.create
crm.origin_groups.update
crm.origin_groups.delete

crm.tasks.view
crm.tasks.create
crm.tasks.update
crm.tasks.delete
crm.tasks.assign

crm.notes.view
crm.notes.create
crm.notes.update
crm.notes.delete

crm.leads.change_stage
crm.leads.change_owner
crm.leads.change_origin
crm.leads.view_all
crm.leads.view_own
```

## 6. Próximos Passos

1. Implementar migrações para os novos modelos
2. Atualizar o esquema Prisma com as novas definições
3. Implementar as novas APIs
4. Modificar as APIs existentes para suportar os novos campos e relacionamentos
5. Criar as novas permissões no sistema

## 7. Considerações sobre Migração de Dados

Ao expandir o modelo Lead, precisamos considerar os leads existentes:

1. Os leads existentes terão valores nulos para os novos campos
2. Sugere-se criar um estágio padrão "Novo" ou similar para leads sem estágio
3. Implementar um script de migração para popular dados iniciais como estágios padrão 
# Sistema de Etiquetas (Labels) no NaviBot

Este documento descreve o funcionamento do sistema de etiquetas no aplicativo NaviBot, detalhando seus componentes, fluxos de dados, APIs e estrutura de banco de dados.

## Visão Geral

O sistema de etiquetas permite categorizar e organizar leads (contatos) na aplicação. As etiquetas possuem características como nome, cor e contagem de uso, e podem ser associadas a múltiplos leads.

## Estrutura do Banco de Dados

### Modelo `ContactTags`

```prisma
model ContactTags {
  id          String   @id @default(cuid())
  name        String
  color       String
  description String?
  workspaceId String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relacionamento com Workspace
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  // Relacionamento com Lead (N:N)
  leads       Lead[]

  @@index([workspaceId])
}
```

Este modelo mantém uma relação N:N (muitos-para-muitos) com o modelo `Lead`, permitindo que cada lead tenha múltiplas etiquetas e cada etiqueta seja aplicada a múltiplos leads.

## Componentes Frontend

### 1. `LabelSelector`

Componente utilizado para selecionar etiquetas em formulários de criação/edição de leads.

**Localização**: `src/app/crm/leads/components/LabelSelector.tsx`

**Principais funcionalidades**:
- Exibe etiquetas já selecionadas como badges coloridas
- Permite adicionar novas etiquetas através de um popover
- Permite remover etiquetas selecionadas
- Comunica alterações via callback `onLabelsChange`

**Props**:
```typescript
interface LabelSelectorProps {
  selectedLabels: LabelType[];
  onLabelsChange: (labels: LabelType[]) => void;
  className?: string;
}
```

### 2. `LabelsList`

Componente que exibe a lista de etiquetas na página de administração.

**Localização**: `src/app/admin/conteudos/configuracoes-contato/etiquetas/components/LabelsList.tsx`

**Principais funcionalidades**:
- Exibe todas as etiquetas em formato de tabela
- Mostra informações como ID, cor, nome e contagem de uso
- Permite ações de edição e exclusão

### 3. Interface `Label`

```typescript
export interface Label {
  id: string;
  name: string;
  color: string;
  usageCount: number;
  createdAt: string;
}
```

## Serviços e APIs

### 1. Service Client (Frontend)

**Localização**: `src/app/admin/conteudos/configuracoes-contato/etiquetas/services/labelService.ts`

**Principais funções**:
- `getAllLabels()`: Busca todas as etiquetas disponíveis
- `createLabel()`: Cria uma nova etiqueta
- `updateLabel()`: Atualiza uma etiqueta existente
- `deleteLabel()`: Remove uma etiqueta
- `searchLabels()`: Pesquisa etiquetas por termo

### 2. API Endpoints

**Localização**: `src/app/api/contact-tags/route.ts`

**Endpoints**:
- `GET /api/contact-tags`: Retorna todas as etiquetas do workspace atual
- `POST /api/contact-tags`: Cria uma nova etiqueta
- `PUT /api/contact-tags?id={id}`: Atualiza uma etiqueta existente
- `DELETE /api/contact-tags?id={id}`: Remove uma etiqueta

### 3. Integração com Leads

**API de Leads**: `src/app/api/crm/leads/route.ts`

- Na criação de leads, etiquetas são associadas via:
  ```typescript
  const lead = await prisma.lead.create({
    data: {
      // ... outros campos
      tags: {
        connect: labels.map((id) => ({ id }))
      }
    }
  });
  ```

**API de Atualização de Leads**: `src/app/api/crm/leads/[id]/route.ts`

- Na atualização de leads, etiquetas são redefinidas via:
  ```typescript
  const updatedLead = await prisma.lead.update({
    where: { id },
    data: {
      // ... outros campos
      tags: {
        set: [], // Remove todas as etiquetas
        connect: labels.map(label => ({ id: label.id })) // Reconecta as novas
      }
    }
  });
  ```

## Fluxo de Dados

1. **Criação de Etiquetas**:
   - Usuário acessa a página de administração de etiquetas
   - Adiciona uma nova etiqueta com nome e cor
   - `labelService.createLabel()` chama a API `POST /api/contact-tags`
   - API cria registro no banco e retorna a nova etiqueta

2. **Associação de Etiquetas a Leads**:
   - No formulário de criação/edição de lead, o componente `LabelSelector` permite selecionar etiquetas
   - Ao submeter o formulário, os IDs das etiquetas são enviados junto com os dados do lead
   - API processa os dados e cria/atualiza as associações no banco de dados

3. **Exibição de Leads com Etiquetas**:
   - Ao listar leads, a API inclui as etiquetas associadas a cada um
   - Frontend exibe as etiquetas como badges coloridas na interface

## Observações Técnicas

1. **Mapeamento Frontend/Backend**:
   - No backend, são chamadas de "tags" (`ContactTags`)
   - No frontend, são chamadas de "labels"
   - A conversão entre formatos é feita pela API

2. **Limitações TypeScript**:
   - O relacionamento `tags` entre `Lead` e `ContactTags` não é reconhecido automaticamente pelo TypeScript
   - Usa-se `@ts-ignore` ou `@ts-expect-error` em várias partes do código

3. **Cache e Atualização**:
   - As etiquetas são carregadas do servidor com `cache: 'no-store'` para garantir dados atualizados
   - Existe fallback para localStorage em caso de falha na API

## Melhores Práticas

1. **Criação de Etiquetas**:
   - Use cores contrastantes para melhor visualização
   - Mantenha nomes curtos e descritivos

2. **Uso em Leads**:
   - Associe etiquetas relevantes para facilitar a organização
   - Utilize a funcionalidade de pesquisa para localizar leads por etiquetas 
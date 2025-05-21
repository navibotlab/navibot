# Design da API do CRM NaviBot

## 1. Princípios Gerais

### 1.1 Padrões de Nomenclatura
- Todos os endpoints seguem o padrão RESTful
- Nomes de recursos no plural: `/leads`, `/stages`, etc.
- Parâmetros de consulta para filtragem e paginação
- Respostas consistentes para sucesso e erro
- Suporte para paginação, ordenação e filtragem

### 1.2 Formato de Resposta Padrão

#### Sucesso:
```json
{
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "pages": 5
  }
}
```

#### Erro:
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "O recurso solicitado não foi encontrado",
    "details": { ... }
  }
}
```

### 1.3 Autenticação e Autorização
- Todas as APIs exigem autenticação via token JWT
- Verificação de permissões baseada no sistema de roles/permissões
- Acesso restrito a recursos pertencentes ao workspace do usuário

## 2. API de Leads (Expansão da API Existente)

### 2.1 GET `/api/crm/leads`
Lista leads com suporte a filtragem e paginação.

**Parâmetros de Consulta:**
- `page`: número da página (default: 1)
- `pageSize`: itens por página (default: 20, max: 100)
- `search`: texto para busca em nome, telefone e email
- `stageId`: filtrar por estágio no funil
- `originGroupId`: filtrar por grupo de origem
- `ownerId`: filtrar por proprietário
- `status`: filtrar por status
- `tags`: filtrar por tags (array de IDs)
- `sortBy`: campo para ordenação
- `sortOrder`: direção de ordenação ('asc'/'desc')
- `startDate`/`endDate`: filtro por período de criação

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "João Silva",
      "phone": "+5511999999999",
      "email": "joao@example.com",
      "photo": "url_da_foto",
      "stageId": "uuid",
      "stageName": "Prospecção",
      "originGroupId": "uuid",
      "originGroupName": "Site",
      "value": 1500.00,
      "probability": 50,
      "expectedCloseDate": "2023-11-30T00:00:00Z",
      "closedAt": null,
      "ownerId": "uuid",
      "ownerName": "Maria Vendedora",
      "status": "active",
      "priority": "medium",
      "source": "website",
      "tags": [
        {
          "id": "uuid",
          "name": "Cliente VIP",
          "color": "#FF0000"
        }
      ],
      "createdAt": "2023-10-15T10:30:00Z",
      "updatedAt": "2023-10-25T14:20:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "pageSize": 20,
    "pages": 8
  }
}
```

### 2.2 GET `/api/crm/leads/:id`
Obtém um lead específico com seus detalhes completos.

**Resposta:**
```json
{
  "id": "uuid",
  "name": "João Silva",
  "phone": "+5511999999999",
  "email": "joao@example.com",
  "photo": "url_da_foto",
  "stageId": "uuid",
  "stage": {
    "id": "uuid",
    "name": "Prospecção",
    "color": "#00AAFF"
  },
  "originGroupId": "uuid",
  "originGroup": {
    "id": "uuid",
    "name": "Site",
    "color": "#00FF00"
  },
  "value": 1500.00,
  "probability": 50,
  "expectedCloseDate": "2023-11-30T00:00:00Z",
  "closedAt": null,
  "ownerId": "uuid",
  "owner": {
    "id": "uuid",
    "name": "Maria Vendedora",
    "email": "maria@example.com"
  },
  "status": "active",
  "priority": "medium",
  "source": "website",
  "tags": [
    {
      "id": "uuid",
      "name": "Cliente VIP",
      "color": "#FF0000"
    }
  ],
  "tasks": [
    {
      "id": "uuid",
      "title": "Ligar para cliente",
      "completed": false,
      "dueDate": "2023-11-01T10:00:00Z"
    }
  ],
  "notes": [
    {
      "id": "uuid",
      "content": "Cliente interessado em pacote premium",
      "createdBy": "uuid",
      "createdByName": "Maria Vendedora",
      "createdAt": "2023-10-20T15:45:00Z"
    }
  ],
  "customFields": {
    "empresa": "Empresa XYZ",
    "cargo": "Diretor"
  },
  "createdAt": "2023-10-15T10:30:00Z",
  "updatedAt": "2023-10-25T14:20:00Z"
}
```

### 2.3 POST `/api/crm/leads`
Cria um novo lead.

**Corpo da Requisição:**
```json
{
  "name": "João Silva",
  "phone": "+5511999999999",
  "email": "joao@example.com",
  "stageId": "uuid",
  "originGroupId": "uuid",
  "value": 1500.00,
  "probability": 50,
  "expectedCloseDate": "2023-11-30T00:00:00Z",
  "ownerId": "uuid",
  "priority": "medium",
  "source": "website",
  "tags": ["tagId1", "tagId2"],
  "customFields": {
    "empresa": "Empresa XYZ",
    "cargo": "Diretor"
  }
}
```

**Resposta:** Lead criado com status 201.

### 2.4 PUT `/api/crm/leads/:id`
Atualiza um lead existente.

**Corpo da Requisição:** Mesmos campos do POST, todos opcionais.

**Resposta:** Lead atualizado.

### 2.5 DELETE `/api/crm/leads/:id`
Remove um lead existente.

**Resposta:** Status 204 sem conteúdo.

### 2.6 POST `/api/crm/leads/:id/move`
Move um lead para outro estágio do funil.

**Corpo da Requisição:**
```json
{
  "stageId": "uuid",
  "notes": "Cliente progrediu após demonstração do produto"
}
```

**Resposta:** Lead atualizado com o novo estágio.

### 2.7 POST `/api/crm/leads/:id/assign`
Atribui um lead a um usuário.

**Corpo da Requisição:**
```json
{
  "ownerId": "uuid",
  "notes": "Atribuindo ao vendedor da região"
}
```

**Resposta:** Lead atualizado com o novo proprietário.

### 2.8 POST `/api/crm/leads/import`
Importa múltiplos leads.

**Corpo da Requisição:**
```json
{
  "leads": [
    {
      "name": "João Silva",
      "phone": "+5511999999999",
      "email": "joao@example.com",
      "stageId": "uuid",
      // Outros campos...
    }
    // Mais leads...
  ],
  "options": {
    "skipDuplicates": true,
    "defaultStageId": "uuid",
    "defaultOriginGroupId": "uuid"
  }
}
```

**Resposta:**
```json
{
  "imported": 15,
  "skipped": 3,
  "errors": 2,
  "details": [
    { "row": 4, "error": "Telefone inválido" }
    // Outros erros...
  ]
}
```

## 3. API de Stages (Estágios do Funil)

### 3.1 GET `/api/crm/stages`
Lista todos os estágios do funil.

**Parâmetros de Consulta:**
- `includeLeadCount`: incluir contagem de leads em cada estágio (boolean)

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Entrada",
      "description": "Leads recém-adicionados",
      "color": "#00AAFF",
      "order": 1,
      "leadCount": 42,
      "createdAt": "2023-09-10T10:00:00Z",
      "updatedAt": "2023-09-10T10:00:00Z"
    }
    // Mais estágios...
  ]
}
```

### 3.2 POST `/api/crm/stages`
Cria um novo estágio no funil.

**Corpo da Requisição:**
```json
{
  "name": "Demonstração",
  "description": "Fase de demonstração do produto",
  "color": "#FF00AA",
  "order": 3
}
```

**Resposta:** Estágio criado com status 201.

### 3.3 PUT `/api/crm/stages/:id`
Atualiza um estágio existente.

**Corpo da Requisição:** Mesmos campos do POST, todos opcionais.

**Resposta:** Estágio atualizado.

### 3.4 DELETE `/api/crm/stages/:id`
Remove um estágio existente.

**Parâmetros de Consulta:**
- `moveLeadsTo`: ID do estágio para onde os leads devem ser movidos

**Resposta:** Status 204 sem conteúdo.

### 3.5 PUT `/api/crm/stages/reorder`
Reordena os estágios do funil.

**Corpo da Requisição:**
```json
{
  "orders": [
    { "id": "uuid1", "order": 1 },
    { "id": "uuid2", "order": 2 },
    { "id": "uuid3", "order": 3 }
  ]
}
```

**Resposta:** Array com estágios reordenados.

## 4. API de Origin Groups (Grupos de Origem)

### 4.1 GET `/api/crm/origin-groups`
Lista todos os grupos de origem.

**Parâmetros de Consulta:**
- `includeLeadCount`: incluir contagem de leads em cada grupo (boolean)

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Website",
      "description": "Leads do site",
      "color": "#00FF00",
      "order": 1,
      "leadCount": 37,
      "createdAt": "2023-09-10T10:00:00Z",
      "updatedAt": "2023-09-10T10:00:00Z"
    }
    // Mais grupos...
  ]
}
```

### 4.2 POST `/api/crm/origin-groups`
Cria um novo grupo de origem.

**Corpo da Requisição:**
```json
{
  "name": "Indicações",
  "description": "Leads de indicações de clientes",
  "color": "#FFAA00",
  "order": 3
}
```

**Resposta:** Grupo criado com status 201.

### 4.3 PUT `/api/crm/origin-groups/:id`
Atualiza um grupo de origem existente.

**Corpo da Requisição:** Mesmos campos do POST, todos opcionais.

**Resposta:** Grupo atualizado.

### 4.4 DELETE `/api/crm/origin-groups/:id`
Remove um grupo de origem existente.

**Parâmetros de Consulta:**
- `moveLeadsTo`: ID do grupo para onde os leads devem ser movidos

**Resposta:** Status 204 sem conteúdo.

### 4.5 PUT `/api/crm/origin-groups/reorder`
Reordena os grupos de origem.

**Corpo da Requisição:**
```json
{
  "orders": [
    { "id": "uuid1", "order": 1 },
    { "id": "uuid2", "order": 2 },
    { "id": "uuid3", "order": 3 }
  ]
}
```

**Resposta:** Array com grupos reordenados.

## 5. API de Tasks (Tarefas)

### 5.1 GET `/api/crm/tasks`
Lista tarefas com suporte a filtragem e paginação.

**Parâmetros de Consulta:**
- `page`: número da página (default: 1)
- `pageSize`: itens por página (default: 20, max: 100)
- `leadId`: filtrar por lead associado
- `assignedTo`: filtrar por usuário designado
- `completed`: filtrar por status (boolean)
- `dueStart`/`dueEnd`: filtro por data de vencimento
- `sortBy`: campo para ordenação
- `sortOrder`: direção de ordenação ('asc'/'desc')

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Enviar proposta comercial",
      "description": "Preparar proposta com detalhes do pacote premium",
      "dueDate": "2023-11-05T16:00:00Z",
      "completed": false,
      "leadId": "uuid",
      "leadName": "João Silva",
      "assignedTo": "uuid",
      "assigneeName": "Maria Vendedora",
      "createdBy": "uuid",
      "createdByName": "Carlos Supervisor",
      "createdAt": "2023-10-28T10:30:00Z",
      "updatedAt": "2023-10-28T10:30:00Z"
    }
    // Mais tarefas...
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "pageSize": 20,
    "pages": 3
  }
}
```

### 5.2 GET `/api/crm/tasks/:id`
Obtém uma tarefa específica.

**Resposta:** Tarefa detalhada.

### 5.3 POST `/api/crm/tasks`
Cria uma nova tarefa.

**Corpo da Requisição:**
```json
{
  "title": "Fazer ligação de acompanhamento",
  "description": "Verificar se o cliente recebeu a proposta",
  "dueDate": "2023-11-10T14:00:00Z",
  "leadId": "uuid",
  "assignedTo": "uuid"
}
```

**Resposta:** Tarefa criada com status 201.

### 5.4 PUT `/api/crm/tasks/:id`
Atualiza uma tarefa existente.

**Corpo da Requisição:** Mesmos campos do POST, todos opcionais.

**Resposta:** Tarefa atualizada.

### 5.5 PATCH `/api/crm/tasks/:id/complete`
Marca uma tarefa como concluída.

**Corpo da Requisição:**
```json
{
  "completed": true
}
```

**Resposta:** Tarefa atualizada.

### 5.6 DELETE `/api/crm/tasks/:id`
Remove uma tarefa existente.

**Resposta:** Status 204 sem conteúdo.

## 6. API de Notes (Notas)

### 6.1 GET `/api/crm/leads/:leadId/notes`
Lista notas de um lead específico.

**Parâmetros de Consulta:**
- `page`: número da página (default: 1)
- `pageSize`: itens por página (default: 20, max: 100)
- `sortBy`: campo para ordenação (default: 'createdAt')
- `sortOrder`: direção de ordenação (default: 'desc')

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Cliente solicitou mais informações sobre o serviço premium",
      "leadId": "uuid",
      "createdBy": "uuid",
      "createdByName": "Maria Vendedora",
      "createdAt": "2023-10-28T10:30:00Z",
      "updatedAt": "2023-10-28T10:30:00Z"
    }
    // Mais notas...
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "pageSize": 20,
    "pages": 1
  }
}
```

### 6.2 POST `/api/crm/leads/:leadId/notes`
Cria uma nova nota para um lead.

**Corpo da Requisição:**
```json
{
  "content": "Cliente demonstrou interesse no plano anual"
}
```

**Resposta:** Nota criada com status 201.

### 6.3 PUT `/api/crm/notes/:id`
Atualiza uma nota existente.

**Corpo da Requisição:**
```json
{
  "content": "Cliente demonstrou interesse no plano anual e solicitou desconto"
}
```

**Resposta:** Nota atualizada.

### 6.4 DELETE `/api/crm/notes/:id`
Remove uma nota existente.

**Resposta:** Status 204 sem conteúdo.

## 7. API de Dashboard (Estatísticas)

### 7.1 GET `/api/crm/dashboard`
Obtém estatísticas gerais para o dashboard.

**Parâmetros de Consulta:**
- `period`: período para análise ('week', 'month', 'quarter', 'year')
- `startDate`/`endDate`: período customizado

**Resposta:**
```json
{
  "summary": {
    "totalLeads": 487,
    "newLeads": 42,
    "wonDeals": 18,
    "lostDeals": 15,
    "totalValue": 127500.00,
    "avgDealValue": 7083.33,
    "avgConversionTime": 14.5,
    "conversionRate": 32.7
  },
  "byStage": [
    {
      "stageId": "uuid",
      "stageName": "Entrada",
      "count": 87,
      "percentage": 17.9
    }
    // Mais estágios...
  ],
  "byOrigin": [
    {
      "originGroupId": "uuid",
      "originGroupName": "Website",
      "count": 156,
      "percentage": 32.0
    }
    // Mais origens...
  ],
  "byOwner": [
    {
      "ownerId": "uuid",
      "ownerName": "Maria Vendedora",
      "count": 98,
      "value": 35000.00,
      "won": 7
    }
    // Mais vendedores...
  ],
  "timeline": {
    "labels": ["2023-10-01", "2023-10-02", "2023-10-03"],
    "newLeads": [5, 8, 3],
    "wonDeals": [1, 2, 0],
    "lostDeals": [0, 1, 2]
  }
}
```

### 7.2 GET `/api/crm/dashboard/funnel`
Obtém dados para visualização do funil de vendas.

**Parâmetros de Consulta:**
- `period`: período para análise ('week', 'month', 'quarter', 'year')
- `startDate`/`endDate`: período customizado

**Resposta:**
```json
{
  "stages": [
    {
      "id": "uuid",
      "name": "Entrada",
      "count": 100,
      "value": 350000.00,
      "conversionRate": 80.0,
      "averageTime": 2.5
    },
    {
      "id": "uuid",
      "name": "Qualificação",
      "count": 80,
      "value": 280000.00,
      "conversionRate": 75.0,
      "averageTime": 3.2
    }
    // Mais estágios...
  ],
  "totalValue": 350000.00,
  "overallConversionRate": 18.0,
  "averageCycleTime": 14.7
}
```

### 7.3 GET `/api/crm/dashboard/performance`
Obtém dados de performance dos vendedores.

**Parâmetros de Consulta:**
- `period`: período para análise ('week', 'month', 'quarter', 'year')
- `startDate`/`endDate`: período customizado

**Resposta:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Maria Vendedora",
      "avatar": "url_avatar",
      "metrics": {
        "leadsAssigned": 45,
        "dealsWon": 12,
        "dealsLost": 8,
        "conversionRate": 26.7,
        "totalValue": 42000.00,
        "avgDealValue": 3500.00,
        "avgResponseTime": 1.2,
        "avgCycleTime": 13.5
      }
    }
    // Mais vendedores...
  ]
}
```

## 8. APIs de Integração

### 8.1 Webhooks

#### 8.1.1 POST `/api/crm/webhooks`
Registra um novo webhook para notificações de eventos.

**Corpo da Requisição:**
```json
{
  "url": "https://exemplo.com/webhook",
  "secret": "chave_secreta_para_assinatura",
  "events": ["lead.created", "lead.updated", "lead.stage_changed", "task.completed"]
}
```

**Resposta:** Webhook registrado com status 201.

#### 8.1.2 GET `/api/crm/webhooks`
Lista webhooks registrados.

**Resposta:** Lista de webhooks.

#### 8.1.3 DELETE `/api/crm/webhooks/:id`
Remove um webhook registrado.

**Resposta:** Status 204 sem conteúdo.

### 8.2 API Externa para Leads

#### 8.2.1 POST `/api/v1/leads/external`
Endpoint público para receber leads de sistemas externos.

**Headers:**
- `X-API-Key`: Chave de API para autenticação

**Corpo da Requisição:**
```json
{
  "name": "João Silva",
  "phone": "+5511999999999",
  "email": "joao@example.com",
  "source": "facebook_form",
  "customFields": {
    "interesse": "Pacote Premium",
    "valor": "1500"
  }
}
```

**Resposta:** Lead criado com status 201.

## 9. Considerações de Segurança e Performance

### 9.1 Ratelimiting
- Limite de 60 requisições por minuto para APIs normais
- Limite de 10 requisições por minuto para operações pesadas (importação, dashboard)
- Limite de 1000 leads por requisição para API de importação

### 9.2 Caching
- Cache de 5 minutos para dados de dashboard
- ETags para otimização de recursos estáticos (stages, origin-groups) 
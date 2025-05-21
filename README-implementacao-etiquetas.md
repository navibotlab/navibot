# Implementação do Seletor de Etiquetas em Novos Componentes

Este guia demonstra como adicionar o componente de seleção de etiquetas em qualquer novo formulário ou componente da aplicação NaviBot.

## Visão Geral

O componente `LabelSelector` permite que usuários selecionem etiquetas (labels) de uma lista existente para associar a entidades como leads, conversas ou outros elementos do sistema.

## Pré-requisitos

Antes de implementar o seletor de etiquetas, verifique se você tem acesso aos seguintes arquivos:

- `src/app/crm/leads/components/LabelSelector.tsx` - Componente de seleção
- `src/app/admin/conteudos/configuracoes-contato/etiquetas/components/LabelsList.tsx` - Contém a interface `Label`
- `src/app/admin/conteudos/configuracoes-contato/etiquetas/services/labelService.ts` - Serviço para buscar etiquetas

## Passos para Implementação

### 1. Importar os componentes e tipos necessários

```tsx
import { LabelSelector } from '@/app/crm/leads/components/LabelSelector';
import { Label as LabelType } from '@/app/admin/conteudos/configuracoes-contato/etiquetas/components/LabelsList';
```

### 2. Adicionar estado para gerenciar as etiquetas selecionadas

```tsx
// No seu componente funcional
const [selectedLabels, setSelectedLabels] = useState<LabelType[]>([]);
```

### 3. Implementar a função de callback para mudanças nas etiquetas

```tsx
const handleLabelsChange = (labels: LabelType[]) => {
  console.log("Etiquetas selecionadas:", labels);
  setSelectedLabels(labels);
};
```

### 4. Adicionar o componente LabelSelector ao seu JSX

```tsx
<div className="space-y-2">
  <Label htmlFor="labels">Etiquetas</Label>
  <LabelSelector 
    selectedLabels={selectedLabels} 
    onLabelsChange={handleLabelsChange} 
    className="w-full"
  />
  
  {/* Opcional: Exibir badges das etiquetas selecionadas */}
  {selectedLabels.length > 0 && (
    <div className="flex flex-wrap gap-1 mt-2">
      {selectedLabels.map((label) => (
        <Badge 
          key={label.id} 
          style={{ backgroundColor: label.color }}
          className="text-white"
        >
          {label.name}
        </Badge>
      ))}
    </div>
  )}
</div>
```

### 5. Incluir os IDs das etiquetas no payload ao submeter o formulário

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Preparar payload com etiquetas
  const payload = {
    ...outrosDados,
    labels: selectedLabels.map(label => label.id) // Enviar apenas os IDs
  };
  
  // Enviar para a API
  await api.post('/seu-endpoint', payload);
};
```

## Exemplo Completo

Aqui está um exemplo mínimo e completo de implementação:

```tsx
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LabelSelector } from '@/app/crm/leads/components/LabelSelector';
import { Label as LabelType } from '@/app/admin/conteudos/configuracoes-contato/etiquetas/components/LabelsList';

export function MeuFormulario() {
  const [selectedLabels, setSelectedLabels] = useState<LabelType[]>([]);
  
  const handleLabelsChange = (labels: LabelType[]) => {
    setSelectedLabels(labels);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      // outros campos do formulário
      labels: selectedLabels.map(label => label.id)
    };
    
    try {
      // Enviar dados para API
      console.log("Enviando:", payload);
    } catch (error) {
      console.error("Erro:", error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Outros campos do formulário */}
      
      <div className="space-y-2 mb-4">
        <Label>Etiquetas</Label>
        <LabelSelector 
          selectedLabels={selectedLabels} 
          onLabelsChange={handleLabelsChange} 
        />
      </div>
      
      <Button type="submit">Salvar</Button>
    </form>
  );
}
```

## Tratamento no Backend

No backend, assegure-se de que sua rota da API processe corretamente o campo `labels`:

```typescript
// Trecho de código para uma rota POST de API
const { labels = [] } = req.body;

// Preparar a conexão com etiquetas
let tagsConnect;
if (Array.isArray(labels) && labels.length > 0) {
  tagsConnect = {
    connect: labels.map((id) => ({ id }))
  };
} else {
  tagsConnect = undefined;
}

// Criar ou atualizar entidade com as etiquetas
const entidade = await prisma.suaEntidade.create({
  data: {
    // outros campos
    tags: tagsConnect
  }
});
```

## Considerações Adicionais

1. **Carregamento inicial de etiquetas selecionadas:**
   - Ao editar um registro existente, carregue as etiquetas previamente selecionadas:
   ```tsx
   useEffect(() => {
     if (entidadeExistente?.labels) {
       setSelectedLabels(entidadeExistente.labels);
     }
   }, [entidadeExistente]);
   ```

2. **Estilização adicional:**
   - O componente aceita uma prop `className` para personalização:
   ```tsx
   <LabelSelector 
     selectedLabels={selectedLabels} 
     onLabelsChange={handleLabelsChange} 
     className="w-full border-gray-700 bg-gray-800"
   />
   ```

3. **Validação:**
   - Adicione validação caso etiquetas sejam obrigatórias:
   ```tsx
   const validarFormulario = () => {
     const erros = {};
     if (selectedLabels.length === 0) {
       erros.labels = "Selecione pelo menos uma etiqueta";
     }
     return erros;
   };
   ``` 
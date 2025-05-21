# Implementação de Filtro por Etiquetas

Este documento detalha como implementar um filtro por etiquetas na interface de listagem de leads ou outros elementos do NaviBot.

## Visão Geral

O filtro por etiquetas permite que os usuários visualizem apenas os leads que possuem determinadas etiquetas, facilitando a organização e o acesso a contatos específicos.

## Estrutura do Componente de Filtro

### Interface do Filtro

O componente de filtro por etiquetas deve permitir:
1. Selecionar uma ou mais etiquetas para filtrar
2. Limpar facilmente os filtros aplicados
3. Indicar visualmente que um filtro está ativo

## Implementação

### 1. Estado para Gerenciar os Filtros

Adicione os seguintes estados ao seu componente de listagem:

```tsx
// Estados para filtro de etiquetas
const [filterLabels, setFilterLabels] = useState<LabelType[]>([]);
const [showLabelFilter, setShowLabelFilter] = useState(false);
const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
```

### 2. Função para Aplicar o Filtro

```tsx
// Aplicar filtro por etiquetas
const applyLabelFilter = useCallback(() => {
  if (!leads || leads.length === 0) {
    setFilteredLeads([]);
    return;
  }

  if (filterLabels.length === 0) {
    // Se não houver etiquetas selecionadas, mostrar todos os leads
    setFilteredLeads(leads);
    return;
  }

  // Filtra leads que têm pelo menos uma das etiquetas selecionadas
  const filtered = leads.filter(lead => {
    // Se o lead não tem etiquetas, não passa no filtro
    if (!lead.labels || lead.labels.length === 0) return false;
    
    // Verifica se alguma das etiquetas do lead está no filtro
    return lead.labels.some(leadLabel => 
      filterLabels.some(filterLabel => filterLabel.id === leadLabel.id)
    );
  });

  setFilteredLeads(filtered);
}, [leads, filterLabels]);
```

### 3. Efeito para Atualizar a Lista Filtrada

```tsx
// Atualiza a lista filtrada quando os leads ou filtros mudarem
useEffect(() => {
  applyLabelFilter();
}, [applyLabelFilter, leads, filterLabels]);
```

### 4. Componente de UI para o Filtro

```tsx
// Componente de Popover para Filtro de Etiquetas
function LabelFilterPopover() {
  const [availableLabels, setAvailableLabels] = useState<LabelType[]>([]);
  const [loading, setLoading] = useState(false);

  // Carrega todas as etiquetas disponíveis
  useEffect(() => {
    const loadLabels = async () => {
      setLoading(true);
      try {
        const labels = await getAllLabels();
        setAvailableLabels(labels);
      } catch (error) {
        console.error('Erro ao carregar etiquetas:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadLabels();
  }, []);

  // Adiciona uma etiqueta ao filtro
  const addLabelToFilter = (label: LabelType) => {
    if (!filterLabels.some(l => l.id === label.id)) {
      setFilterLabels(prev => [...prev, label]);
    }
  };

  // Remove uma etiqueta do filtro
  const removeLabelFromFilter = (labelId: string) => {
    setFilterLabels(prev => prev.filter(l => l.id !== labelId));
  };

  // Limpa todas as etiquetas do filtro
  const clearLabelFilter = () => {
    setFilterLabels([]);
    setShowLabelFilter(false);
  };

  return (
    <Popover open={showLabelFilter} onOpenChange={setShowLabelFilter}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`gap-2 ${filterLabels.length > 0 ? 'bg-blue-900/30 text-blue-400 border-blue-800' : ''}`}
        >
          <Tag className="h-4 w-4" />
          Etiquetas
          {filterLabels.length > 0 && (
            <Badge variant="secondary" className="ml-1 bg-blue-800 text-blue-100">
              {filterLabels.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar etiqueta..." />
          <CommandList>
            <CommandEmpty>Nenhuma etiqueta encontrada.</CommandEmpty>
            <CommandGroup>
              {loading ? (
                <div className="flex justify-center p-4">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : (
                availableLabels.map(label => (
                  <CommandItem
                    key={label.id}
                    onSelect={() => addLabelToFilter(label)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: label.color }} 
                      />
                      <span>{label.name}</span>
                    </div>
                    {filterLabels.some(l => l.id === label.id) && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
          {filterLabels.length > 0 && (
            <div className="border-t border-gray-800 p-3">
              <div className="mb-2">
                <span className="text-sm font-medium">Filtros aplicados:</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {filterLabels.map(label => (
                  <Badge 
                    key={label.id}
                    style={{ backgroundColor: label.color }}
                    className="text-white flex items-center gap-1 pr-1"
                  >
                    {label.name}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-gray-200" 
                      onClick={() => removeLabelFromFilter(label.id)}
                    />
                  </Badge>
                ))}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-center"
                onClick={clearLabelFilter}
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

### 5. Adicionar o Componente à Barra de Ferramentas

```tsx
<div className="flex items-center gap-2 flex-wrap">
  {/* Outros controles... */}
  <LabelFilterPopover />
</div>
```

### 6. Renderizar Lista Filtrada

Modifique a renderização da sua lista para usar o estado `filteredLeads` em vez da lista original:

```tsx
{filteredLeads.length > 0 ? (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {filteredLeads.map(lead => (
      <LeadCard 
        key={lead.id} 
        lead={lead}
        onEdit={() => handleEditLead(lead)}
        onDelete={() => handleDeleteLead(lead)}
      />
    ))}
  </div>
) : (
  <div className="text-center py-10">
    <p className="text-gray-400">
      {filterLabels.length > 0 
        ? "Nenhum contato encontrado com as etiquetas selecionadas." 
        : "Nenhum contato encontrado."}
    </p>
  </div>
)}
```

## API e Backend

Para uso eficiente deste filtro, você pode optar por:

### 1. Filtro no Frontend (como implementado acima)
- Vantagem: Resposta imediata para o usuário
- Desvantagem: Ineficiente para grandes conjuntos de dados

### 2. Filtro no Backend (implementação alternativa)
- Envie os IDs das etiquetas para a API e filtre no banco de dados

```typescript
// No backend (exemplo de rota que aceita filtros)
export async function GET(req: NextRequest) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    const url = new URL(req.url);
    
    // Extrair IDs de etiquetas da query
    const labelIds = url.searchParams.get('labels')?.split(',') || [];
    
    let whereClause: any = {
      workspace: {
        id: workspaceId
      }
    };
    
    // Adicionar filtro de etiquetas se houver
    if (labelIds.length > 0) {
      whereClause.tags = {
        some: {
          id: {
            in: labelIds
          }
        }
      };
    }
    
    // @ts-ignore - O relacionamento 'tags' existe no banco mas não é reconhecido
    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        tags: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Formatar resposta...
    
    return NextResponse.json(formattedLeads);
  } catch (error) {
    // Tratamento de erro...
  }
}
```

## Importações Necessárias

```tsx
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag, Check, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { getAllLabels } from '@/app/admin/conteudos/configuracoes-contato/etiquetas/services/labelService';
import { Label as LabelType } from '@/app/admin/conteudos/configuracoes-contato/etiquetas/components/LabelsList';
```

## Considerações

1. **Performance**:
   - Para listas grandes, considere implementar o filtro no backend
   - Use virtualização para renderizar apenas os itens visíveis

2. **Experiência do Usuário**:
   - Adicione animações suaves para transições de filtro
   - Mantenha os filtros entre navegações usando estado global ou URL

3. **SEO e Acessibilidade**:
   - Adicione `aria-label` e outros atributos de acessibilidade
   - Use URLs com query params para permitir compartilhar filtros 
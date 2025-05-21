'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { 
  Plus, 
  X, 
  Check,
  Tag,
  Search,
  RefreshCcw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

// Interface para as etiquetas
export interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface LeadTagsTabProps {
  leadId: string;
  onUpdate?: () => void;
}

export function LeadTagsTab({ leadId, onUpdate }: LeadTagsTabProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [leadLabels, setLeadLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const { toast } = useToast();

  // Carregar etiquetas do lead
  useEffect(() => {
    if (!leadId || isLoading || dataLoaded) return;
    
    const fetchLeadLabels = async () => {
      console.log('LeadTagsTab: Iniciando carregamento de etiquetas para lead:', leadId);
      setIsLoading(true);
      try {
        // Buscar as etiquetas do lead
        const response = await fetch(`/api/crm/leads/${leadId}`);
        if (!response.ok) {
          throw new Error('Erro ao buscar dados do contato');
        }
        
        const leadData = await response.json();
        console.log('LeadTagsTab: Dados do lead carregados:', leadData);
        
        // Verificar se o lead tem a propriedade labels
        if (leadData.labels && Array.isArray(leadData.labels)) {
          console.log('LeadTagsTab: Etiquetas encontradas:', leadData.labels.length);
          setLeadLabels(leadData.labels);
        } else {
          console.log('LeadTagsTab: Nenhuma etiqueta encontrada para o lead');
          setLeadLabels([]);
        }
        
        // Marcar como carregado independentemente do resultado
        setDataLoaded(true);
      } catch (error) {
        console.error('LeadTagsTab: Erro ao carregar etiquetas do lead:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as etiquetas do contato",
          variant: "destructive",
        });
        // Mesmo em caso de erro, marcar como carregado para evitar loop
        setDataLoaded(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeadLabels();
  }, [leadId, toast, isLoading, dataLoaded]);

  // Carregar todas as etiquetas disponíveis quando o seletor é aberto
  useEffect(() => {
    if (!showSelector) return;
    
    const fetchAllLabels = async () => {
      try {
        const response = await fetch('/api/crm/labels');
        if (!response.ok) {
          throw new Error('Erro ao buscar etiquetas');
        }
        
        const data = await response.json();
        setLabels(data);
      } catch (error) {
        console.error('Erro ao carregar etiquetas:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as etiquetas disponíveis",
          variant: "destructive",
        });
      }
    };
    
    fetchAllLabels();
  }, [showSelector, toast]);

  // Adicionar etiqueta ao lead
  const addLabelToLead = async (label: Label) => {
    if (!leadId) return;
    
    // Verificar se a etiqueta já está associada ao lead
    if (leadLabels.some(l => l.id === label.id)) {
      toast({
        title: "Informação",
        description: "Esta etiqueta já está associada ao contato",
      });
      return;
    }
    
    setIsUpdating(true);
    try {
      // Criar uma cópia das etiquetas atuais e adicionar a nova
      const updatedLabels = [...leadLabels, label];
      
      // Enviar atualização para API
      const response = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          labels: updatedLabels.map(label => ({ id: label.id }))
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar etiquetas');
      }
      
      // Atualizar estado local
      setLeadLabels(updatedLabels);
      
      toast({
        title: "Sucesso",
        description: "Etiqueta adicionada com sucesso",
      });
      
      // Fechar o seletor
      setShowSelector(false);
      
      // Notificar o componente pai para atualizar
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Erro ao adicionar etiqueta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a etiqueta",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Remover etiqueta do lead
  const removeLabelFromLead = async (labelId: string) => {
    if (!leadId) return;
    
    setIsUpdating(true);
    try {
      // Filtrar a etiqueta a ser removida
      const updatedLabels = leadLabels.filter(label => label.id !== labelId);
      
      // Enviar atualização para API
      const response = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          labels: updatedLabels.map(label => ({ id: label.id }))
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar etiquetas');
      }
      
      // Atualizar estado local
      setLeadLabels(updatedLabels);
      
      toast({
        title: "Sucesso",
        description: "Etiqueta removida com sucesso",
      });
      
      // Notificar o componente pai para atualizar
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Erro ao remover etiqueta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a etiqueta",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Função para recarregar os dados manualmente
  const reloadLabels = () => {
    setDataLoaded(false); // Resetar o estado para forçar nova carga de dados
  };

  // Filtrar etiquetas com base na pesquisa
  const filteredLabels = labels.filter(label => 
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">Etiquetas</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={reloadLabels}
            className="h-8 w-8 p-0 text-gray-400 hover:bg-gray-800 hover:text-white"
            disabled={isLoading || isUpdating}
            title="Atualizar etiquetas"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSelector(!showSelector)}
            className="h-8 text-xs border-gray-800 bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white"
            disabled={isLoading || isUpdating}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Adicionar Etiqueta
          </Button>
        </div>
      </div>

      {/* Seletor de etiquetas */}
      {showSelector && (
        <div className="mb-4 border border-gray-800 rounded-md bg-[#1E2228] p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar etiqueta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-[#15171B] border-gray-800 text-sm text-white h-9"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSelector(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Lista de etiquetas disponíveis */}
          <div className="max-h-60 overflow-y-auto rounded-md border border-gray-800 bg-[#15171B]">
            {labels.length === 0 ? (
              <div className="p-3 text-center text-gray-400 text-sm">
                Nenhuma etiqueta disponível
              </div>
            ) : filteredLabels.length === 0 ? (
              <div className="p-3 text-center text-gray-400 text-sm">
                Nenhum resultado para "{searchTerm}"
              </div>
            ) : (
              filteredLabels.map(label => {
                const isSelected = leadLabels.some(l => l.id === label.id);
                return (
                  <button
                    key={label.id}
                    type="button"
                    className={`w-full flex items-center gap-2 p-2 text-white hover:bg-gray-800 text-left text-sm ${
                      isSelected ? "bg-gray-800/50" : ""
                    }`}
                    onClick={() => addLabelToLead(label)}
                    disabled={isUpdating}
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="flex-1">{label.name}</span>
                    {isSelected && <Check className="h-4 w-4 text-green-500" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
      
      {/* Lista de etiquetas do lead */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <Spinner className="h-6 w-6" />
          </div>
        ) : dataLoaded && leadLabels.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gray-800 rounded-md bg-[#15171B]/50">
            <Tag className="h-8 w-8 mx-auto mb-2 text-gray-500" />
            <p className="text-gray-400 text-sm">
              Este contato não possui etiquetas
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowSelector(true)}
              className="text-blue-400 hover:text-blue-300 text-xs mt-1"
            >
              Adicionar agora
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {leadLabels.map(label => (
              <Badge 
                key={label.id} 
                className="flex items-center gap-1 py-1 px-2"
                style={{ backgroundColor: label.color }}
              >
                <span className="text-white">{label.name}</span>
                <button 
                  type="button"
                  onClick={() => removeLabelFromLead(label.id)}
                  className="text-white/80 hover:text-white"
                  disabled={isUpdating}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
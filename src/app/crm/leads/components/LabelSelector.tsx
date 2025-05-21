'use client';

import { useState, useEffect } from 'react';
import { Check, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Label as LabelType } from '@/app/admin/conteudos/configuracoes-contato/etiquetas/components/LabelsList';
import { getAllLabels } from '@/app/admin/conteudos/configuracoes-contato/etiquetas/services/labelService';

interface LabelSelectorProps {
  selectedLabels: LabelType[];
  onLabelsChange: (labels: LabelType[]) => void;
  className?: string;
}

export function LabelSelector({ selectedLabels, onLabelsChange, className }: LabelSelectorProps) {
  const [showList, setShowList] = useState(false);
  const [labels, setLabels] = useState<LabelType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  console.log('LabelSelector render - selectedLabels:', selectedLabels.length);

  // Carregar etiquetas disponíveis quando o componente for montado
  useEffect(() => {
    console.log('LabelSelector: Carregando etiquetas...');
    
    const loadLabels = async () => {
      setLoading(true);
      try {
        const labelsList = await getAllLabels();
        console.log("LabelSelector: Etiquetas carregadas com sucesso:", labelsList.length);
        setLabels(labelsList);
      } catch (error) {
        console.error('LabelSelector: Erro ao carregar etiquetas:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadLabels();
  }, []);
  
  // Filtrar etiquetas com base na busca
  const filteredLabels = labels.filter(label => 
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Adicionar etiqueta
  const handleAddLabel = (label: LabelType) => {
    console.log('LabelSelector: Tentando adicionar etiqueta:', label.name);
    
    // Verificar se já está selecionada
    if (!selectedLabels.some(l => l.id === label.id)) {
      console.log('LabelSelector: Etiqueta não está selecionada, adicionando...');
      const newLabels = [...selectedLabels, label];
      console.log('LabelSelector: Novas etiquetas:', newLabels.map(l => l.name).join(', '));
      onLabelsChange(newLabels);
    } else {
      console.log('LabelSelector: Etiqueta já está selecionada.');
    }
    
    // Fechar lista
    setShowList(false);
  };
  
  // Remover etiqueta
  const handleRemoveLabel = (id: string) => {
    console.log('LabelSelector: Removendo etiqueta:', id);
    const newLabels = selectedLabels.filter(label => label.id !== id);
    console.log('LabelSelector: Etiquetas após remoção:', newLabels.length);
    onLabelsChange(newLabels);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Exibir etiquetas selecionadas como badges */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedLabels.map(label => (
          <Badge 
            key={label.id} 
            className="flex items-center gap-1 py-1 px-2"
            style={{ backgroundColor: label.color }}
          >
            <span className="text-white">{label.name}</span>
            <button 
              type="button"
              onClick={() => handleRemoveLabel(label.id)}
              className="text-white/80 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      {/* Botão para abrir a lista de etiquetas */}
      <Button 
        type="button"
        variant="outline" 
        size="sm"
        className="h-8 border-dashed border-gray-600 bg-gray-900/50 text-gray-300 hover:border-gray-500 hover:bg-gray-800"
        onClick={() => {
          console.log('LabelSelector: Alternando lista', !showList);
          setShowList(!showList);
        }}
      >
        <Tag className="mr-2 h-3.5 w-3.5" />
        Adicionar etiqueta
      </Button>
      
      {/* Lista de etiquetas disponíveis */}
      {showList && (
        <div className="absolute z-50 top-full left-0 mt-1 w-full bg-[#1A1D24] border border-gray-700 rounded-md shadow-md overflow-hidden">
          {/* Campo de busca */}
          <div className="p-2 border-b border-gray-700">
            <input
              type="text"
              placeholder="Buscar etiqueta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border-gray-700 rounded-md text-white text-sm px-3 py-1.5"
            />
          </div>
          
          {/* Loading state */}
          {loading ? (
            <div className="p-4 text-center text-gray-400">
              Carregando etiquetas...
            </div>
          ) : filteredLabels.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              Nenhuma etiqueta encontrada
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {filteredLabels.map(label => {
                const isSelected = selectedLabels.some(l => l.id === label.id);
                return (
                  <button
                    key={label.id}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-2 p-2 text-white hover:bg-gray-800 text-left",
                      isSelected && "bg-gray-800/50"
                    )}
                    onClick={() => handleAddLabel(label)}
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="flex-1">{label.name}</span>
                    {isSelected && <Check className="h-4 w-4 text-green-500" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
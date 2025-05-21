'use client';

import { useState, useCallback } from 'react';
import { Database, Pencil, Trash2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SystemField } from '../services/systemFieldService';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface SystemFieldsListProps {
  fields: SystemField[];
  isLoading: boolean;
  onEdit: (field: SystemField) => void;
  onDelete: (field: SystemField) => void;
}

export default function SystemFieldsList({
  fields,
  isLoading,
  onEdit,
  onDelete,
}: SystemFieldsListProps) {
  
  // Estado para controlar quais grupos estão expandidos
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Informações Gerais': true
  });

  // Obtém o rótulo do tipo de campo para exibição
  const getFieldTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      'text': 'Texto',
      'number': 'Número',
      'select': 'Seleção',
      'date': 'Data',
      'email': 'E-mail',
      'phone': 'Telefone',
      'url': 'URL',
      'boolean': 'Sim/Não',
      'json': 'JSON',
      'datetime': 'Data e Hora'
    };
    
    return types[type] || type;
  };
  
  // Formata a data para exibição
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Alterna o estado de expansão do grupo
  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  }, []);

  // Agrupa campos por grupo
  const groupedFields = fields.reduce<Record<string, SystemField[]>>((groups, field) => {
    // Usamos o campo 'group' se existir, caso contrário "Informações Gerais"
    const groupName = field.group || 'Informações Gerais';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(field);
    return groups;
  }, {});

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <p className="mt-4 text-gray-400">Carregando campos...</p>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="p-8 text-center">
        <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-medium text-white mb-2">Nenhum campo encontrado</h3>
        <p className="text-gray-400 mb-4">
          Não há campos de sistema disponíveis. Clique em "Novo Campo" para adicionar.
        </p>
      </div>
    );
  }

  return (
    <div>
      {Object.entries(groupedFields).map(([groupName, groupFields]) => (
        <div key={groupName} className="border-b border-gray-800 last:border-b-0">
          {/* Cabeçalho do grupo */}
          <div 
            className="flex items-center justify-between p-4 bg-[#1A1D24] cursor-pointer hover:bg-[#21252E]"
            onClick={() => toggleGroup(groupName)}
          >
            <h3 className="text-white font-medium flex items-center">
              {expandedGroups[groupName] ? (
                <ChevronUp className="w-4 h-4 mr-2" />
              ) : (
                <ChevronDown className="w-4 h-4 mr-2" />
              )}
              {groupName}
              <Badge className="ml-2 bg-gray-700 text-white">{groupFields.length}</Badge>
            </h3>
          </div>

          {/* Conteúdo do grupo (mostrado quando expandido) */}
          {expandedGroups[groupName] && (
            <div>
              {groupFields.map((field) => (
                <div
                  key={field.id}
                  className="grid grid-cols-5 gap-4 p-4 text-sm border-t border-gray-800 hover:bg-[#0F1115] transition-colors"
                >
                  <div className="flex items-center">
                    <div>
                      <div className="text-white font-medium">{field.name}</div>
                      <div className="text-gray-400 text-xs mt-1">{field.key}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Badge variant="outline" className="border-gray-700 text-gray-300">
                      {getFieldTypeLabel(field.type)}
                    </Badge>
                    {field.required && (
                      <Badge className="ml-2 bg-amber-600 text-white">Obrigatório</Badge>
                    )}
                    {!field.editable && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="ml-2 text-amber-500">
                              <AlertCircle size={16} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#1A1D24] text-white border-gray-700">
                            <p>Campo padrão do sistema (não pode ser excluído)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  
                  <div className="text-gray-400 line-clamp-2">
                    {field.description || '-'}
                  </div>
                  
                  <div className="text-gray-400">
                    {field.usageCount} {field.usageCount === 1 ? 'uso' : 'usos'}
                  </div>
                  
                  {/* Ações visíveis (em vez do dropdown) */}
                  <div className="flex justify-end items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-blue-600 hover:text-white text-gray-400"
                      onClick={() => onEdit(field)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    
                    {field.editable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-red-600 hover:text-white text-gray-400"
                        onClick={() => onDelete(field)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 
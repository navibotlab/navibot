'use client';

import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { AddBusinessModal } from './AddBusinessModal';
import { BusinessCard } from './BusinessCard';

interface StageColumnProps {
  id: string;
  name: string;
  totalValue: string;
  leads: Array<{
    id: number | string;    // Este é o ID do business, não do lead
    businessId?: string;    // ID duplicado para compatibilidade com versões anteriores
    leadId?: string;        // ID do lead associado ao negócio
    title?: string;
    fullName?: string;
    contact?: string;
    phone?: string;
    value: string | number;
    tags?: Array<{name: string, color: string}>;
    createdAt?: string;
    progress?: number;
    photo?: string;
  }>;
  onDragStart: (e: React.DragEvent, leadId: number | string, fromStage: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, toStage: string) => void;
  onAddClick: (stageId: string) => void;
  onDeleteLead?: (businessId: number | string) => void;  // ID do business para excluir
  onEditClick?: (lead: any) => void;
  formatValue?: (value: number | string) => string;
  formatDate?: (date: string | Date) => string;
  stageIndex?: number;    // Índice do estágio na sequência
  totalStages?: number;   // Número total de estágios
}

export function StageColumn({
  id,
  name,
  totalValue,
  leads,
  onDragStart,
  onDragOver,
  onDrop,
  onAddClick,
  onDeleteLead,
  onEditClick,
  formatValue: propFormatValue,
  formatDate: propFormatDate,
  stageIndex,
  totalStages,
}: StageColumnProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [stageLeads, setStageLeads] = useState(leads);
  const { toast } = useToast();

  // Atualizar os leads quando as props mudarem
  useEffect(() => {
    setStageLeads(leads);
  }, [leads]);

  // Debug: log leads recebidos pelo componente
  console.log(`StageColumn ${name} (${id}): ${stageLeads.length} leads`, stageLeads);

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleAddModalClose = () => {
    setIsAddModalOpen(false);
  };

  const handleAddBusiness = (business: any) => {
    console.log('StageColumn.handleAddBusiness CHAMADO com o negócio:', business);
    
    if (!business || !business.id) {
      console.error('ERRO: Negócio recebido sem ID válido!', business);
      return;
    }
    
    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(String(business.id))) {
      console.error(`ERRO: ID do negócio não é um UUID válido: ${business.id}`);
      toast({
        title: "Erro interno",
        description: "ID do negócio inválido. Recarregue a página e tente novamente.",
        variant: "destructive",
      });
      return;
    }
    
    // Verificação crítica: garantir que o objeto de negócio tem todos os campos necessários
    if (!business.stageId && id) {
      console.log('Definindo stageId do negócio para o ID do estágio:', id);
      business.stageId = id;
    }
    
    // Processar o negócio para garantir compatibilidade com a UI
    const processedBusiness = {
      ...business,
      id: business.id,
      businessId: business.businessId || business.id, // Garantir que businessId seja igual ao id se não definido
      stageId: business.stageId || id,
      stageName: business.stageName || name,
      title: business.title || business.fullName || 'Novo negócio',
      fullName: business.fullName || business.title || 'Novo negócio'
    };
    
    // Adicionar o negócio ao estado local
    console.log('Adicionando negócio processado ao estado local do StageColumn:', processedBusiness);
    setStageLeads(prevLeads => [...prevLeads, processedBusiness]);
    
    // Mostrar toast de confirmação
    toast({
      title: "Negócio adicionado com sucesso!",
      description: processedBusiness.title || "Novo negócio adicionado à coluna " + name,
      variant: "default",
    });
  };

  // Função para tratar exclusão local de um negócio
  const handleDeleteBusiness = (businessId: string | number) => {
    console.log(`StageColumn: Removendo negócio ${businessId} do estágio ${id}`);
    
    // Remover o item da UI localmente primeiro
    setStageLeads(currentLeads => 
      currentLeads.filter(lead => {
        // Verificar pelo businessId primeiro (preferencial)
        if (lead.businessId) {
          return lead.businessId.toString() !== businessId.toString();
        }
        // Fallback para o id (comportamento anterior)
        return lead.id.toString() !== businessId.toString();
      })
    );
    
    // Então chamar o callback para atualização global se fornecido
    if (onDeleteLead) {
      onDeleteLead(businessId);
    }
    
    // Mostrar toast de confirmação
    toast({
      title: "Negócio excluído",
      description: "O negócio foi removido com sucesso.",
      variant: "default",
    });
  };

  return (
    <>
      <div
        className="flex-shrink-0 w-72 flex flex-col bg-[#1A1D24] rounded-lg overflow-hidden transition-colors duration-200 border-2 border-transparent hover:border-gray-700"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.classList.add('border-blue-500');
          e.currentTarget.classList.remove('border-transparent');
          onDragOver(e);
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('border-blue-500');
          e.currentTarget.classList.add('border-transparent');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.classList.remove('border-blue-500');
          e.currentTarget.classList.add('border-transparent');
          onDrop(e, id);
        }}
        data-stage-id={id}
      >
        <div className="p-3 bg-[#0F1115] border-b border-gray-800 flex justify-between items-center">
          <div>
            <h3 className="font-medium text-white">{name}</h3>
            <p className="text-sm text-gray-400">{totalValue}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full text-xs font-medium">
              {stageLeads.length}
            </span>
            <button className="text-gray-400 hover:text-gray-300">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[400px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {/* Debug: Adicionar mensagem se não houver leads */}
          {stageLeads.length === 0 && (
            <div className="flex items-center justify-center h-16 border border-dashed border-gray-700 rounded-lg">
              <p className="text-sm text-gray-500">Sem negócios neste estágio</p>
            </div>
          )}
          
          {/* Agora usando o novo componente BusinessCard para cada negócio */}
          {stageLeads.map((lead) => {
            // Verificação crítica: garantir que estamos passando o ID de business, não de lead
            const leadItem = { ...lead };
            
            // Log para depuração
            console.log(`StageColumn: Preparando item para BusinessCard:`, {
              id: leadItem.id,
              businessId: leadItem.businessId,
              leadId: leadItem.leadId
            });
            
            // Garantir que businessId exista e seja priorizado
            if (!leadItem.businessId && leadItem.id) {
              console.log(`StageColumn: Definindo businessId = id (${leadItem.id})`);
              leadItem.businessId = String(leadItem.id);
            }
            
            // Se o ID do lead for igual ao ID do negócio, isso é um erro
            if (leadItem.leadId && leadItem.id === leadItem.leadId) {
              console.error(`ERRO CRÍTICO em StageColumn: ID de lead e negócio são idênticos: ${leadItem.id}`);
            }
            
            return (
              <BusinessCard
                key={leadItem.id}
                business={leadItem}
                stageId={id}
                stageIndex={stageIndex}
                totalStages={totalStages}
                onDragStart={onDragStart}
                onDeleteBusiness={handleDeleteBusiness}
                onEditClick={onEditClick}
                formatDate={propFormatDate}
                formatValue={propFormatValue}
              />
            )
          })}

          <button
            onClick={handleAddClick}
            className="w-full py-2 text-center text-sm text-gray-400 hover:text-gray-300 hover:bg-[#0F1115] rounded-lg border border-gray-700 border-dashed flex items-center justify-center"
          >
            <Plus className="h-4 w-4 mr-1" /> Adicionar negócio
          </button>
        </div>
      </div>

      {/* Modal de Adicionar Negócio */}
      <AddBusinessModal
        isOpen={isAddModalOpen}
        onClose={() => {
          console.log('AddBusinessModal.onClose chamado');
          setIsAddModalOpen(false);
        }}
        stageId={id}
        stageName={name}
        onAddBusiness={handleAddBusiness}
      />
    </>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { MoreVertical, Trash2, Edit, UserCircle, MessageCircle, Phone, Mail } from 'lucide-react';
import { DeleteBusinessButton } from './DeleteBusinessButton';
import { useRouter } from 'next/navigation';

// Função de diagnóstico - mostra todos os campos do objeto business
function debugBusinessObject(business: any) {
  console.group('🔍 DIAGNÓSTICO DE OBJETO BUSINESS:');
  console.log('Objeto business completo:', business);
  
  // Verificar se é um objeto de evento especial (não um business válido)
  if (business.type === 'refresh-event' || 
      business.type === 'refresh-event-origin-change' || 
      business.id === 'force-refresh' || 
      business.id === 'force-refresh-origin-change') {
    console.log('⚠️ Objeto identificado como evento de sistema, não um negócio válido');
    console.groupEnd();
    // Retornar o ID original, sem validação adicional
    return business.id || 'system-event';
  }
  
  // Listando todas as propriedades
  const keys = Object.keys(business);
  console.log('Propriedades disponíveis:', keys.join(', '));
  
  // Verificando especificamente cada ID
  console.log('ID Análise:');
  console.log('- business.id:', business.id, typeof business.id);
  console.log('- business.businessId:', business.businessId, typeof business.businessId);
  console.log('- business.leadId:', business.leadId, typeof business.leadId);
  
  // REVISADO: Verificação de tipo de objeto para determinar o ID correto
  // Verificar se é um item de lead ou de negócio pelo tipo ou propriedades
  const isBusinessItem = business.type === 'business' || business.businessId;
  
  // LÓGICA DE PRIORIDADE REVISADA:
  let idToUse = business.id; // Default
  
  if (isBusinessItem) {
    // Para itens do tipo negócio, usar businessId quando disponível, senão o ID principal
    idToUse = business.businessId || business.id;
    console.log(`✅ Usando ID do negócio: ${idToUse}`);
  } else {
    // Se é um lead sem businessId, usar o ID principal
    if (business.id === business.leadId) {
      console.warn('⚠️ Aviso: O ID principal é igual ao leadId. Este pode ser um lead sem negócio associado.');
    }
    console.log(`ℹ️ Usando ID do lead: ${idToUse}`);
  }
  
  // Verificar se o ID final é um UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(String(idToUse))) {
    console.warn(`⚠️ Aviso: O ID ${idToUse} não parece ser um UUID válido.`);
  }
  
  console.groupEnd();
  return idToUse;
}

// Interface para as propriedades do BusinessCard
interface BusinessCardProps {
  business: {
    id: string | number;          // ID do negócio (business)
    businessId?: string;          // ID duplicado para compatibilidade com versões anteriores
    leadId?: string | number;     // ID do lead associado (separado)
    title?: string;
    fullName?: string;
    contact?: string;
    phone?: string;
    value: string | number;
    tags?: Array<{name: string, color: string}>;
    createdAt?: string;
    progress?: number;
    photo?: string;
    type?: string;               // Tipo para eventos especiais do sistema
  };
  onDragStart: (e: React.DragEvent, businessId: string | number, fromStage: string) => void;
  onDeleteBusiness?: (businessId: string | number) => void;
  onEditClick?: (business: any) => void;
  stageId: string;
  stageIndex?: number;         // Índice do estágio atual (0-based)
  totalStages?: number;        // Número total de estágios
  formatDate?: (date: string | Date) => string;
  formatValue?: (value: number | string) => string;
}

export function BusinessCard({
  business,
  onDragStart,
  onDeleteBusiness,
  onEditClick,
  stageId,
  stageIndex,
  totalStages,
  formatDate,
  formatValue
}: BusinessCardProps) {
  const [activeMenu, setActiveMenu] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const router = useRouter();
  
  // Calcular o progresso baseado na posição da coluna
  const calculateProgress = () => {
    // Se temos stageIndex e totalStages definidos, calcular o progresso dinamicamente
    if (typeof stageIndex === 'number' && typeof totalStages === 'number' && totalStages > 1) {
      // Garantir que o índice esteja dentro dos limites válidos
      const validIndex = Math.max(0, Math.min(stageIndex, totalStages - 1));
      // Calcular o percentual (0% para o primeiro estágio, 100% para o último)
      return Math.round((validIndex / (totalStages - 1)) * 100);
    }
    
    // Fallback para o valor existente ou 0
    return business.progress || 0;
  };
  
  // Identificar o ID correto do business usando nossa função de diagnóstico
  const businessId = debugBusinessObject(business);
  
  // Verificação adicional: informar mas não gerar erro crítico quando IDs são iguais
  useEffect(() => {
    if (business.leadId && business.id === business.leadId) {
      console.log(`ℹ️ O ID do negócio é igual ao ID do lead no BusinessCard, mas vamos continuar.`, { 
        business_id: business.id, 
        lead_id: business.leadId,
        businessId_to_use: businessId
      });
    }
  }, [business.id, business.leadId, businessId]);
  
  // Verificar se é um evento especial de sistema
  const isSystemEvent = 
    business.type === 'refresh-event' || 
    business.type === 'refresh-event-origin-change' || 
    business.id === 'force-refresh' || 
    business.id === 'force-refresh-origin-change' || 
    businessId === 'system-event';

  // Verificar se o ID do negócio é válido (apenas para negócios reais, não eventos)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isValidBusinessId = isSystemEvent || uuidRegex.test(String(businessId));
  
  if (!isValidBusinessId) {
    console.error(`ERRO CRÍTICO: ID de negócio inválido no BusinessCard: ${businessId}`);
  }
  
  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu(!activeMenu);
  };

  const toggleShowAllTags = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllTags(!showAllTags);
  };
  
  // Função para formatar valores se necessário
  const formatValueLocal = (value: string | number) => {
    if (formatValue) {
      return formatValue(value);
    }
    
    // Implementação padrão caso não receba a prop
    if (typeof value === 'string' && value.startsWith('R$')) {
      return value;
    }
    
    const numValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) 
      : value;
    
    if (isNaN(numValue)) return 'R$ 0,00';
    
    return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Função para formatar datas
  const formatDateLocal = (dateString?: string) => {
    if (!dateString) return '';
    
    if (formatDate) {
      return formatDate(dateString);
    }
    
    try {
      // Verificar se já está no formato brasileiro (dd/mm/yyyy)
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        return dateString;
      }
      
      // Verificar se é ISO date string
      if (!isNaN(Date.parse(dateString))) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
      
      // Se não conseguir converter, retorna data atual
      return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };
  
  // Função para obter a cor de uma tag
  const getTagStyle = (tag: {name: string, color: string}) => {
    if (!tag.color) {
      return { backgroundColor: '#4B5563', color: '#D1D5DB' };
    }
    
    return {
      backgroundColor: tag.color,
      color: '#ffffff'
    };
  };
  
  // Função para abrir a página de detalhes do negócio
  const goToBusinessDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/crm/pipeline/${businessId}`);
  };
  
  return (
    <div
      draggable="true"
      onDragStart={(e) => onDragStart(e, businessId, stageId)}
      onDragEnd={(e) => e.preventDefault()}
      className="relative bg-[#0F1115] p-3 rounded-lg border border-gray-700 hover:border-gray-600 hover:shadow-md cursor-grab active:cursor-grabbing"
    >
      {/* Menu de 3 pontinhos */}
      <div className="absolute top-2 right-2 z-10">
        <button 
          onClick={toggleMenu}
          className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
          title="Ações"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        
        {/* Menu de ações */}
        {activeMenu && (
          <div 
            className="absolute top-full right-0 mt-1 w-40 bg-[#1A1D24] rounded-md shadow-lg border border-gray-700 py-1 z-20"
          >
            <DeleteBusinessButton 
              businessId={String(businessId)} 
              variant="menu" 
              onDeleteSuccess={() => {
                setActiveMenu(false);
                if (onDeleteBusiness) {
                  onDeleteBusiness(businessId);
                }
              }}
            />
            
            {/* Botão Editar */}
            <div 
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onEditClick) {
                  onEditClick(business);
                }
              }}
            >
              <Edit className="h-4 w-4 mr-2 text-blue-400" />
              Editar negócio
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-2">
        {/* Foto do lead */}
        <div
          className="w-8 h-8 flex-shrink-0 cursor-pointer hover:brightness-110 transition"
          onClick={goToBusinessDetail}
          style={{ cursor: 'pointer' }}
          title="Ver detalhes do negócio"
        >
          {business.photo ? (
            <img 
              src={business.photo} 
              alt={business.title || 'Lead'}
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 0 0-16 0"></path></svg>';
                }
              }}
            />
          ) : (
            <UserCircle className="w-8 h-8 text-gray-500" />
          )}
        </div>
        
        <div className="flex-1">
          <h4
            className="font-medium text-sm text-white pr-6 truncate cursor-pointer"
            onClick={goToBusinessDetail}
            style={{ cursor: 'pointer' }}
            title="Ver detalhes do negócio"
          >
            {business.fullName || business.title || 'Sem nome'}
          </h4>
          <div
            className="flex items-center text-xs text-gray-400 cursor-pointer"
            onClick={goToBusinessDetail}
            style={{ cursor: 'pointer' }}
            title="Ver detalhes do negócio"
          >
            <span className="truncate">
              {business.phone || business.contact || 'Contato não fornecido'}
            </span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {business.tags && business.tags.length > 0 && (
        <div className="mt-3 mb-4">
          <div className="flex flex-wrap gap-1.5">
            {business.tags.slice(0, showAllTags ? undefined : 2).map((tag, tagIndex) => (
              <div 
                key={`${businessId}-tag-${tagIndex}`}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium truncate max-w-full flex-shrink-0"
                style={getTagStyle(tag)}
                title={tag.name}
              >
                {tag.name}
              </div>
            ))}
            
            {business.tags.length > 2 && !showAllTags && (
              <button
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-700 text-gray-300"
                onClick={toggleShowAllTags}
              >
                +{business.tags.length - 2}
              </button>
            )}
            
            {showAllTags && business.tags.length > 2 && (
              <button
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-700 text-gray-300"
                onClick={toggleShowAllTags}
              >
                Menos
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Barra de progresso */}
      <div className="mb-2 bg-gray-800 rounded-full h-1.5">
        <div 
          className="bg-blue-600 h-1.5 rounded-full" 
          style={{ width: `${calculateProgress()}%` }}
        ></div>
      </div>
      
      {/* Divisor horizontal */}
      <div className="border-t border-gray-700 my-2"></div>
      
      {/* Rodapé com data e ações */}
      <div className="flex justify-between items-center text-xs mt-2">
        <div className="text-green-400 font-medium">
          {formatValueLocal(business.value)}
        </div>
        <div className="flex gap-1.5">
          <button className="text-gray-400 hover:text-blue-400">
            <Phone className="h-3.5 w-3.5" />
          </button>
          <button className="text-gray-400 hover:text-blue-400">
            <Mail className="h-3.5 w-3.5" />
          </button>
          <button className="text-gray-400 hover:text-blue-400">
            <MessageCircle className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
} 
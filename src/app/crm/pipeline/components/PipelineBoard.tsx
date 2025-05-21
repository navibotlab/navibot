'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StageColumn } from './StageColumn';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { AddBusinessModal } from './AddBusinessModal';
import { useToast } from '@/components/ui/use-toast';
import { EditLeadModal } from './EditBusinessModal';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useForceUpdate } from '@/hooks/useForceUpdate';
import { Loader2, AlertTriangle, PlusCircle, Kanban } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { deleteBusinessById, moveBusinessToStage } from "../services/api";

// Interface para os dados de negócios em um estágio
interface Business {
  id: string;
  title: string;
  value: number;
  leadId: string;
  stageId: string;
  originId: string;
  ownerId?: string;
  probability: number;
  expectedCloseDate?: Date;
  customFields?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para leads no pipeline (unificada com StageColumnLead)
interface Lead {
  id: string | number;
  businessId?: string;
  leadId?: string;  // ID do lead associado a este negócio
  name?: string;
  title?: string;
  fullName?: string;
  phone?: string;
  photo?: string;
  email?: string;
  labels?: string[];
  tag?: string;
  tags?: Array<{name: string, color: string, id?: string}>;
  value: string | number;
  contact?: string;
  createdAt?: string;
  progress?: number;
  stageId?: string | number;
  originId?: string;
  ownerId?: string;
  owner?: string;
  userId?: string;
  type?: string;    // Tipo de lead/evento
  customFields?: Record<string, any>; // Campos personalizados
}

// Interface para estágios no pipeline
interface Stage {
  id: string | number;
  name: string;
  order: number;
  leads?: Lead[];
  totalValue?: string;
  leadCount?: number;
  color?: string;
}

// Usando o mesmo tipo Lead para a coluna de estágio
type StageColumnLead = Lead;

// Interface para o componente PipelineBoard
interface PipelineBoardProps {
  globalNewLead?: any;
  originId?: string;
  setOriginId?: React.Dispatch<React.SetStateAction<string | undefined>>;
  setGlobalNewLead?: React.Dispatch<React.SetStateAction<any>>;
  tags?: any[];
  users?: any[];
  filters?: {
    tags: string[];
    owners: string[];
    date: { start: string | null, end: string | null } | null;
  };
  onTotalOpportunitiesChange?: (total: number) => void;
}

// Função para gerar cores aleatórias para tags baseado no texto
function getRandomColor(text: string): string {
  // Cores para tags em formato hexadecimal
  const colors = [
    '#2563EB', // azul
    '#4F46E5', // indigo
    '#7E22CE', // roxo
    '#16A34A', // verde
    '#EA580C', // laranja
    '#DC2626', // vermelho
    '#CA8A04', // amarelo
    '#DB2777', // rosa
    '#4B5563', // cinza
  ];
  
  // Calcular hash simples do texto para sempre retornar a mesma cor para o mesmo texto
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash; // Converter para inteiro de 32 bits
  }
  
  // Usar o hash para selecionar uma cor da lista
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Função para extrair o nome limpo de uma tag (para comparações)
const getTagName = (tag: any): string => {
  if (!tag) return '';
  
  if (typeof tag === 'string') {
    return tag.toLowerCase().trim();
  } 
  
  if (typeof tag === 'object') {
    const name = tag.name || '';
    return name.toLowerCase().trim();
  }
  
  return '';
};

// Função para extrair o ID de uma tag
const getTagId = (tag: any): string => {
  if (!tag) return '';
  
  if (typeof tag === 'string') {
    return tag;
  } 
  
  if (typeof tag === 'object') {
    return tag.id || '';
  }
  
  return '';
};

export function PipelineBoard({
  originId,
  setOriginId,
  globalNewLead,
  setGlobalNewLead,
  tags: propTags = [],
  users = [],
  filters,
  onTotalOpportunitiesChange
}: PipelineBoardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();
  const [stages, setStages] = useState<Stage[]>([]);
  const [leads, setLeads] = useState<{ [stageId: string]: Lead[] }>({});
  const [filteredLeads, setFilteredLeads] = useState<{ [stageId: string]: Lead[] }>({});
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [loading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentStageId, setCurrentStageId] = useState<string>();
  const [currentStageName, setCurrentStageName] = useState('');
  const [currentOriginId, setCurrentOriginId] = useState<string | undefined>(originId);
  const [originNotFound, setOriginNotFound] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const forceUpdate = useForceUpdate();
  const [tags] = useState<any[]>(propTags);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Usar um useEffect para atualizar o currentOriginId quando a prop originId mudar
  useEffect(() => {
    if (originId && originId !== currentOriginId) {
      console.log('Origem alterada, atualizando para:', originId);
      setCurrentOriginId(originId);
    }
  }, [originId, currentOriginId]);
  
  // Quando a origem for alterada, buscar os estágios
  useEffect(() => {
    if (currentOriginId) {
      console.log('Origem definida ou alterada, buscando estágios:', currentOriginId);
      fetchStages();
    }
  }, [currentOriginId]);
  
  // Quando globalNewLead mudar, adicionar o lead ao estágio correspondente
  useEffect(() => {
    if (globalNewLead && !loading) {
      console.log('Novo lead global detectado:', globalNewLead);
      
      // Se for um evento de refresh, apenas atualizar os estágios
      if (globalNewLead.type === 'refresh-event' || globalNewLead.type === 'refresh-event-origin-change') {
        console.log(`Evento de sistema detectado: ${globalNewLead.type}, atualizando estágios`);
        fetchStages();
        // Limpar globalNewLead após processamento
        if (setGlobalNewLead) {
          setGlobalNewLead(null);
        }
        return;
      }
      
      // Pequeno delay para garantir que os estágios foram carregados
      const timer = setTimeout(() => {
        // Verificar se temos estágios disponíveis
        if (stages.length > 0) {
          // Se não temos um estágio atual selecionado, usar o primeiro estágio
          if (!currentStageId) {
            console.log('Nenhum estágio atual selecionado, usando o primeiro estágio disponível:', stages[0].id);
            setCurrentStageId(String(stages[0].id));
            setCurrentStageName(stages[0].name);
          }
          
          // Agora temos um estágio selecionado, podemos adicionar o lead
          handleAddLead(globalNewLead);
          
          // Limpar globalNewLead após processamento
          if (setGlobalNewLead) {
            setGlobalNewLead(null);
          }
          
          // Atualizar estágios
          fetchStages();
        } else {
          console.error('Não há estágios disponíveis para adicionar o lead. Crie estágios padrão primeiro.');
          toast({
            title: "Erro",
            description: "Não há estágios disponíveis para adicionar o negócio. Crie os estágios padrão primeiro.",
            variant: "destructive",
          });
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [globalNewLead]);

  // Efeito para aplicar filtros quando eles mudarem
  useEffect(() => {
    if (!filters) return;
    
    console.log('Detectada mudança nos filtros:', filters);
    
    // Pequeno atraso para garantir que os leads estejam carregados
    const timer = setTimeout(() => {
      if (leads && Object.keys(leads).length > 0) {
        console.log('Aplicando filtros com leads carregados:', leads);
        // Não chamar diretamente applyFilters() aqui para evitar loops
        // Criar uma versão estável da função que não depende das props que mudam
        const filteredLeadsResult = applyFiltersOnce();
        setFilteredLeads(filteredLeadsResult);
      } else {
        console.log('Leads ainda não estão disponíveis para filtrar');
      }
    }, 100);
    
    return () => clearTimeout(timer);
    
    // Função para aplicar filtros uma vez sem causar rerenderizações em cascata
    function applyFiltersOnce() {
      console.log('=== INICIANDO APLICAÇÃO DE FILTROS (ONCE) ===');
      
      // Verificar se estamos usando o filtro de "all tags"
      const usingAllTagsFilter = filters && filters.tags && filters.tags.includes('all');
      const usingAllOwnersFilter = filters && filters.owners && filters.owners.includes('all');
      
      const result: { [stageId: string]: Lead[] } = {};
      
      // Copiar a lógica de filtragem do applyFilters() aqui, mas sem chamar setFilteredLeads
      // ... (mesma lógica do applyFilters, mas retornando result em vez de chamar setFilteredLeads)
      
      // Para cada estágio, filtrar os leads com base nos critérios
      Object.keys(leads).forEach(stageId => {
        const stageLeads = leads[stageId] || [];
        
        // Filtrar com base nas tags, donos de negócio e data
        const filtered = stageLeads.filter(lead => {
          // Se não há filtros ativos, incluir todos os leads
          if (!filters) return true;
          
          let passTagFilter = true;
          let passOwnerFilter = true;
          let passDateFilter = true;
          
          // Filtro por tags
          if (filters.tags && filters.tags.length > 0) {
            // Se selecionou a opção "Todos os tags", sempre passa no filtro
            if (filters.tags.includes('all')) {
              passTagFilter = true;
            }
            // Se selecionou "Sem tag"
            else if (filters.tags.includes('none')) {
              passTagFilter = !lead.tags || lead.tags.length === 0;
            } 
            // Caso normal: verificar se o lead tem pelo menos uma das tags selecionadas
            else if (lead.tags && lead.tags.length > 0) {
              // Verifica se pelo menos uma tag do lead está na lista de tags selecionadas
              passTagFilter = lead.tags.some(tag => {
                const tagName = getTagName(tag);
                const tagId = getTagId(tag);
                
                // Verificar se a tag do lead corresponde a alguma tag selecionada
                return filters.tags.some(selectedTagId => {
                  // Tentar correspondência direta de ID
                  if (tagId && tagId === selectedTagId) return true;
                  
                  // Tentar correspondência de nome (case insensitive)
                  const selectedTag = propTags.find(t => t.id === selectedTagId);
                  if (selectedTag && tagName && 
                      selectedTag.name.toLowerCase().trim() === tagName.toLowerCase().trim()) {
                    return true;
                  }
                  
                  // Tentar correspondência direta com o texto da tag selecionada
                  if (tagName && selectedTagId.toLowerCase().trim() === tagName.toLowerCase().trim()) {
                    return true;
                  }
                  
                  return false;
                });
              });
            } else {
              // Lead não tem tags e não estamos filtrando por "sem tag"
              passTagFilter = false;
            }
          }
          
          // Filtro por donos de negócio
          if (filters.owners && filters.owners.length > 0) {
            // Se selecionou a opção "Todos os donos", sempre passa no filtro
            if (filters.owners.includes('all')) {
              passOwnerFilter = true;
            }
            // Se selecionou "Sem dono"
            else if (filters.owners.includes('none')) {
              // Verificamos todas as propriedades possíveis de dono
              const hasOwner = lead.ownerId || lead.owner || (lead as any).userId;
              passOwnerFilter = !hasOwner;
            } 
            // Caso normal: verificar se o dono do lead está entre os selecionados
            else {
              // Verificar todas as propriedades possíveis de dono
              const ownerId = lead.ownerId || lead.owner || (lead as any).userId;
              
              if (ownerId) {
                // Verificar se o ID do dono está na lista de donos selecionados
                passOwnerFilter = filters.owners.includes(String(ownerId));
                
                // Se não encontrou por ID, tentar outras abordagens
                if (!passOwnerFilter) {
                  // Tentar verificar por nome do dono (alguns dados podem vir em formato diferente)
                  if (lead.owner && typeof lead.owner === 'string') {
                    passOwnerFilter = filters.owners.some(filterOwnerId => filterOwnerId === lead.owner);
                  }
                  
                  // Verificar owner como objeto
                  if (!passOwnerFilter && lead.owner && typeof lead.owner === 'object') {
                    const ownerObject = lead.owner as any;
                    passOwnerFilter = filters.owners.includes(String(ownerObject.id));
                  }
                }
              } else {
                // Lead não tem dono e não estamos filtrando por "sem dono"
                passOwnerFilter = false;
              }
            }
          }
          
          // Filtro por data
          if (filters.date) {
            // Verificar se o lead foi criado na data selecionada
            if (!lead.createdAt) {
              passDateFilter = false;
            } else {
              const leadDate = new Date(lead.createdAt);
              
              // Aqui garantimos que o formato do filtro de data está correto
              const dateFilter = filters.date as { start: string | null, end: string | null };
              
              // Se temos uma data inicial definida
              if (dateFilter.start) {
                const startDate = new Date(dateFilter.start);
                if (leadDate < startDate) {
                  passDateFilter = false;
                }
              }
              
              // Se temos uma data final definida
              if (passDateFilter && dateFilter.end) {
                const endDate = new Date(dateFilter.end);
                // Definir para o final do dia (23:59:59)
                endDate.setHours(23, 59, 59, 999);
                if (leadDate > endDate) {
                  passDateFilter = false;
                }
              }
            }
          }
          
          // O lead deve passar em TODOS os filtros ativos para ser incluído no resultado
          return passTagFilter && passOwnerFilter && passDateFilter;
        });
        
        result[stageId] = filtered;
      });
      
      return result;
    }
  }, [filters, leads]);

  // Função para formatar valores monetários
  const formatValue = (value: number | string): string => {
    if (typeof value === 'string') {
      // Se já for uma string formatada, retornar como está
      if (value.startsWith('R$')) return value;
      
      // Tentar converter para número
      value = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
    }
    
    // Se não for um número válido após a conversão, retornar R$ 0,00
    if (isNaN(value)) return 'R$ 0,00';
    
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Função para formatar datas
  const formatDate = (date: string | Date): string => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Verificar se a data é válida
      if (isNaN(dateObj.getTime())) return '';
      
      return dateObj.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
    }
  };

  // Função para criar estágios padrão
  const createDefaultStages = async () => {
    try {
      // Garantir que temos um originId para criar estágios padrão
      if (!currentOriginId) {
        console.warn('⚠️ Tentativa de criar estágios padrão sem originId definido! Abortando requisição.');
        return;
      }
      
      const response = await fetch('/api/crm/stages/default', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originId: currentOriginId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao criar estágios padrão');
      }
      
      const data = await response.json();
      console.log('Resposta da criação de estágios padrão:', data);
      
      toast({
        title: "Estágios criados",
        description: "Os estágios padrão foram criados com sucesso!",
      });
      
      // Buscar os estágios novamente
      fetchStages();
    } catch (error) {
      console.error('Erro ao criar estágios padrão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar os estágios padrão. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para buscar estágios da origem selecionada
  const fetchStages = async () => {
    if (!currentOriginId) {
      console.log('Nenhuma origem selecionada ainda, aguardando...');
      return;
    }
    
    try {
      setIsLoading(true);
      setOriginNotFound(false);
      
      console.log('Buscando estágios para a origem:', currentOriginId);
      const url = `/api/crm/stages?originId=${currentOriginId}&includeLeads=true`;
      console.log('URL da requisição:', url);
      
      const response = await fetch(url);
      
      if (response.status === 404) {
        console.log('Origem não encontrada:', currentOriginId);
        setOriginNotFound(true);
        setIsLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Falha ao buscar estágios');
      }
      
      const data = await response.json();
      console.log('Estágios recebidos:', data);
      
      // Verificar se há negócios nos dados recebidos
      let totalNegocios = 0;
      if (data.stages && Array.isArray(data.stages)) {
        // ATUALIZAÇÃO: Filtrar os leads para garantir que só mostramos negócios válidos
        data.stages.forEach((stage: any) => {
          if (stage.leads && Array.isArray(stage.leads)) {
            // Filtrar somente itens que são negócios (type === 'business')
            // E garantir que negócios excluídos não apareçam
            stage.leads = stage.leads.filter((item: any) => {
              // Um negócio válido deve ter:
              // 1. type === 'business' OU businessId definido
              // 2. Um ID válido (não nulo ou indefinido)
              const isValidBusiness = 
                (item.type === 'business' || item.businessId) && 
                !!item.id;
              
              if (!isValidBusiness) {
                console.log(`Removendo item inválido do estágio ${stage.name}:`, {
                  id: item.id,
                  businessId: item.businessId,
                  type: item.type
                });
              }
              
              return isValidBusiness;
            });
            
            totalNegocios += stage.leads.length;
            
            // Log de diagnóstico para os IDs dos primeiros negócios
            if (stage.leads.length > 0) {
              console.log(`Estágio ${stage.name} (${stage.id}): ${stage.leads.length} negócios/leads`);
              stage.leads.slice(0, 2).forEach((item: any, idx: number) => {
                console.log(`Negócio ${idx + 1} em ${stage.name}:`, {
                  id: item.id,
                  businessId: item.businessId || null,
                  leadId: item.leadId || null,
                  tipo: item.type || (item.businessId ? 'Negócio' : 'Lead')
                });
              });
            }
          }
        });
      }
      console.log(`Total de negócios encontrados: ${totalNegocios}`);
      
      // Garantir que temos um objeto stages válido
      const receivedStages = data.stages || [];
      
      // Verificar se há estágios antes de tentar criar os padrão
      if (Array.isArray(receivedStages) && receivedStages.length === 0) {
        console.log('Nenhum estágio encontrado para esta origem');
        setStages([]); // Definir estágios como array vazio
        setLeads({});  // Limpar leads
        setIsLoading(false);
        // Não criar estágios padrão automaticamente, permitir que o usuário escolha
        return;
      }
      
      // Formatar as stages antes de armazenar no estado
      const formattedStages = receivedStages.map((stage: any) => ({
        ...stage,
        leads: Array.isArray(stage.leads) ? stage.leads : [],
        // Garantir que cada estágio tenha um array leads, mesmo que vazio
      }));
      
      console.log('Estágios formatados:', formattedStages);
      
      setStages(formattedStages);
      
      // Também atualizar o estado de leads para DnD
      const newLeads: { [stageId: string]: any[] } = {};
      formattedStages.forEach((stage: any) => {
        if (stage.id) {
          newLeads[String(stage.id)] = stage.leads || [];
        }
      });
      
      console.log('Leads organizados por estágio:', newLeads);
      setLeads(newLeads);
      
      // Calcular o número total de oportunidades e informar o componente pai
      if (onTotalOpportunitiesChange) {
        const totalOpportunities = formattedStages.reduce((total: number, stage: Stage) => {
          return total + (Array.isArray(stage.leads) ? stage.leads.length : 0);
        }, 0);
        onTotalOpportunitiesChange(totalOpportunities);
      }
      
    } catch (error) {
      console.error('Erro ao buscar estágios:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os estágios do pipeline",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = (stageId: string | number, stageName: string) => {
    setCurrentStageId(String(stageId));
    setCurrentStageName(stageName);
    console.log('handleAddClick - currentOriginId:', currentOriginId);
    setShowModal(true);
    setEditingLead(null);
  };

  // Handler para quando um novo lead é adicionado globalmente
  const handleAddLead = async (lead: any) => {
    console.log('PipelineBoard - handleAddLead chamado com:', lead);
    
    // Verificar se é um evento especial (não um lead real)
    if (lead.type === 'refresh-event' || 
        lead.type === 'refresh-event-origin-change' || 
        lead.id === 'force-refresh' || 
        lead.id === 'force-refresh-origin-change') {
      console.log('Evento especial detectado, ignorando:', lead);
      return null;
    }
    
    // Garantir que o lead tenha o originId correto
    if (lead.originId !== currentOriginId) {
      console.log(`Lead com originId diferente (${lead.originId}), ajustando para current (${currentOriginId})`);
      lead.originId = currentOriginId;
    }
    
    try {
      // Verificar se já existe nas várias stages
      const leadExists = stages.some(stage => 
        stage.leads?.some((existingLead: any) => existingLead.id === lead.id)
      );
    
    if (leadExists) {
        console.log('Lead já existe em alguma stage, evitando duplicação');
        toast({
          title: "Aviso",
          description: "Este negócio já existe em alguma etapa do pipeline.",
          variant: "destructive",
        });
      return;
    }
    
      // Verificar a fase atual
      if (!currentStageId) {
        // Se ainda não temos uma fase selecionada e temos estágios disponíveis
        if (stages.length > 0) {
          console.log('Nenhuma fase selecionada. Usando o primeiro estágio disponível:', stages[0].id);
          setCurrentStageId(String(stages[0].id));
          setCurrentStageName(stages[0].name);
        } else {
          console.error('Erro ao adicionar negócio: nenhuma fase selecionada e nenhum estágio disponível');
          toast({
            title: "Erro",
            description: "Erro ao adicionar negócio: nenhuma fase disponível. Crie os estágios padrão primeiro.",
            variant: "destructive",
          });
          return;
        }
    }
    
      // Garantir que temos businessId e leadId explicitamente definidos
      const businessId = lead.businessId || lead.id;
      const leadId = lead.leadId || null;
      
      console.log(`Negócio sendo adicionado - Business ID: ${businessId}, Lead ID: ${leadId}`);
      
      // Formatar o lead adicionando campos necessários para UI
      const formattedLead = {
        ...lead,
        // Garantir que estas propriedades existam para a renderização
        id: leadId || lead.id, // ID do lead para a UI
        businessId: businessId, // ID do negócio para operações de arrasto/soltura
        leadId: leadId, // ID do lead explicitamente
        progress: lead.progress || 10,
        photo: lead.photo || undefined,
        timestamp: Date.now() // Adicionar timestamp único para forçar atualização
      };
      
      console.log('Lead formatado para adição:', formattedLead);
      
      // Usar o primeiro estágio disponível ou o estágio atual
      const stageId = currentStageId || String(stages[0].id);
      
      console.log(`Adicionando lead ao estágio: ${stageId}`);
      
      // Atualizar stages imediatamente no frontend para refletir mudanças na UI
      const newStages = stages.map(stage => {
        if (stage.id === stageId) {
          // Adicionar lead à fase atual
          const updatedLeads = stage.leads ? [...stage.leads, formattedLead] : [formattedLead];
          console.log(`Adicionando lead à fase ${stage.name}, total agora: ${updatedLeads.length}`);
        return {
            ...stage,
            leads: updatedLeads
          };
        }
        return stage;
      });
      
      // Atualizar o estado de stages para refletir mudança na UI imediatamente
      setStages(newStages);
      
      // Também atualizar o estado de leads para manter sincronizado
      setLeads((prevLeads: { [stageId: string]: any[] }) => {
        const stageIdStr = stageId;
        const updatedLeads = { ...prevLeads };
        
        if (!updatedLeads[stageIdStr]) {
          updatedLeads[stageIdStr] = [];
        }
        
        updatedLeads[stageIdStr] = [...updatedLeads[stageIdStr], formattedLead];
        return updatedLeads;
      });
      
      // Forçar atualização da UI (pode ser necessário devido à natureza imutável do React)
      forceUpdate();
      
      // Agendar outra atualização após um breve delay para garantir renderização
      setTimeout(() => {
        forceUpdate();
        console.log('Forçando segunda atualização para garantir renderização');
      }, 50);
      
      // Fechar modal se necessário
      setShowAddModal(false);
      
      // Mostrar feedback de sucesso
      toast({
        title: "Sucesso",
        description: "Negócio adicionado com sucesso!",
      });
      
      // Limpar lead em edição
      setEditingLead(null);
      
      console.log('Lead adicionado com sucesso:', formattedLead);
      
      // Atualizar contagem total de oportunidades
      if (onTotalOpportunitiesChange) {
        // Calcular total após adicionar o novo lead
        const totalOpportunities = Object.values(leads).reduce((total: number, stageLeads: Lead[]) => {
          return total + stageLeads.length;
        }, 0) + 1; // +1 para contar o lead que acabou de ser adicionado
        onTotalOpportunitiesChange(totalOpportunities);
      }
      
      return formattedLead;
      
    } catch (error) {
      console.error('Erro ao adicionar lead:', error);
      // Mesmo com erro, tentar forçar atualização da UI
      forceUpdate();
      
      toast({
        title: "Erro",
        description: "Erro ao adicionar negócio. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Handler para quando o botão de editar é clicado
  const handleEditClick = (lead: Lead) => {
    console.log('Editando lead:', lead);
    setEditingLead(lead);
    setShowModal(false); // Fechar qualquer outro modal que esteja aberto
    setShowAddModal(false); // Garantir que o modal de adição esteja fechado
  };

  const handleUpdateLead = async (updatedData: Partial<Lead>) => {
    if (!draggedLead) return;
    
    try {
      // Criar uma cópia segura dos dados para manipulação
      const dataToUpdate = { ...updatedData };
      
      // Converter tags de string[] para formato de objeto se necessário
      if (dataToUpdate.tags && Array.isArray(dataToUpdate.tags) && dataToUpdate.tags.length > 0) {
        // Verificar se o primeiro elemento é uma string
        const firstTag = dataToUpdate.tags[0];
        if (typeof firstTag === 'string') {
          // Converter tags de string para objetos
          dataToUpdate.tags = (dataToUpdate.tags as unknown as string[]).map((tag: string) => ({
            name: tag,
            color: getRandomColor(tag)
          }));
        }
      }

      // Converter labels para tags se necessário
      if (dataToUpdate.labels && Array.isArray(dataToUpdate.labels)) {
        dataToUpdate.tags = dataToUpdate.labels.map((label: string) => ({
          name: label,
          color: getRandomColor(label)
        }));
        
        // Remover labels para evitar duplicação
        delete dataToUpdate.labels;
      }

      // Obtendo o workspace ID da sessão
      const workspaceId = session?.user?.workspaceId;
      
      if (!workspaceId) {
        console.error("Não foi possível identificar o workspace para atualização");
        throw new Error("Workspace não identificado. Tente fazer login novamente.");
      }

      const response = await fetch(`/api/crm/leads/${draggedLead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId
        },
        body: JSON.stringify(dataToUpdate),
      });

      if (!response.ok) {
        console.error(`Erro ao atualizar negócio: ${response.status} ${response.statusText}`);
        const errorData = await response.text();
        console.error("Resposta de erro:", errorData);
        throw new Error('Falha ao atualizar lead');
      }

      const updatedLead = await response.json();
      
      // Atualizar o estado local com o lead atualizado
      setStages(prevStages => 
        prevStages.map(stage => {
          if (stage.leads) {
            return {
          ...stage,
              leads: stage.leads.map(lead => 
                lead.id === draggedLead.id 
                  ? { ...lead, ...dataToUpdate } 
                  : lead
              )
            };
          }
          return stage;
        })
      );
      
      // Atualizar o estado de leads para DnD
      setLeads(prevLeads => {
        const newLeads = { ...prevLeads };
        Object.keys(newLeads).forEach(stageId => {
          newLeads[stageId] = newLeads[stageId].map(lead => 
            lead.id === draggedLead.id 
              ? { ...lead, ...dataToUpdate } 
              : lead
          );
        });
        return newLeads;
      });
      
      toast({
        title: "Sucesso",
        description: "Negócio atualizado com sucesso!",
      });
      
      // Limpar o lead em arrasto
      setDraggedLead(null);
      setEditingLead(null);
      
      // Fechar o modal
      setShowModal(false);
      
      return updatedLead;
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar o negócio. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para excluir um negócio
  const handleDeleteLead = async (businessId: string) => {
    console.log('🔄 FUNÇÃO CHAMADA: handleDeleteLead', businessId);
    
    // Debug adicional
    console.log('ID a ser enviado para exclusão (não modificado):', businessId);
    
    // Verificação adicional para identificar se é um ID de negócio válido (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(businessId);
    
    if (!isValidUUID) {
      console.error(`ERRO CRÍTICO: ID de negócio inválido: ${businessId}`);
      toast({
        title: "Erro",
        description: "ID de negócio inválido. A exclusão não pode ser realizada.",
        variant: "destructive",
      });
      return;
    }
    
    // Toast para confirmar início do processo
    toast({
      title: "Remoção iniciada",
      description: `Processando exclusão do negócio: ${businessId}`,
    });
    
    try {
      // Debug: verificar tipo do ID
      console.log("Tipo do ID a ser excluído:", typeof businessId);
      console.log("ID é UUID válido:", uuidRegex.test(businessId));
      
      // Chamar a API para excluir o negócio - usar diretamente o ID recebido
      await deleteBusinessById(businessId);
      
      // ATUALIZAÇÃO: Função mais robusta para remover o negócio da UI
      // Remover imediatamente o negócio de todas as fases com todas as referências possíveis
      function removeBusinessFromAllStages() {
        setStages(prevStages => {
          return prevStages.map(stage => {
            return {
              ...stage,
              leads: (stage.leads || []).filter(lead => {
                // Verificar todos os possíveis IDs que podem corresponder ao negócio
                const idMatches = String(lead.id) === businessId;
                const businessIdMatches = lead.businessId && String(lead.businessId) === businessId;
                const customFieldsMatch = lead.customFields && 
                  lead.customFields.businessId && 
                  String(lead.customFields.businessId) === businessId;
                
                // Se qualquer ID corresponder, remover este item
                return !(idMatches || businessIdMatches || customFieldsMatch);
              })
            };
          });
        });
        
        // Atualizar também o estado de leads para manter consistência
        setLeads(prevLeads => {
          const newLeads = { ...prevLeads };
          
          // Para cada estágio, remover qualquer referência ao negócio
          Object.keys(newLeads).forEach(stageId => {
            newLeads[stageId] = (newLeads[stageId] || []).filter(lead => {
              const idMatches = String(lead.id) === businessId;
              const businessIdMatches = lead.businessId && String(lead.businessId) === businessId;
              const customFieldsMatch = lead.customFields && 
                lead.customFields.businessId && 
                String(lead.customFields.businessId) === businessId;
              
              return !(idMatches || businessIdMatches || customFieldsMatch);
            });
          });
          
          return newLeads;
        });
      }
      
      // Executar a função para remover o negócio da UI
      removeBusinessFromAllStages();
      
      // Forçar a atualização da UI
      forceUpdate();
      
      // Programar uma segunda força de atualização após um pequeno delay
      setTimeout(() => {
        removeBusinessFromAllStages(); // Tentar remover novamente por segurança
        forceUpdate();
        
        // Atualizar também a contagem total de oportunidades
        if (onTotalOpportunitiesChange) {
          const totalOpportunities = Object.values(leads).reduce((acc, stageLeads) => {
            return acc + stageLeads.length;
          }, 0);
          onTotalOpportunitiesChange(totalOpportunities);
        }
      }, 100);
      
      // Notificar o usuário sobre o sucesso
      toast({
        title: "Sucesso",
        description: "Negócio removido com sucesso!",
      });
      
    } catch (error) {
      console.error("Erro ao excluir negócio:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o negócio. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para iniciar o arrastar de um lead
  const handleDragStart = (e: React.DragEvent<Element>, leadId: string | number, stageId: string) => {
    // Encontrar o lead que está sendo arrastado
    const lead = leads[stageId]?.find(lead => {
      const itemId = String(lead.id);
      const businessId = lead.businessId?.toString();
      
      return itemId === String(leadId) || (businessId && businessId === String(leadId));
    });
    
    if (!lead) {
      console.error("Lead não encontrado para arrasto:", leadId);
      return;
    }
    
    console.log("Iniciando arrasto com lead:", lead);
    console.log("IDs disponíveis:", {
      leadId: lead.leadId,
      businessId: lead.businessId,
      id: lead.id,
      draggedId: leadId
    });
    
    // Determinar o ID correto para usar (preferência para businessId)
    let idToUse = null;
    
    // Se temos um businessId explícito, usar ele
    if (lead.businessId) {
      idToUse = lead.businessId;
      console.log(`Usando businessId para arrasto: ${idToUse}`);
    } 
    // Caso contrário, marcamos para buscar o business na API durante o drop
    else {
      // IMPORTANTE: Verificar se o ID é um UUID antes de usá-lo
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      // Se o id principal for um UUID, pode ser que já seja o ID do negócio
      if (uuidRegex.test(String(lead.id))) {
        idToUse = lead.id;
        console.log(`ID principal parece ser um UUID válido, assumindo que é um businessId: ${idToUse}`);
      } else if (lead.leadId && uuidRegex.test(String(lead.leadId))) {
        // Se não, verificar o leadId explícito
        idToUse = lead.leadId;
        console.log(`Usando leadId explícito para arrasto: ${idToUse}`);
      } else {
        // Último recurso: usar o ID regular
        idToUse = lead.id;
        console.log(`Nenhum businessId disponível, usando ID para arrasto: ${idToUse}`);
      }
    }
    
    // Enviar dados completos incluindo um flag indicando se é businessId ou leadId
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: idToUse,
      isBusinessId: !!lead.businessId,
      leadId: lead.id,
      fromStageId: stageId
    }));
    
    setDraggedLead(lead);
    
    // Adicionar uma classe ao elemento sendo arrastado para estilização
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add('dragging');
    }
  };

  // Função para permitir o drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Função para tratar o drop de um lead em um estágio
  const handleDrop = async (e: React.DragEvent, toStageId: string | number) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { id, isBusinessId, leadId, fromStageId } = data;
      
      if (fromStageId === toStageId) {
        console.log('Drop na mesma coluna, ignorando');
        return;
      }

      console.log(`Movendo item ${id} de ${fromStageId} para ${toStageId}`);
      console.log(`Dados do arrasto:`, data);
      
      // Encontrar o lead em todos os estágios
      let movingLead = null;
      let foundInStageId = '';
      
      // Procurar em todos os estágios para garantir que o encontremos
      for (const stageId in leads) {
        // Verificar primeiro se o item arrastado é um businessId
        const foundByBusinessId = leads[stageId]?.find(lead => 
          lead.businessId && String(lead.businessId) === String(id)
        );
        
        if (foundByBusinessId) {
          movingLead = foundByBusinessId;
          foundInStageId = stageId;
          console.log(`Negócio encontrado pelo businessId no estágio ${stageId}:`, foundByBusinessId);
          break;
        }
        
        // Se não encontrou pelo businessId, tentar pelo leadId ou id normal
        const foundLead = leads[stageId]?.find(lead => {
          return String(lead.id) === String(leadId) || 
                 (lead.leadId && String(lead.leadId) === String(leadId));
        });
        
        if (foundLead) {
          movingLead = foundLead;
          foundInStageId = stageId;
          console.log(`Lead encontrado no estágio ${stageId}:`, foundLead);
          break;
        }
      }
      
      if (!movingLead) {
        console.error('Lead não encontrado para mover:', leadId);
        toast({
          title: "Erro",
          description: "Não foi possível encontrar o negócio para mover. Tente atualizar a página.",
          variant: "destructive",
        });
        return;
      }
      
      // Verificar se o ID é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      // Identificar o businessId diretamente
      let businessIdToSend = null;
      
      // Se já temos um businessId confirmado do arrasto, usar ele diretamente
      if (isBusinessId && uuidRegex.test(String(id))) {
        businessIdToSend = id;
        console.log(`Usando businessId do arrasto: ${businessIdToSend}`);
      }
      // Caso contrário, verificar outras opções
      else {
        // Verificar se temos um businessId explícito no objeto
        if (movingLead.businessId && uuidRegex.test(String(movingLead.businessId))) {
          businessIdToSend = movingLead.businessId;
          console.log(`Usando businessId explícito: ${businessIdToSend}`);
        } 
        // Se for um UUID válido no ID principal, pode ser o businessId
        else if (uuidRegex.test(String(movingLead.id))) {
          businessIdToSend = movingLead.id;
          console.log(`Usando ID principal como businessId: ${businessIdToSend}`);
        }
        // Verificar se temos um campo businessId no customFields
        else if (movingLead.customFields && 
                movingLead.customFields.businessId && 
                uuidRegex.test(String(movingLead.customFields.businessId))) {
          businessIdToSend = movingLead.customFields.businessId;
          console.log(`Usando businessId de customFields: ${businessIdToSend}`);
        }
      }
      
      // Verificação final do ID antes de enviar para API
      if (!businessIdToSend) {
        console.error('❌ Nenhum ID de negócio válido encontrado');
        toast({
          title: "Erro",
          description: "Não foi possível identificar o ID do negócio para mover. Tente atualizar a página.",
          variant: "destructive",
        });
        return;
      }
      
      if (!uuidRegex.test(String(businessIdToSend))) {
        console.error(`❌ ID de negócio inválido (não é UUID): ${businessIdToSend}`);
        toast({
          title: "Erro",
          description: "ID de negócio inválido. Formato UUID esperado.",
          variant: "destructive",
        });
        return;
      }
      
      // Mostrar feedback visual imediato
      toast({
        title: "Movendo negócio...",
        description: "Atualizando a posição do negócio.",
      });
      
      // Atualizar UI otimisticamente antes da chamada da API
      updateLeadStageLocally(leadId, foundInStageId, String(toStageId), movingLead);
      
      // Copiar o objeto para modificar apenas o novo
      const updatedLead = {
        ...movingLead,
        stageId: String(toStageId)
      };
      
      try {
        // Usar a função moveBusinessToStage da API para movimentar o negócio
        console.log(`Enviando requisição para moveBusinessToStage (${businessIdToSend} para ${toStageId})`);
        
        const updatedBusiness = await moveBusinessToStage(String(businessIdToSend), String(toStageId));
        
        console.log('Resposta da API de movimentação:', updatedBusiness);
        
        // Sucesso - atualizar o estado local permanentemente
        setLeads(prevLeads => {
          const newLeads = { ...prevLeads };
          // Garantir que o lead tenha o novo stageId
          if (newLeads[toStageId]) {
            newLeads[toStageId] = newLeads[toStageId].map(lead => {
              if ((lead.businessId && lead.businessId === businessIdToSend) || 
                  (lead.id === leadId) || 
                  (lead.leadId === leadId)) {
                return { 
                  ...lead, 
                  stageId: String(toStageId)
                };
              }
              return lead;
            });
          }
          return newLeads;
        });
        
        // Atualizar os stages também
        setStages(prevStages => {
          return prevStages.map(stage => {
            if (stage.id === toStageId) {
              // Encontrar o lead no estágio de destino e garantir o stageId correto
              return {
                ...stage,
                leads: stage.leads?.map(lead => {
                  if ((lead.businessId && lead.businessId === businessIdToSend) || 
                      (lead.id === leadId) || 
                      (lead.leadId === leadId)) {
                    return { 
                      ...lead, 
                      stageId: String(toStageId)
                    };
                  }
                  return lead;
                })
              };
            }
            return stage;
          });
        });
        
        // Forçar uma atualização da UI
        forceUpdate();
        
        // Notificar o usuário sobre o sucesso
        toast({
          title: "Sucesso",
          description: "Negócio movido com sucesso!",
        });
        
      } catch (apiError) {
        console.error('Erro da API ao mover negócio:', apiError);
        
        // Reverter mudanças na UI
        updateLeadStageLocally(leadId, String(toStageId), foundInStageId, movingLead);
        
        toast({
          title: "Erro",
          description: apiError instanceof Error ? apiError.message : "Erro ao mover o negócio. Tente novamente.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Erro ao mover negócio:', error);
      toast({
        title: "Erro",
        description: "Erro ao mover o negócio. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  // Função auxiliar para atualizar o lead localmente entre estágios
  const updateLeadStageLocally = (leadId: string | number, fromStageId: string, toStageId: string, lead: Lead) => {
    // Atualizar leads
    setLeads(prevLeads => {
      const newLeads = { ...prevLeads };
      
      // Remover do estágio de origem
      if (newLeads[fromStageId]) {
        newLeads[fromStageId] = newLeads[fromStageId].filter(l => 
          String(l.id) !== String(leadId) && 
          (!l.businessId || String(l.businessId) !== String(leadId))
        );
      }
      
      // Adicionar ao estágio de destino
      if (!newLeads[toStageId]) {
        newLeads[toStageId] = [];
      }
      
      newLeads[toStageId] = [
        ...newLeads[toStageId],
        {
          ...lead,
          stageId: toStageId
        }
      ];
      
      return newLeads;
    });
    
    // Atualizar stages também
    setStages(prevStages => {
      return prevStages.map(stage => {
        if (stage.id === fromStageId) {
          return {
            ...stage,
            leads: stage.leads?.filter(l => 
              String(l.id) !== String(leadId) && 
              (!l.businessId || String(l.businessId) !== String(leadId))
            )
          };
        } else if (stage.id === toStageId) {
          return {
            ...stage,
            leads: [
              ...(stage.leads || []),
              {
                ...lead,
                stageId: toStageId
              }
            ]
          };
        }
        return stage;
      });
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">Carregando pipeline...</div>;
  }

  // Debug: verificar se os estágios e leads foram carregados corretamente
  console.log("Renderizando PipelineBoard com:", { 
    totalStages: stages.length, 
    totalLeadsMapped: Object.keys(leads).reduce((acc, stageId) => acc + leads[stageId].length, 0),
    leadsMap: leads
  });

  // Se não há estágios, mostrar mensagem apropriada
  if (stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
        <Kanban className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Nenhuma etapa configurada</h2>
        <p className="text-muted-foreground mb-6">
          Você ainda não tem etapas configuradas para este funil.
          Crie as etapas para começar a organizar suas oportunidades.
        </p>
        <Button onClick={createDefaultStages}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Criar etapas padrão
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <span className="text-muted-foreground">Carregando pipeline...</span>
        </div>
      ) : originNotFound ? (
        <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Origem não encontrada</h2>
          <p className="text-muted-foreground mb-6">
            A origem selecionada não existe ou não foi configurada corretamente.
            Selecione outra origem ou crie uma nova configuração.
          </p>
          <Button onClick={createDefaultStages}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Criar etapas padrão
            </Button>
          </div>
      ) : stages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
          <Kanban className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Nenhuma etapa configurada</h2>
          <p className="text-muted-foreground mb-6">
            Você ainda não tem etapas configuradas para este funil.
            Crie as etapas para começar a organizar suas oportunidades.
          </p>
          <Button onClick={createDefaultStages}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Criar etapas padrão
          </Button>
        </div>
      ) : (
        <div className="flex overflow-x-auto gap-4 p-4 h-full scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {stages.map((stage) => {
            console.log(`Renderizando estágio ${stage.name} (${stage.id})`);
            
            // Verificar se estamos usando filtros
            const usingFilters = filters && 
              ((filters.tags && filters.tags.length > 0) || 
               (filters.owners && filters.owners.length > 0) || 
               filters.date);
            
            console.log(`Estágio ${stage.name}: Usando filtros:`, usingFilters);
            
            // Usar leads filtrados se disponíveis e se estamos filtrando, caso contrário usar os leads originais
            const stageLeads = (usingFilters && Object.keys(filteredLeads).length > 0) 
              ? (filteredLeads[stage.id] || []) 
              : (leads[stage.id] || []);
            
            console.log(`Estágio ${stage.name}: Leads originais: ${leads[stage.id]?.length || 0}`);
            console.log(`Estágio ${stage.name}: Leads filtrados: ${filteredLeads[stage.id]?.length || 0}`);
            console.log(`Estágio ${stage.name}: Leads a exibir: ${stageLeads.length}`);
            
            const totalValue = stageLeads.reduce((sum, lead) => {
              const numValue = typeof lead.value === 'string'
                ? parseFloat(lead.value.replace(/[^\d.,]/g, '').replace(',', '.'))
                : lead.value;
              return sum + (isNaN(numValue) ? 0 : numValue);
            }, 0);
            
            // Garantir que cada lead tenha todas as propriedades necessárias
            const preparedLeads = stageLeads
              // Primeiro filtramos eventos do sistema
              .filter(lead => {
                // Não incluir eventos do sistema no render
                if (lead.type === 'refresh-event' || 
                    lead.type === 'refresh-event-origin-change' || 
                    lead.id === 'force-refresh' || 
                    lead.id === 'force-refresh-origin-change') {
                  return false;
                }
                return true;
              })
              .map(lead => {
                // Logs adicionais para diagnóstico
                console.log(`Preparando objeto de negócio para renderização:`, {
                  id: lead.id,
                  businessId: lead.businessId,
                  leadId: lead.leadId,
                  stageId: lead.stageId,
                  type: lead.type || 'unknown'
                });
                
                // CRÍTICO: Determinar o ID principal correto baseado no tipo de objeto
                let idToUse: string | number;
                let businessIdToUse: string | undefined;
                let leadIdToUse: string | undefined;
                
                // Priorizar businessId se disponível
                if (lead.businessId) {
                  businessIdToUse = lead.businessId;
                  idToUse = lead.businessId; // O ID principal é o businessId
                  leadIdToUse = lead.leadId || (typeof lead.id === 'string' ? lead.id : undefined); // O ID do lead associado
                  console.log(`Item com businessId disponível, usando ${businessIdToUse} como ID principal`);
                } else {
                  // Se não há businessId, usar o ID do lead
                  idToUse = lead.id;
                  leadIdToUse = typeof lead.id === 'string' ? lead.id : undefined;
                  businessIdToUse = undefined;
                  console.log(`Item sem businessId, usando lead.id (${idToUse}) como ID principal`);
                }
                
                // Verificar se o ID é um UUID válido (apenas para diagnóstico)
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                const isValidUUID = uuidRegex.test(String(idToUse));
                
                if (!isValidUUID) {
                  console.warn(`ID possivelmente inválido: idToUse não é um UUID válido:`, idToUse);
                }
                
                return {
                  ...lead,
                  // Usar o ID apropriado como ID principal
                  id: idToUse,
                  // Garantir que businessId seja explícito quando disponível
                  businessId: businessIdToUse,
                  // Garantir que leadId seja definido
                  leadId: leadIdToUse,
                  // Garantir que todos campos importantes estejam presentes
                  title: lead.title || lead.name || 'Lead sem título',
                  fullName: lead.fullName || lead.name || lead.title || 'Sem nome',
                  createdAt: lead.createdAt || new Date().toISOString(),
                  progress: lead.progress || 0,
                  tags: lead.tags || (lead.labels ? lead.labels.map(l => ({ name: l, color: getRandomColor(l) })) : []),
                  contact: lead.contact || lead.email || 'Sem contato',
                  phone: lead.phone || '',
                  photo: lead.photo || undefined,
                  value: lead.value ? (typeof lead.value === 'string' ? lead.value : `R$ ${Number(lead.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`) : 'R$ 0,00',
                  email: lead.email || lead.contact || '',
                  originId: lead.originId,
                  stageId: lead.stageId || stage.id,
                  // Determinar o tipo com base na existência de businessId
                  type: lead.businessId ? 'business' : 'lead'
                };
              });
            
            console.log(`Estágio ${stage.name}: Leads preparados:`, preparedLeads);
            
            return (
          <StageColumn 
            key={stage.id}
            id={String(stage.id)}
            name={stage.name}
            totalValue={formatValue(totalValue)}
            leads={preparedLeads}
            stageIndex={stages.findIndex(s => s.id === stage.id)}
            totalStages={stages.length}
            onAddClick={() => handleAddClick(stage.id, stage.name)}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onEditClick={handleEditClick}
            onDeleteLead={(businessId: string | number) => handleDeleteLead(String(businessId))}
            formatValue={formatValue}
            formatDate={formatDate}
          />
            );
          })}

          <div className="min-w-[300px] flex-shrink-0">
            <Button
              variant="outline"
              className="w-full border-dashed h-10 border-2"
              onClick={() => toast({
                description: "Funcionalidade em desenvolvimento."
              })}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Adicionar Etapa
            </Button>
          </div>
      </div>
          )}

      {showModal && (
        <AddBusinessModal
          isOpen={showModal}
          onClose={() => {
            console.log('PipelineBoard: fechando modal AddBusinessModal');
            setShowModal(false);
          }}
          stageId={currentStageId}
          stageName={currentStageName}
          originId={currentOriginId}
          onAddBusiness={(business) => {
            console.log('PipelineBoard: callback onAddBusiness chamado com:', business);
            handleAddLead(business);
          }}
        />
      )}

      {editingLead && (
        <EditLeadModal
          isOpen={!!editingLead}
          onClose={() => setEditingLead(null)}
          lead={editingLead as any}
          onSave={handleUpdateLead as any}
        />
      )}
    </div>
  );
}
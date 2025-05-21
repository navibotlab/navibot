'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  Plus, FolderPlus, Globe, Search, ChevronRight, ChevronDown, 
  Pin, Settings, Archive, Trash2, MoreHorizontal, MoreVertical, 
  AlertTriangle, Bookmark, Heart, Star, User, ShoppingCart, 
  Clock, BarChart2, Camera, Music, Calendar, Monitor, Tag, 
  Mail, Smile, Briefcase, BarChart, Target, Link as LinkIcon, 
  Bell, Gift, Wifi, Code, Shield, Upload, Download, 
  MessageSquare, MessageCircle, Home, Phone
} from 'lucide-react';
import { AddOriginGroupModal } from './components/AddOriginGroupModal';
import { AddOriginModal } from './components/AddOriginModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

interface Origin {
  id: string;
  name: string;
  active: boolean;
}

interface OriginGroup {
  id: string;
  name: string;
  color: string;
  icon?: string;
  expanded?: boolean;
  origins?: Origin[];
}

export default function PipelineLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [isAddOriginModalOpen, setIsAddOriginModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [originGroups, setOriginGroups] = useState<OriginGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [hoveredOriginId, setHoveredOriginId] = useState<string | null>(null);
  const [showOriginMenu, setShowOriginMenu] = useState<string | null>(null);
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const [showGroupMenu, setShowGroupMenu] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOriginId, setConfirmDeleteOriginId] = useState<string | null>(null);
  const [deleteOriginName, setDeleteOriginName] = useState<string>('');
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [deleteGroupName, setDeleteGroupName] = useState('');

  // Carregar grupos de origem ao montar o componente
  useEffect(() => {
    fetchOriginGroups();
  }, []);

  const fetchOriginGroups = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/crm/origin-groups');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar grupos de origem');
      }
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        // Mapear dados da API para o formato esperado pelo componente
        const groupsWithOrigins = await Promise.all(data.data.map(async (group: any) => {
          // Buscar origens para este grupo
          const originsResponse = await fetch(`/api/crm/origins?originGroupId=${group.id}`);
          
          if (!originsResponse.ok) {
            console.error(`Erro ao buscar origens para o grupo ${group.id}`);
            return {
              id: group.id,
              name: group.name,
              color: group.color || '#9333EA',
              icon: group.icon || 'user',
              origins: []
            };
          }
          
          const originsData = await originsResponse.json();
          const origins = originsData.data || [];
          
          return {
            id: group.id,
            name: group.name,
            color: group.color || '#9333EA',
            icon: group.icon || 'user',
            origins: origins.map((origin: any) => ({
              id: origin.id,
              name: origin.name,
              active: origin.active
            }))
          };
        }));
        
        setOriginGroups(groupsWithOrigins);
        
        // Inicialize todos os grupos como expandidos por padrão
        const initialExpandedState: Record<string, boolean> = {};
        groupsWithOrigins.forEach(group => {
          initialExpandedState[group.id] = true;
        });
        setExpandedGroups(initialExpandedState);
      }
    } catch (error) {
      console.error('Erro ao buscar grupos de origem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os grupos de origem",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGroup = async (group: { name: string; color: string; icon: string }) => {
    try {
      if (!group.name || group.name.trim() === '') {
        toast({
          title: "Erro",
          description: "O nome do grupo é obrigatório",
          variant: "destructive",
        });
        return;
      }
      
      // Extrair o código hexadecimal da cor
      let colorHex = '#9333EA'; // Cor padrão
      
      // Verificar se a cor está no formato esperado (bg-[#XXXXXX])
      const colorMatch = group.color.match(/\[#([0-9A-Fa-f]{6})\]/);
      if (colorMatch && colorMatch[1]) {
        colorHex = `#${colorMatch[1]}`;
      }
      
      // Preparar os dados completos para envio
      const groupData = {
        name: group.name.trim(),
        color: colorHex,
        icon: group.icon || 'user', // Garantir que o ícone seja enviado
        description: '' // Descrição vazia por padrão
      };
      
      console.log("Enviando requisição para criar grupo:", groupData);
      
      // Fazer a requisição
      try {
        const response = await fetch('/api/crm/origin-groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(groupData),
        });
        
        console.log("Status da resposta:", response.status);
        
        // Tentar obter o corpo completo da resposta
        const responseText = await response.text();
        console.log("Corpo da resposta:", responseText);
        
        // Analisar como JSON se possível
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log("Resposta como JSON:", responseData);
        } catch (e) {
          console.log("Resposta não é JSON válido");
        }
        
        if (!response.ok) {
          // Determinar mensagem de erro específica
          let errorMessage = "Erro ao criar grupo";
          
          if (responseData && responseData.error) {
            errorMessage = responseData.error;
          } else if (response.status === 400) {
            errorMessage = "Dados inválidos para criar o grupo";
          } else if (response.status === 409) {
            errorMessage = "Já existe um grupo com este nome";
          } else if (response.status === 500) {
            errorMessage = "Erro interno no servidor";
          }
          
          toast({
            title: "Erro",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }
        
        // Sucesso! Atualizar a lista e fechar o modal
        console.log("Grupo criado com sucesso!");
        fetchOriginGroups();
        
        toast({
          title: "Sucesso",
          description: "Grupo de origem criado com sucesso!",
        });
        
        setIsAddGroupModalOpen(false);
      } catch (fetchError) {
        console.error("Erro na requisição:", fetchError);
        toast({
          title: "Erro",
          description: "Erro ao conectar ao servidor. Verifique sua conexão.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro geral:", error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar grupo",
        variant: "destructive",
      });
    }
  };

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Filtrar grupos de origem com base no termo de busca
  const filteredGroups = searchTerm 
    ? originGroups.filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (group.origins && group.origins.some(origin => 
          origin.name.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      )
    : originGroups;

  const handleOriginAdded = () => {
    // Atualizar a lista de grupos e origens após adicionar uma nova origem
    fetchOriginGroups();
  };

  // Adicionar uma função para lidar com o clique no menu
  const handleMenuClick = (e: React.MouseEvent, originId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calcular a posição do dropdown com base no botão clicado
    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    
    setDropdownPosition({
      top: rect.top, // Manter na mesma altura do botão
      left: rect.left - 190 // 190px para a esquerda do botão para ficar mais próximo
    });
    
    // Alternar o menu para o originId clicado ou fechar se já estiver aberto
    setShowOriginMenu(showOriginMenu === originId ? null : originId);
  };

  // Fechar menu dropdown quando clicar em qualquer lugar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showOriginMenu) {
        setShowOriginMenu(null);
      }
    };
    
    // Adicionar o listener apenas se o menu estiver aberto
    if (showOriginMenu) {
      // Usar setTimeout para evitar que o evento de clique que abriu o menu também o feche
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showOriginMenu]);

  // Adicionar uma função para lidar com o clique no menu do grupo
  const handleGroupMenuClick = (e: React.MouseEvent, groupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calcular a posição do dropdown com base no botão clicado
    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    
    setDropdownPosition({
      top: rect.top, // Manter na mesma altura do botão
      left: rect.left - 190 // 190px para a esquerda do botão para ficar mais próximo
    });
    
    // Alternar o menu para o groupId clicado ou fechar se já estiver aberto
    setShowGroupMenu(showGroupMenu === groupId ? null : groupId);
  };

  // Fechar menu dropdown do grupo quando clicar em qualquer lugar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showGroupMenu) {
        setShowGroupMenu(null);
      }
    };
    
    // Adicionar o listener apenas se o menu estiver aberto
    if (showGroupMenu) {
      // Usar setTimeout para evitar que o evento de clique que abriu o menu também o feche
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showGroupMenu]);

  // Função para excluir uma origem
  const handleDeleteOrigin = async (originId: string, originName: string) => {
    // Primeiro mostramos o diálogo de confirmação
    setConfirmDeleteOriginId(originId);
    setDeleteOriginName(originName);
    setShowOriginMenu(null);
  };

  // Função para confirmar e realizar a exclusão
  const confirmDeleteOrigin = async () => {
    if (!confirmDeleteOriginId) return;
    
    try {
      setIsDeleting(true);
      
      // Guardar ID da origem que está sendo excluída para verificar se é a origem atual
      const originId = confirmDeleteOriginId.trim();
      const isCurrentOrigin = searchParams?.get('origin') === originId;
      
      console.log('[CLIENT] ID da origem a ser excluída:', originId);
      console.log('[CLIENT] É a origem atual?', isCurrentOrigin);
      
      // API Route correta seguindo o padrão Next.js para rotas dinâmicas
      const url = `/api/crm/origins/${originId}`;
      console.log('[CLIENT] Enviando requisição DELETE para:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('[CLIENT] Resposta do servidor:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `Erro ${response.status}: A operação não pode ser concluída`;
        let errorDetails = '';
        let businessCount = 0;
        
        try {
          // Obter o texto da resposta
          const responseText = await response.text();
          console.log('[CLIENT] Texto completo da resposta de erro:', responseText);
          
          // Verificar se é JSON válido
          if (responseText.trim().startsWith('{')) {
            const errorData = JSON.parse(responseText);
            const details = errorData.details || '';
            errorMessage = errorData.message || errorData.error || errorMessage;
            
            // Capturar informações específicas do erro
            if (errorData.businessCount) {
              businessCount = errorData.businessCount;
            }
            
            console.log('[CLIENT] Erro detalhado:', errorData);
            
            if (details) {
              errorDetails = details;
              console.error('[CLIENT] Stack trace do erro:', details);
            }
          } else if (responseText.includes('<!DOCTYPE html>')) {
            console.error('[CLIENT] Resposta HTML recebida do servidor. Verifique a implementação da API.');
            errorMessage = 'Erro no servidor: Verifique o console do servidor para mais detalhes';
          }
        } catch (parseError) {
          console.error('[CLIENT] Erro ao analisar resposta:', parseError);
        }
        
        // Personalizar a mensagem de erro para o usuário
        if (response.status === 409 && businessCount > 0) {
          toast({
            title: "Não é possível excluir esta origem",
            description: `Existem ${businessCount} negócios associados a esta origem. Para excluir, primeiro remova ou mova esses negócios para outra origem.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro",
            description: errorMessage,
            variant: "destructive",
          });
        }
        
        throw new Error(errorMessage);
      }
      
      // Processar resposta de sucesso
      const data = await response.json();
      console.log('[CLIENT] Resposta de sucesso:', data);
      
      // Notificar o usuário do sucesso com informações adicionais
      let successMessage = `A origem "${deleteOriginName}" foi excluída com sucesso.`;
      
      // Adicionar informações sobre dados relacionados excluídos
      if (data.deletedBusinessCount > 0 || data.deletedStagesCount > 0) {
        successMessage += ` Também foram excluídos`;
        
        if (data.deletedBusinessCount > 0) {
          successMessage += ` ${data.deletedBusinessCount} negócio(s)`;
        }
        
        if (data.deletedBusinessCount > 0 && data.deletedStagesCount > 0) {
          successMessage += ` e`;
        }
        
        if (data.deletedStagesCount > 0) {
          successMessage += ` ${data.deletedStagesCount} estágio(s)`;
        }
        
        successMessage += ` relacionados.`;
      }
      
      toast({
        title: "Origem excluída",
        description: successMessage,
      });
      
      // Se estava visualizando a origem excluída, redirecionar para a página principal
      if (isCurrentOrigin) {
        // Redirecionar para a página principal do pipeline usando window.location
        // para garantir que não haja tentativas de buscar a origem excluída
        console.log('Usuário estava visualizando a origem excluída. Redirecionando...');
        
        // Limpar estados antes do redirecionamento
        setConfirmDeleteOriginId(null);
        setDeleteOriginName('');
        setIsDeleting(false);
        
        // Cancelar qualquer operação pendente e forçar redirecionamento
        setTimeout(() => {
          window.location.href = '/crm/pipeline';
        }, 300);
        
        return; // Sair da função para não executar o restante
      } else {
        // Se o usuário não estiver na página da origem excluída, apenas atualizar a lista
        console.log('Recarregando a lista de origens após exclusão bem-sucedida');
        fetchOriginGroups();
      }
      
    } catch (error) {
      console.error('[CLIENT] Erro completo ao excluir origem:', error);
      // Toast já foi exibido acima quando tratamos a resposta de erro
    } finally {
      // Só limpar os estados se não redirecionou
      if (searchParams?.get('origin') !== confirmDeleteOriginId) {
        setIsDeleting(false);
        setConfirmDeleteOriginId(null);
        setDeleteOriginName('');
      }
    }
  };

  // Função para cancelar a exclusão
  const cancelDeleteOrigin = () => {
    setConfirmDeleteOriginId(null);
    setDeleteOriginName('');
  };

  // Função para iniciar a exclusão de um grupo
  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    // Primeiro mostramos o diálogo de confirmação
    setConfirmDeleteGroupId(groupId);
    setDeleteGroupName(groupName);
    setShowGroupMenu(null);
  };

  // Função para confirmar e realizar a exclusão do grupo
  const confirmDeleteGroup = async () => {
    if (!confirmDeleteGroupId) return;
    
    try {
      setIsDeleting(true);
      
      // Guardar ID do grupo que está sendo excluído
      const groupId = confirmDeleteGroupId.trim();
      console.log('[CLIENT] ID do grupo a ser excluído:', groupId);
      
      // API Route para excluir grupo
      const url = `/api/crm/origin-groups/${groupId}`;
      console.log('[CLIENT] Enviando requisição DELETE para:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('[CLIENT] Resposta do servidor:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `Erro ${response.status}: A operação não pode ser concluída`;
        let errorDetails = '';
        
        try {
          // Obter o texto da resposta
          const responseText = await response.text();
          console.log('[CLIENT] Texto completo da resposta de erro:', responseText);
          
          // Verificar se é JSON válido
          if (responseText.trim().startsWith('{')) {
            const errorData = JSON.parse(responseText);
            const details = errorData.details || '';
            errorMessage = errorData.message || errorData.error || errorMessage;
            
            console.log('[CLIENT] Erro detalhado:', errorData);
            
            if (details) {
              errorDetails = details;
              console.error('[CLIENT] Stack trace do erro:', details);
            }
          } else if (responseText.includes('<!DOCTYPE html>')) {
            console.error('[CLIENT] Resposta HTML recebida do servidor. Verifique a implementação da API.');
            errorMessage = 'Erro no servidor: Verifique o console do servidor para mais detalhes';
          }
        } catch (parseError) {
          console.error('[CLIENT] Erro ao analisar resposta:', parseError);
        }
        
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
        
        throw new Error(errorMessage);
      }
      
      // Processar resposta de sucesso (204 No Content)
      console.log('[CLIENT] Exclusão bem-sucedida');
      
      // Processar resposta de sucesso
      const data = await response.json();
      console.log('[CLIENT] Resposta de sucesso:', data);
      
      // Notificar o usuário do sucesso com informações adicionais
      let successMessage = `O grupo "${deleteGroupName}" foi excluído com sucesso.`;
      
      // Adicionar informações sobre dados relacionados excluídos
      const hasDetails = data.deletedOriginsCount > 0 || data.deletedBusinessCount > 0 || 
                         data.deletedLeadsCount > 0 || data.deletedStagesCount > 0;
      
      if (hasDetails) {
        successMessage += ` Também foram excluídos:`;
        
        if (data.deletedOriginsCount > 0) {
          successMessage += ` ${data.deletedOriginsCount} origem(ns)`;
        }
        
        if (data.deletedStagesCount > 0) {
          if (data.deletedOriginsCount > 0) {
            successMessage += `,`;
          }
          successMessage += ` ${data.deletedStagesCount} estágio(s)`;
        }
        
        if (data.deletedBusinessCount > 0) {
          if (data.deletedOriginsCount > 0 || data.deletedStagesCount > 0) {
            successMessage += `,`;
          }
          successMessage += ` ${data.deletedBusinessCount} negócio(s)`;
        }
        
        if (data.deletedLeadsCount > 0) {
          if (data.deletedOriginsCount > 0 || data.deletedStagesCount > 0 || data.deletedBusinessCount > 0) {
            successMessage += ` e`;
          }
          successMessage += ` ${data.deletedLeadsCount} lead(s)`;
        }
      }
      
      toast({
        title: "Grupo excluído",
        description: successMessage,
      });
      
      // Recarregar a lista de grupos
      fetchOriginGroups();
      
    } catch (error) {
      console.error('[CLIENT] Erro completo ao excluir grupo:', error);
      // Toast já foi exibido acima quando tratamos a resposta de erro
    } finally {
      setIsDeleting(false);
      setConfirmDeleteGroupId(null);
      setDeleteGroupName('');
    }
  };

  // Função para cancelar a exclusão do grupo
  const cancelDeleteGroup = () => {
    setConfirmDeleteGroupId(null);
    setDeleteGroupName('');
  };

  // Renderiza o ícone correto com base no ID do ícone
  const renderGroupIcon = (iconId?: string) => {
    const size = 16; // Tamanho do ícone
    
    switch (iconId) {
      case 'bookmark': return <Bookmark size={size} className="text-white" />;
      case 'heart': return <Heart size={size} className="text-white" />;
      case 'star': return <Star size={size} className="text-white" />;
      case 'user': return <User size={size} className="text-white" />;
      case 'shopping-cart': return <ShoppingCart size={size} className="text-white" />;
      case 'clock': return <Clock size={size} className="text-white" />;
      case 'settings': return <Settings size={size} className="text-white" />;
      case 'bar-chart-2': return <BarChart2 size={size} className="text-white" />;
      case 'camera': return <Camera size={size} className="text-white" />;
      case 'music': return <Music size={size} className="text-white" />;
      case 'calendar': return <Calendar size={size} className="text-white" />;
      case 'globe': return <Globe size={size} className="text-white" />;
      case 'monitor': return <Monitor size={size} className="text-white" />;
      case 'search': return <Search size={size} className="text-white" />;
      case 'tag': return <Tag size={size} className="text-white" />;
      case 'mail': return <Mail size={size} className="text-white" />;
      case 'smile': return <Smile size={size} className="text-white" />;
      case 'briefcase': return <Briefcase size={size} className="text-white" />;
      case 'bar-chart': return <BarChart size={size} className="text-white" />;
      case 'target': return <Target size={size} className="text-white" />;
      case 'link': return <LinkIcon size={size} className="text-white" />;
      case 'bell': return <Bell size={size} className="text-white" />;
      case 'gift': return <Gift size={size} className="text-white" />;
      case 'wifi': return <Wifi size={size} className="text-white" />;
      case 'code': return <Code size={size} className="text-white" />;
      case 'shield': return <Shield size={size} className="text-white" />;
      case 'upload': return <Upload size={size} className="text-white" />;
      case 'download': return <Download size={size} className="text-white" />;
      case 'message-circle': return <MessageCircle size={size} className="text-white" />;
      case 'message-square': return <MessageSquare size={size} className="text-white" />;
      case 'home': return <Home size={size} className="text-white" />;
      case 'phone': return <Phone size={size} className="text-white" />;
      default: return <User size={size} className="text-white" />; // Ícone padrão
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#0F1115]">
      {/* Menu lateral mobile - Header com botão toggle */}
      <div className="md:hidden p-4 bg-[#1A1D24] border-b border-gray-800">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center justify-between w-full text-white px-4 py-2 rounded-md bg-[#0F1115] hover:bg-[#2A2D34]"
        >
          <span>Origens</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform ${isMobileMenuOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Menu lateral com grupos de origens */}
      <aside
        className={cn(
          "md:w-1/4 lg:w-1/5 bg-[#1A1D24] border-r border-gray-800 overflow-y-auto flex flex-col",
          isMobileMenuOpen ? "block" : "hidden md:block"
        )}
      >
        {/* Cabeçalho do menu lateral */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-200">ORIGENS</span>
          </div>
          
          <div className="relative flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setIsSearchOpen(!isSearchOpen);
                    }}
                    className="text-gray-400 hover:text-white rounded-lg p-1"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Buscar origens</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                    className="text-gray-400 hover:text-white rounded-lg p-1"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Adicionar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {isAddDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#1A1D24] rounded-lg shadow-lg overflow-hidden z-10 border border-gray-800">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsAddDropdownOpen(false);
                      setSelectedGroupId(undefined);
                      console.log("Abrindo modal de adicionar origem...");
                      setIsAddOriginModalOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#0F1115] flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span>Adicionar origem</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAddDropdownOpen(false);
                      setIsAddGroupModalOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#0F1115] flex items-center"
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    <span>Adicionar grupo de origens</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Campo de busca */}
        {isSearchOpen && (
          <div className="p-3 border-b border-gray-800 bg-[#1A1D24]">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar origens..."
                className="pl-10 pr-4 py-2 w-full rounded-md text-sm bg-[#0F1115] text-white border border-gray-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lista de origens agrupadas */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-gray-400 text-center">
              <svg className="animate-spin h-5 w-5 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Carregando grupos de origem...</span>
            </div>
          ) : filteredGroups.length > 0 ? (
            <div className="space-y-1 p-2">
              {filteredGroups.map((group) => (
                <div key={group.id} className="mb-1 rounded-md overflow-hidden">
                  {/* Cabeçalho do grupo com botão expandir/recolher */}
                  <div 
                    className="flex items-center justify-between p-2 hover:bg-[#0F1115] rounded-md cursor-pointer group"
                    onClick={() => toggleGroupExpansion(group.id)}
                    onMouseEnter={() => setHoveredGroupId(group.id)}
                    onMouseLeave={() => hoveredGroupId === group.id ? setHoveredGroupId(null) : null}
                  >
                    <div className="flex items-center space-x-2">
                      {expandedGroups[group.id] ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                      <div 
                        className="ml-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" 
                        style={{ backgroundColor: group.color || '#9333EA' }}
                      >
                        {renderGroupIcon(group.icon)}
                      </div>
                      <span className="text-sm font-medium text-gray-300">{group.name}</span>
                    </div>
                    
                    {hoveredGroupId === group.id && (
                      <button 
                        onClick={(e) => handleGroupMenuClick(e, group.id)}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-[#0F1115] rounded-md focus:outline-none"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Menu dropdown do grupo */}
                    {showGroupMenu === group.id && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="fixed w-48 bg-[#1A1D24] rounded-lg shadow-lg overflow-hidden z-50 border border-gray-800"
                        style={{ 
                          top: `${dropdownPosition.top}px`, 
                          left: `${dropdownPosition.left}px` 
                        }}
                      >
                        <div className="py-1">
                          <button 
                            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#0F1115] flex items-center"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowGroupMenu(null);
                              // Implementação futura para configurações do grupo
                            }}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            <span>Configurações</span>
                          </button>
                          
                          <button 
                            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#0F1115] flex items-center"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowGroupMenu(null);
                              // Implementação futura para seleção de origens
                            }}
                          >
                            <Pin className="h-4 w-4 mr-2" />
                            <span>Selecionar origens</span>
                          </button>
                          
                          <button 
                            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#0F1115] flex items-center"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowGroupMenu(null);
                              // Implementação futura para arquivar grupo
                            }}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            <span>Arquivar</span>
                          </button>
                          
                          <button 
                            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#0F1115] flex items-center text-red-500"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowGroupMenu(null);
                              handleDeleteGroup(group.id, group.name);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Lista de origens do grupo (expandida/recolhida) */}
                  {expandedGroups[group.id] && group.origins && group.origins.length > 0 && (
                    <div className="pl-6 space-y-0.5 mt-0.5">
                      {group.origins.map((origin) => (
                        <div 
                          key={origin.id} 
                          className="relative flex items-center"
                          onMouseEnter={() => setHoveredOriginId(origin.id)}
                          onMouseLeave={() => hoveredOriginId === origin.id ? setHoveredOriginId(null) : null}
                        >
                          <div className="flex items-center w-full">
                            <Link
                              href={`/crm/pipeline?origin=${origin.id}`}
                              className={cn(
                                "flex-grow flex justify-between items-center p-2 text-sm rounded-md",
                                searchParams?.get('origin') === origin.id
                                  ? "bg-blue-900/30 text-white"
                                  : "text-gray-400 hover:bg-[#0F1115] hover:text-white"
                              )}
                            >
                              <span className={cn("truncate", !origin.active && "text-gray-500 line-through")}>
                                {origin.name}
                              </span>
                            </Link>
                            
                            {hoveredOriginId === origin.id && (
                              <button 
                                onClick={(e) => handleMenuClick(e, origin.id)}
                                className="p-1.5 ml-1 text-gray-500 hover:text-white hover:bg-[#0F1115] rounded-md focus:outline-none"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          
                          {/* Menu dropdown */}
                          {showOriginMenu === origin.id && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="fixed w-48 bg-[#1A1D24] rounded-lg shadow-lg overflow-hidden z-50 border border-gray-800"
                              style={{ 
                                top: `${dropdownPosition.top}px`, 
                                left: `${dropdownPosition.left}px` 
                              }}
                            >
                              <div className="py-1">
                                <button 
                                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#0F1115] flex items-center"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowOriginMenu(null);
                                    // Implementação futura
                                  }}
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  <span>Configurações</span>
                                </button>
                                
                                <button 
                                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#0F1115] flex items-center"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowOriginMenu(null);
                                    router.push(`/crm/pipeline?origin=${origin.id}`);
                                  }}
                                >
                                  <Pin className="h-4 w-4 mr-2" />
                                  <span>Selecionar origem</span>
                                </button>
                                
                                <button 
                                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#0F1115] flex items-center"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowOriginMenu(null);
                                    // Implementação futura
                                  }}
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  <span>Arquivar</span>
                                </button>
                                
                                <button 
                                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#0F1115] flex items-center text-red-500"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowOriginMenu(null);
                                    handleDeleteOrigin(origin.id, origin.name);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  <span>Excluir</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Mensagem quando o grupo não tem origens */}
                  {expandedGroups[group.id] && (!group.origins || group.origins.length === 0) && (
                    <div className="pl-6 py-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Abrindo modal a partir do grupo vazio:", group.id);
                          setSelectedGroupId(group.id);
                          setIsAddOriginModalOpen(true);
                        }}
                        className="text-sm text-gray-500 hover:text-blue-500 flex items-center"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        <span>Adicionar origem</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-gray-500 mb-3">Nenhum grupo de origem encontrado</p>
              <button
                onClick={() => setIsAddGroupModalOpen(true)}
                className="text-purple-500 hover:text-purple-400 flex items-center justify-center mx-auto"
              >
                <FolderPlus className="h-4 w-4 mr-1" />
                <span>Criar grupo de origens</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto bg-[#0F1115]">
        {children}
      </main>

      {/* Modal de confirmação de exclusão */}
      {confirmDeleteOriginId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1D24] rounded-lg w-full max-w-md shadow-xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h2 className="text-lg font-medium text-white">Confirmar exclusão</h2>
            </div>
            
            <p className="text-gray-300 mb-2">
              Você está prestes a excluir a origem <span className="font-semibold text-white">"{deleteOriginName}"</span>.
            </p>
            
            <p className="text-gray-300 mb-6">
              Esta ação excluirá todos os estágios e negócios associados a esta origem. Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteOrigin}
                disabled={isDeleting}
                className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 focus:outline-none"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteOrigin}
                disabled={isDeleting}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Excluindo...
                  </>
                ) : (
                  "Excluir origem"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para adicionar grupos de origem */}
      <AddOriginGroupModal
        isOpen={isAddGroupModalOpen}
        onClose={() => setIsAddGroupModalOpen(false)}
        onSave={handleSaveGroup}
      />

      {/* Modal para adicionar origens */}
      <AddOriginModal
        isOpen={isAddOriginModalOpen}
        onClose={() => setIsAddOriginModalOpen(false)}
        onOriginAdded={handleOriginAdded}
        selectedGroupId={selectedGroupId}
      />

      {/* Modal de confirmação de exclusão de grupo */}
      {confirmDeleteGroupId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1D24] rounded-lg w-full max-w-md shadow-xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h2 className="text-lg font-medium text-white">Confirmar exclusão</h2>
            </div>
            
            <p className="text-gray-300 mb-2">
              Você está prestes a excluir o grupo <span className="font-semibold text-white">"{deleteGroupName}"</span>.
            </p>
            
            <p className="text-gray-300 mb-6">
              Esta ação excluirá o grupo, todas as origens, estágios, negócios e leads associados. Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteGroup}
                disabled={isDeleting}
                className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 focus:outline-none"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteGroup}
                disabled={isDeleting}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Excluindo...
                  </>
                ) : (
                  "Excluir grupo"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
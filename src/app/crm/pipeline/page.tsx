'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { ArrowLeft, Search, Filter, Calendar, User, Tag, MoreHorizontal, RefreshCw, Download, Settings, Plus, Briefcase, Check, X } from 'lucide-react';
import Link from 'next/link';
import { PipelineBoard } from './components/PipelineBoard';
import { GlobalAddBusinessModal } from './components/GlobalAddBusinessModal';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@radix-ui/react-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Tipo para as etiquetas
interface ContactTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  usageCount?: number;
}

// Tipo para os usuários (donos de negócio)
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  photo?: string | null;
}

// Componente principal sem useSearchParams
export default function PipelinePage() {
  return (
    <Suspense fallback={<CarregandoPipeline />}>
      <PipelineContent />
    </Suspense>
  );
}

// Componente de carregamento para o fallback do Suspense
function CarregandoPipeline() {
  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Carregando Pipeline...</h1>
      </div>
      <div className="flex-1 bg-gray-100 rounded-lg animate-pulse"></div>
    </div>
  );
}

// Componente que usa useSearchParams dentro do Suspense
function PipelineContent() {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showGlobalAddModal, setShowGlobalAddModal] = useState(false);
  const [globalNewLead, setGlobalNewLead] = useState<any>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<any>(null);
  const [isLoadingOrigin, setIsLoadingOrigin] = useState(true);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Capturar o originId diretamente da URL para uso imediato
  const originIdFromUrl = searchParams?.get('origin');
  const [originId, setOriginId] = useState<string | undefined>(originIdFromUrl || undefined);
  const [originName, setOriginName] = useState<string>("Pipeline");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalOpportunities, setTotalOpportunities] = useState<number>(0);

  // Estados para filtros
  const [tags, setTags] = useState<ContactTag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearchTerm, setTagSearchTerm] = useState('');

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Estados para o filtro de data
  const [dateFilter, setDateFilter] = useState<{start: string | null, end: string | null} | null>(null);
  const [dateFilterLabel, setDateFilterLabel] = useState('Data');
  const currentDate = new Date();
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectionMode, setSelectionMode] = useState<'start' | 'end'>('start');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedDatePreset, setSelectedDatePreset] = useState<string | null>(null);
  
  // Gerar dados para os dois meses do calendário
  const [monthData, setMonthData] = useState(() => {
    const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    
    return [
      {
        month: thisMonth.getMonth(),
        year: thisMonth.getFullYear(),
        label: thisMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      },
      {
        month: nextMonth.getMonth(),
        year: nextMonth.getFullYear(),
        label: nextMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      }
    ];
  });

  // Funções para navegação do calendário
  const navigateMonth = (direction: number) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCalendarDate(newDate);
    
    // Atualizar os meses exibidos
    const thisMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
    const nextMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 1);
    
    setMonthData([
      {
        month: thisMonth.getMonth(),
        year: thisMonth.getFullYear(),
        label: thisMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      },
      {
        month: nextMonth.getMonth(),
        year: nextMonth.getFullYear(),
        label: nextMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      }
    ]);
  };

  const navigateToYear = (year: number) => {
    const newDate = new Date(calendarDate);
    newDate.setFullYear(year);
    setCalendarDate(newDate);
    
    // Atualizar os meses exibidos
    const thisMonth = new Date(year, newDate.getMonth(), 1);
    const nextMonth = new Date(year, newDate.getMonth() + 1, 1);
    
    setMonthData([
      {
        month: thisMonth.getMonth(),
        year: thisMonth.getFullYear(),
        label: thisMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      },
      {
        month: nextMonth.getMonth(),
        year: nextMonth.getFullYear(),
        label: nextMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      }
    ]);
  };

  // Função para gerar os dias do calendário
  const generateCalendarDays = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Determinar o dia da semana do primeiro dia (0 = Domingo, 6 = Sábado)
    const firstDayOfWeek = firstDay.getDay();
    
    // Array para armazenar todos os dias a serem exibidos no calendário
    const calendarDays = [];
    
    // Adicionar dias do mês anterior para preencher a primeira semana
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      const day = daysInPrevMonth - firstDayOfWeek + i + 1;
      calendarDays.push({
        day,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    // Adicionar dias do mês atual
    const today = new Date();
    const isToday = (day: number) => 
      today.getDate() === day && 
      today.getMonth() === month && 
      today.getFullYear() === year;
    
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push({
        day,
        month,
        year,
        isCurrentMonth: true,
        isToday: isToday(day)
      });
    }
    
    // Adicionar dias do próximo mês para completar a última semana
    const totalDaysAdded = calendarDays.length;
    const remainingCells = 42 - totalDaysAdded; // 6 semanas x 7 dias
    
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    
    for (let day = 1; day <= remainingCells; day++) {
      calendarDays.push({
        day,
        month: nextMonth,
        year: nextMonthYear,
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    return calendarDays;
  };

  // Função para formatar data para exibição
  const formatDateForDisplay = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  // Função para selecionar um dia específico
  const handleDaySelect = (day: number, month: number, year: number) => {
    // Limpar qualquer preset de data selecionado quando o usuário escolhe uma data manualmente
    setSelectedDatePreset(null);
    
    const selectedDate = new Date(year, month, day);
    const formattedDate = selectedDate.toISOString().split('T')[0]; // Formato ISO (YYYY-MM-DD)
    
    if (selectionMode === 'start') {
      // Definir data inicial e mudar para selecionar data final
      setStartDate(formattedDate);
      setEndDate(null);
      setSelectionMode('end');
      setDateFilterLabel(`A partir de ${day}/${month + 1}/${year}`);
    } else {
      // Definir data final
      const start = new Date(startDate || '');
      const end = selectedDate;
      
      // Garantir que a data final seja depois da inicial
      if (end < start) {
        // Se a data final for anterior à inicial, trocar as datas
        setEndDate(startDate);
        setStartDate(formattedDate);
      } else {
        setEndDate(formattedDate);
      }
      
      // Atualizar filtro e label
      setSelectionMode('start');
      updateDateFilter();
    }
  };
  
  // Atualizar filtro de data com base nas datas selecionadas
  const updateDateFilter = () => {
    if (startDate && endDate) {
      setDateFilter({ start: startDate, end: endDate });
      setDateFilterLabel(`${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`);
    } else if (startDate) {
      setDateFilter({ start: startDate, end: null });
      setDateFilterLabel(`A partir de ${formatDateForDisplay(startDate)}`);
    } else {
      setDateFilter(null);
      setDateFilterLabel('Data');
    }
  };
  
  // Efeito para atualizar o filtro quando as datas mudarem
  useEffect(() => {
    updateDateFilter();
  }, [startDate, endDate]);

  // Funções para filtros rápidos de data
  const handleDatePresetSelect = (preset: string) => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = new Date(today);
    
    // Definir qual preset está selecionado
    setSelectedDatePreset(preset);
    
    switch (preset) {
      case 'today':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        setDateFilterLabel('Hoje');
        break;
      case 'yesterday':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 1);
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 23, 59, 59);
        setDateFilterLabel('Ontem');
        break;
      case 'thisWeek':
        // Começar do primeiro dia da semana atual (domingo)
        startDate = new Date(today);
        const dayOfWeek = today.getDay(); // 0 = domingo, 6 = sábado
        startDate.setDate(today.getDate() - dayOfWeek);
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        setDateFilterLabel('Esta semana');
        break;
      case 'lastMonth':
        // Primeiro dia do mês passado
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        // Último dia do mês passado
        endDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
        setDateFilterLabel('Mês passado');
        break;
      case '12months':
        // Data atual - 12 meses
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        setDateFilterLabel('Últimos 12 meses');
        break;
      case '24months':
        // Data atual - 24 meses
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 2);
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        setDateFilterLabel('Últimos 24 meses');
        break;
      default:
        startDate = today;
        setDateFilterLabel('Data');
    }
    
    // Definir datas e filtro
    setStartDate(startDate.toISOString().split('T')[0]);
    setEndDate(endDate.toISOString().split('T')[0]);
    setDateFilter({ 
      start: startDate.toISOString().split('T')[0], 
      end: endDate.toISOString().split('T')[0]
    });
    setSelectionMode('start');
  };

  // Carregar tags e usuários quando o componente montar
  useEffect(() => {
    fetchTags();
    fetchUsers();
  }, []);

  // Função para buscar todas as tags disponíveis
  const fetchTags = async () => {
    try {
      setLoadingTags(true);
      
      // Primeiro tenta buscar com a API mais recente
      let response = await fetch('/api/contacts/tags');
      
      if (!response.ok) {
        // Se falhar, tenta com a API alternativa
        console.log('Tentando rota alternativa para tags');
        response = await fetch('/api/contact-tags');
        
        if (!response.ok) {
          // Se ambas falharem, tenta uma terceira opção
          response = await fetch('/api/crm/labels');
          
          if (!response.ok) {
            throw new Error('Falha ao carregar tags de todas as fontes possíveis');
          }
        }
      }
      
      const data = await response.json();
      console.log('Tags carregadas:', data);
      
      // Verificar o formato dos dados retornados e normalizar
      let normalizedTags: ContactTag[] = [];
      
      if (Array.isArray(data)) {
        // Formato direto de array
        normalizedTags = data;
      } else if (data.data && Array.isArray(data.data)) {
        // Formato aninhado em data
        normalizedTags = data.data;
      } else if (data.tags && Array.isArray(data.tags)) {
        // Formato aninhado em tags
        normalizedTags = data.tags;
      }
      
      // Adicionar algumas tags de teste se não houver tags
      if (normalizedTags.length === 0) {
        normalizedTags = [
          { id: 'tag1', name: 'Cliente VIP', color: '#E91E63', description: 'Clientes prioritários' },
          { id: 'tag2', name: 'Aguardando Resposta', color: '#FF9800', description: 'Em espera' },
          { id: 'tag3', name: 'Novo Lead', color: '#4CAF50', description: 'Leads recentes' },
          { id: 'tag4', name: 'Alto Valor', color: '#3F51B5', description: 'Negócios de alto valor' }
        ];
      }
      
      setTags(normalizedTags);
    } catch (error) {
      console.error('Erro ao buscar tags:', error);
      
      // Adicionar tags de fallback em caso de erro
      const fallbackTags = [
        { id: 'tag1', name: 'Cliente VIP', color: '#E91E63', description: 'Clientes prioritários' },
        { id: 'tag2', name: 'Aguardando Resposta', color: '#FF9800', description: 'Em espera' },
        { id: 'tag3', name: 'Novo Lead', color: '#4CAF50', description: 'Leads recentes' },
        { id: 'tag4', name: 'Alto Valor', color: '#3F51B5', description: 'Negócios de alto valor' }
      ];
      
      setTags(fallbackTags);
      
      toast({
        title: "Aviso",
        description: "Usando tags padrão devido a um erro de conexão",
        variant: "default",
      });
    } finally {
      setLoadingTags(false);
    }
  };

  // Função para buscar todos os usuários (donos de negócio) disponíveis
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/account/users');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar usuários');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handler para seleção de tags
  const handleTagSelection = (tagId: string) => {
    console.log(`Selecionando tag: ${tagId}`);
    console.log(`Estado atual das tags selecionadas:`, selectedTags);
    
    setSelectedTags(prev => {
      // Se já tiver selecionado 'none', limpar
      if (prev.includes('none') || prev.includes('all')) {
        console.log(`Limpando seleção especial anterior (none/all)`);
        return [tagId];
      }
      
      // Se já estiver selecionado, remover
      if (prev.includes(tagId)) {
        console.log(`Removendo tag ${tagId} da seleção`);
        return prev.filter(id => id !== tagId);
      } 
      // Caso contrário, adicionar
      else {
        console.log(`Adicionando tag ${tagId} à seleção`);
        const newTags = [...prev, tagId];
        console.log('Novas tags selecionadas:', newTags);
        return newTags;
      }
    });
  };

  // Efeito para depurar alterações nos filtros
  useEffect(() => {
    console.log('Tags selecionadas atualizadas:', selectedTags);
  }, [selectedTags]);

  useEffect(() => {
    console.log('Donos de negócio selecionados atualizados:', selectedUsers);
  }, [selectedUsers]);

  // Handler para seleção de usuários
  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      // Se já tiver selecionado 'none', limpar
      if (prev.includes('none')) {
        return [userId];
      }
      
      // Se já estiver selecionado, remover
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } 
      // Caso contrário, adicionar
      else {
        return [...prev, userId];
      }
    });
  };

  // Handler para seleção "Sem tag"
  const handleNoTagSelection = (checked: boolean) => {
    if (checked) {
      setSelectedTags(['none']);
    } else {
      setSelectedTags([]);
    }
  };

  // Handler para seleção "Todos os tags"
  const handleAllTagsSelection = (checked: boolean) => {
    console.log("Checkbox 'Todos os tags' alterado para:", checked);
    if (checked) {
      // Usar um valor especial 'all' para indicar que todos os tags foram selecionados
      setSelectedTags(['all']);
    } else {
      setSelectedTags([]);
    }
  };

  // Handler para seleção "Sem dono"
  const handleNoOwnerSelection = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(['none']);
    } else {
      setSelectedUsers([]);
    }
  };

  // Handler para seleção "Todos os donos"
  const handleAllOwnersSelection = (checked: boolean) => {
    console.log("Checkbox 'Todos os donos' alterado para:", checked);
    if (checked) {
      // Usar um valor especial 'all' para indicar que todos os donos foram selecionados
      setSelectedUsers(['all']);
    } else {
      setSelectedUsers([]);
    }
  };
  
  // Filtrar tags com base no termo de busca
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  // Filtrar usuários com base no termo de busca
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  console.log('PipelinePage inicializada com originId da URL:', originIdFromUrl);

  // Efeito para garantir que temos um originId e carregamos a origem correspondente
  useEffect(() => {
    const handleOriginChanges = async () => {
      // Pegar o parâmetro da origem da URL
      const originParam = searchParams?.get('origin');
      console.log('Parâmetro de origem na URL:', originParam);
      
      if (originParam) {
        // Se temos um parâmetro na URL, usamos ele
        setOriginId(originParam); // Atualizar o estado imediatamente
        await fetchOriginDetails(originParam);
      } else if (originId) {
        // Se já temos um originId no estado mas não na URL, atualizamos a URL
        updateUrlWithOrigin(originId);
      } else {
        // Se não temos originId nem na URL nem no estado, buscamos a primeira origem
        const firstOrigin = await fetchFirstActiveOrigin();
        if (firstOrigin && firstOrigin.id) {
          setOriginId(firstOrigin.id); // Atualizar o estado imediatamente
          updateUrlWithOrigin(firstOrigin.id);
        }
      }
    };
    
    handleOriginChanges();
  }, [searchParams]);

  // Efeito para limpar o globalNewLead após ele ser processado
  useEffect(() => {
    // Se um lead foi adicionado, reiniciamos o estado após um tempo para
    // evitar que o mesmo lead seja adicionado múltiplas vezes
    if (globalNewLead) {
      const timer = setTimeout(() => {
        setGlobalNewLead(null);
      }, 2000); // Limpar após 2 segundos
      
      return () => clearTimeout(timer);
    }
  }, [globalNewLead]);

  // Função para atualizar a URL com o originId
  const updateUrlWithOrigin = (originId: string) => {
    if (!originId) return;
    
    try {
      // Construir nova URL com o parâmetro de origem
      const url = new URL(window.location.href);
      url.searchParams.set('origin', originId);
      
      // Atualizar a URL sem recarregar a página
      router.replace(`${url.pathname}?origin=${originId}`, { scroll: false });
      
      console.log('URL atualizada com originId:', originId);
    } catch (error) {
      console.error('Erro ao atualizar URL:', error);
    }
  };

  // Função para buscar detalhes da origem
  const fetchOriginDetails = async (originId: string) => {
    try {
      setIsLoadingOrigin(true);
      console.log('Buscando detalhes da origem:', originId);
      
      // Usar a rota de listagem e filtrar pelo ID na aplicação
      const response = await fetch('/api/crm/origins');
      if (!response.ok) {
        throw new Error('Falha ao carregar origens');
      }
      
      const data = await response.json();
      console.log('Resposta da API de origens:', data);
      
      // Localizar a origem pelo ID na resposta
      const origin = data.data && data.data.find((origin: any) => origin.id === originId);
      
      if (!origin) {
        console.error('Origem não encontrada na lista retornada:', originId);
        // Redirecionar para a página principal do pipeline
        console.log('Redirecionando para a página principal do pipeline...');
        router.replace('/crm/pipeline');
        
        // Buscar a primeira origem disponível
        const firstOrigin = await fetchFirstActiveOrigin();
        if (firstOrigin) {
          toast({
            title: "Atenção",
            description: "A origem selecionada não foi encontrada. Redirecionando para a primeira origem disponível.",
          });
        } else {
          toast({
            title: "Atenção",
            description: "A origem selecionada não foi encontrada e não há outras origens disponíveis.",
            variant: "destructive",
          });
        }
        return; // Interromper a execução
      }
      
      console.log('Detalhes da origem encontrada:', origin);
      setSelectedOrigin(origin);
      
      // Atualizar também o nome da origem
      if (origin.name) {
        setOriginName(origin.name);
        document.title = `${origin.name} - Navibot CRM`;
      }
      
      // Forçar atualização dos negócios
      setGlobalNewLead({
        type: 'refresh-event-origin-change',
        originId: originId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes da origem:', error);
      
      // Verificar se o erro é de origem não encontrada
      if (error instanceof Error && error.message === 'Origem não encontrada') {
        // Redirecionar para a página principal do pipeline
        console.log('Erro de origem não encontrada, redirecionando...');
        router.replace('/crm/pipeline');
        toast({
          title: "Atenção",
          description: "A origem que você estava visualizando não existe mais ou foi excluída.",
        });
      } else {
        // Outros erros
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes da origem selecionada.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoadingOrigin(false);
    }
  };

  // Função para buscar a primeira origem ativa
  const fetchFirstActiveOrigin = async () => {
    try {
      setIsLoadingOrigin(true);
      const response = await fetch('/api/crm/origins?active=true&limit=1');
      if (!response.ok) {
        throw new Error('Falha ao carregar origens');
      }
      
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const firstOrigin = data.data[0];
        console.log('Primeira origem ativa encontrada:', firstOrigin);
        setSelectedOrigin(firstOrigin);
        return firstOrigin;
      } else {
        // Se não houver origens, deixar selectedOrigin como null
        setSelectedOrigin(null);
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar primeira origem ativa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as origens disponíveis.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoadingOrigin(false);
    }
  };

  const handleAddLead = (lead: any) => {
    // Verificar se temos dados válidos
    if (!lead || !lead.stageId) {
      toast({
        title: "Erro",
        description: "Dados incompletos do negócio. Verifique se uma etapa foi selecionada.",
        variant: "destructive",
      });
      return;
    }
    
    // Não substituir o originId que veio do formulário
    // Apenas fazer log para depuração
    console.log('Novo lead adicionado via GlobalModal:', lead);
    console.log('Origin ID do lead:', lead.originId);
    console.log('Origin ID atual da página:', selectedOrigin?.id);
    
    // Verificar se a origem do novo negócio corresponde à origem sendo visualizada
    if (lead.originId && originId && lead.originId !== originId) {
      console.log('O negócio foi adicionado a uma origem diferente da atual:', lead.originId);
      
      // Se o originId do lead for diferente do originId atual, mostrar um toast informando
      toast({
        title: "Atenção",
        description: `O negócio foi adicionado à origem "${lead.originName || lead.originId}". Você está visualizando "${originName}".`,
        variant: "default",
      });
    }
    
    // Salvar o novo lead para passar para o PipelineBoard
    setGlobalNewLead({
      ...lead,
      timestamp: new Date().getTime() // Adicionar timestamp para forçar a atualização
    });
    
    // Mostrar feedback ao usuário
    toast({
      title: "Sucesso",
      description: "Negócio adicionado com sucesso!",
    });
    
    // Fechar o menu dropdown após adicionar
    setShowAddMenu(false);
  };

  // Título a ser exibido baseado na origem selecionada
  const getDisplayTitle = () => {
    if (isLoadingOrigin) return "Carregando...";
    if (!selectedOrigin) return "Nenhuma origem selecionada";
    return selectedOrigin.name;
  };

  const handleGlobalAddLeadComplete = () => {
    setGlobalNewLead((prev: boolean) => !prev);
  };

  // Função para forçar o recarregamento do pipeline
  const handleRefresh = () => {
    console.log('Forçando recarregamento dos estágios...');
    setIsRefreshing(true);
    
    // Forçar atualização alterando globalNewLead temporariamente
    // Uso um objeto de evento com type: 'refresh' para não causar erros de validação UUID
    setGlobalNewLead({
      type: 'refresh-event',
      timestamp: Date.now()
    });
    
    // Mostrar toast para feedback ao usuário
    toast({
      title: "Atualizando pipeline",
      description: "Recarregando dados do pipeline.",
    });
    
    // Simular um pequeno atraso para dar feedback visual
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  // Adicionar um botão para limpar todos os filtros
  const clearAllFilters = () => {
    console.log("Limpando todos os filtros");
    setSelectedTags([]);
    setSelectedUsers([]);
    setDateFilter(null);
    setDateFilterLabel('Data');
    setStartDate(null);
    setEndDate(null);
    setSelectedDatePreset(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center mb-4">
          <Link href="/crm" className="flex items-center text-gray-400 hover:text-white mr-4">
            <span className="text-xs text-gray-400 uppercase">NEGÓCIOS DA ORIGEM</span>
          </Link>
        </div>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-white">
            {originName ? originName : 'Pipeline'}
          </h1>
          <div className="relative flex gap-2">
            <Button 
              variant="outline"
              className="space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>Importar</span>
            </Button>
            <Button 
              onClick={() => setShowGlobalAddModal(true)}
              className="space-x-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Briefcase className="h-4 w-4" />
              <span>Novo Negócio</span>
            </Button>
            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1A1D24] rounded-lg shadow-lg overflow-hidden z-10 border border-gray-800">
                <div className="py-2">
                  <button 
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-blue-600 flex items-center"
                    onClick={() => {
                      setShowGlobalAddModal(true);
                      setShowAddMenu(false);
                    }}
                  >
                    <span className="inline-block mr-2">
                      <Plus className="h-4 w-4" />
                    </span>
                    Novo negócio
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#0F1115] flex items-center">
                    <span className="inline-block mr-2">
                      <Download className="h-4 w-4" />
                    </span>
                    Importar negócios
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-6 py-4 border-b border-gray-800 bg-[#1A1D24]">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <input 
              type="text" 
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-700 bg-[#0F1115] text-white w-64 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              placeholder="Buscar..." 
            />
          </div>
          
          {/* Filtro por Data */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="px-3 py-2 border border-gray-700 rounded-lg flex items-center gap-2 text-sm bg-[#0F1115] text-gray-300 hover:border-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{dateFilterLabel}</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-gray-700 bg-[#1A1D24]">
              <div className="p-4">
                {/* Controles de navegação do calendário */}
                <div className="flex justify-between items-center mb-4">
                  <button 
                    className="p-1 text-gray-400 hover:text-white"
                    onClick={() => navigateMonth(-1)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <div className="flex gap-2">
                    <select 
                      className="bg-[#0F1115] border border-gray-700 text-white text-xs rounded py-1 px-2"
                      value={calendarDate.getFullYear()}
                      onChange={(e) => navigateToYear(parseInt(e.target.value))}
                    >
                      {Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - 5 + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    className="p-1 text-gray-400 hover:text-white"
                    onClick={() => navigateMonth(1)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {monthData.map((month, index) => {
                    const calendarDays = generateCalendarDays(month.month, month.year);
                    
                    return (
                      <div key={`${month.month}-${month.year}`}>
                        <h3 className="text-sm font-medium text-white mb-3">{month.label}</h3>
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {/* Dias da semana */}
                          <div className="text-xs text-gray-500 py-1">DOM</div>
                          <div className="text-xs text-gray-500 py-1">SEG</div>
                          <div className="text-xs text-gray-500 py-1">TER</div>
                          <div className="text-xs text-gray-500 py-1">QUA</div>
                          <div className="text-xs text-gray-500 py-1">QUI</div>
                          <div className="text-xs text-gray-500 py-1">SEX</div>
                          <div className="text-xs text-gray-500 py-1">SÁB</div>
                          
                          {/* Dias do calendário */}
                          {calendarDays.map((day, dayIndex) => (
                            <div 
                              key={`${day.month}-${day.day}-${dayIndex}`}
                              onClick={() => handleDaySelect(day.day, day.month, day.year)}
                              className={cn(
                                "text-xs rounded-full w-6 h-6 flex items-center justify-center mx-auto cursor-pointer",
                                day.isCurrentMonth 
                                  ? "text-white hover:bg-blue-700" 
                                  : "text-gray-500 hover:bg-gray-700",
                                day.isToday && "bg-blue-600",
                                // Verificar se o dia atual está no intervalo selecionado
                                startDate && endDate && (
                                  new Date(`${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`) >= new Date(startDate) &&
                                  new Date(`${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`) <= new Date(endDate)
                                ) && "bg-blue-700 font-bold",
                                // Verificar se é o dia inicial ou final
                                startDate && 
                                `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}` === startDate && 
                                "bg-blue-800 font-bold",
                                endDate && 
                                `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}` === endDate && 
                                "bg-blue-800 font-bold"
                              )}
                            >
                              {day.day}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      className={`text-xs text-white py-1 px-2 rounded ${selectedDatePreset === 'today' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                      onClick={() => handleDatePresetSelect('today')}
                    >
                      Hoje
                    </button>
                    <button 
                      className={`text-xs text-white py-1 px-2 rounded ${selectedDatePreset === 'yesterday' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                      onClick={() => handleDatePresetSelect('yesterday')}
                    >
                      Ontem
                    </button>
                    <button 
                      className={`text-xs text-white py-1 px-2 rounded ${selectedDatePreset === 'thisWeek' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                      onClick={() => handleDatePresetSelect('thisWeek')}
                    >
                      Esta semana
                    </button>
                    <button 
                      className={`text-xs text-white py-1 px-2 rounded ${selectedDatePreset === 'lastMonth' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                      onClick={() => handleDatePresetSelect('lastMonth')}
                    >
                      Mês passado
                    </button>
                    <button 
                      className={`text-xs text-white py-1 px-2 rounded ${selectedDatePreset === '12months' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                      onClick={() => handleDatePresetSelect('12months')}
                    >
                      12 meses
                    </button>
                    <button 
                      className={`text-xs text-white py-1 px-2 rounded ${selectedDatePreset === '24months' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                      onClick={() => handleDatePresetSelect('24months')}
                    >
                      24 meses
                    </button>
                  </div>
                  {dateFilter && (
                    <div className="pt-2 flex justify-end">
                      <button 
                        className="text-xs text-red-400 py-1 px-2 rounded hover:text-red-300 flex items-center"
                        onClick={() => {
                          setDateFilter(null);
                          setDateFilterLabel('Data');
                          setSelectedDatePreset(null);
                          setStartDate(null);
                          setEndDate(null);
                        }}
                      >
                        <X className="h-3 w-3 mr-1" /> Limpar filtro
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Filtro por Tags */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="px-3 py-2 border border-gray-700 rounded-lg flex items-center gap-2 text-sm bg-[#0F1115] text-gray-300 hover:border-gray-600">
                <Tag className="h-4 w-4" />
                <span>Tags</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-gray-700 bg-[#1A1D24]">
              <div className="p-3">
                <div className="relative mb-3">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Buscar por..."
                    className="pl-8 bg-[#0F1115] border-gray-700 text-white text-sm focus-visible:ring-blue-600 focus-visible:ring-offset-0"
                    value={tagSearchTerm}
                    onChange={(e) => setTagSearchTerm(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[220px] pr-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="sem-tag" 
                        checked={selectedTags.includes('none')}
                        onCheckedChange={(checked) => handleNoTagSelection(checked as boolean)}
                      />
                      <label htmlFor="sem-tag" className="text-sm text-white cursor-pointer">Sem tag</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="todos-tags"
                        checked={selectedTags.includes('all')}
                        onCheckedChange={(checked) => handleAllTagsSelection(!!checked)}
                      />
                      <label htmlFor="todos-tags" className="text-sm text-white cursor-pointer">Todos os tags</label>
                    </div>
                    
                    {loadingTags ? (
                      <div className="flex justify-center py-4">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : (
                      filteredTags.map(tag => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`tag-${tag.id}`}
                            checked={selectedTags.includes(tag.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleTagSelection(tag.id);
                              } else {
                                setSelectedTags(prev => prev.filter(id => id !== tag.id));
                              }
                            }}
                          />
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }}></div>
                          <label htmlFor={`tag-${tag.id}`} className="text-sm text-white cursor-pointer">{tag.name}</label>
                        </div>
                      ))
                    )}

                    {filteredTags.length === 0 && !loadingTags && (
                      <div className="text-center py-2 text-gray-400 text-sm">
                        {tagSearchTerm ? 'Nenhuma tag encontrada' : 'Nenhuma tag disponível'}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Filtro por Dono do negócio */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="px-3 py-2 border border-gray-700 rounded-lg flex items-center gap-2 text-sm bg-[#0F1115] text-gray-300 hover:border-gray-600">
                <User className="h-4 w-4" />
                <span>Dono do negócio</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-gray-700 bg-[#1A1D24]">
              <div className="p-3">
                <div className="relative mb-3">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Buscar por..."
                    className="pl-8 bg-[#0F1115] border-gray-700 text-white text-sm focus-visible:ring-blue-600 focus-visible:ring-offset-0"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[220px] pr-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="sem-dono"
                        checked={selectedUsers.includes('none')}
                        onCheckedChange={(checked) => handleNoOwnerSelection(checked as boolean)}
                      />
                      <label htmlFor="sem-dono" className="text-sm text-white cursor-pointer">Sem dono</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="todos-donos"
                        checked={selectedUsers.includes('all')}
                        onCheckedChange={(checked) => handleAllOwnersSelection(!!checked)}
                      />
                      <label htmlFor="todos-donos" className="text-sm text-white cursor-pointer">Todos os donos</label>
                    </div>
                    
                    {loadingUsers ? (
                      <div className="flex justify-center py-4">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : (
                      filteredUsers.map(user => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`user-${user.id}`}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleUserSelection(user.id);
                              } else {
                                setSelectedUsers(prev => prev.filter(id => id !== user.id));
                              }
                            }}
                          />
                          <label htmlFor={`user-${user.id}`} className="text-sm text-white cursor-pointer">
                            {user.name || user.email}
                          </label>
                        </div>
                      ))
                    )}

                    {filteredUsers.length === 0 && !loadingUsers && (
                      <div className="text-center py-2 text-gray-400 text-sm">
                        {userSearchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Botão para limpar filtros */}
          {((selectedTags.length > 0) || (selectedUsers.length > 0) || dateFilter) && (
            <button 
              className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm bg-blue-600 text-white hover:bg-blue-700"
              onClick={clearAllFilters}
            >
              <X className="h-4 w-4" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Informações */}
      <div className="px-6 py-3 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-300">{totalOpportunities} oportunidades de Negócio</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              className={`text-gray-400 hover:text-white transition-all duration-200 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button className="text-gray-400 hover:text-white">
              <Download className="h-5 w-5" />
            </button>
            <button className="text-gray-400 hover:text-white">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="flex-1 overflow-x-auto">
        <PipelineBoard 
          originId={originId}
          setGlobalNewLead={setGlobalNewLead}
          globalNewLead={globalNewLead}
          filters={{
            tags: selectedTags,
            owners: selectedUsers,
            date: dateFilter
          }}
          onTotalOpportunitiesChange={setTotalOpportunities}
        />
      </div>
      
      {/* Modal Global para adicionar negócio */}
      <GlobalAddBusinessModal 
        isOpen={showGlobalAddModal} 
        onClose={() => setShowGlobalAddModal(false)}
        onAddBusiness={(data: any) => {
          setGlobalNewLead(data);
          setShowGlobalAddModal(false);
          toast({
            title: "Sucesso!",
            description: "Negócio criado com sucesso",
          });
        }}
        originId={originId}
      />
    </div>
  );
} 
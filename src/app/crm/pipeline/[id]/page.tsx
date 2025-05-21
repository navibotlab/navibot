'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle, Mail, StickyNote, Calendar, ChevronRight, Tag, Plus, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AddLabelModal } from '@/app/admin/conteudos/configuracoes-contato/etiquetas/components/AddLabelModal';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Converter para Client Component para resolver problemas de autenticação
export default function BusinessDetailPage() {
  // Usando useParams para resolver o problema de acesso direto ao params.id
  const params = useParams();
  const businessId = params?.id as string;
  
  const router = useRouter();
  const { data: session, status } = useSession();
  const [business, setBusiness] = useState<any>(null);
  const [leadTags, setLeadTags] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('atividades');
  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
  
  // Adicionar estado para controlar a modal de funções em desenvolvimento
  const [isDevelopmentModalOpen, setIsDevelopmentModalOpen] = useState(false);
  const [developmentFeatureName, setDevelopmentFeatureName] = useState('');
  
  // Adicionar o hook useToast
  const { toast } = useToast();

  // Função para buscar os dados do negócio
  async function fetchBusinessData() {
    try {
      console.log(`Buscando dados do negócio: ${businessId}`);

      // Buscar dados do negócio usando a API
      const response = await fetch(`/api/crm/business/${businessId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        console.error(`Erro ao buscar dados do negócio: ${response.status} ${response.statusText}`);
        setError(`Erro ao buscar dados do negócio: ${response.status}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Dados do negócio obtidos com sucesso');
      setBusiness(data);
      
      // Se temos um lead, buscar as tags relacionadas
      if (data.lead?.id) {
        await fetchLeadTags(data.lead.id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados do negócio:', error);
      setError('Erro ao carregar dados do negócio');
      setLoading(false);
    }
  }
  
  // Função separada para buscar as tags do lead
  async function fetchLeadTags(leadId: string) {
    try {
      console.log(`Buscando tags específicas para o lead: ${leadId}`);
      
      // Primeiro, tente buscar diretamente do lead com suas tags incluídas
      const leadResponse = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (leadResponse.ok) {
        const leadData = await leadResponse.json();
        // Verificar se temos tags ou labels no resultado
        if (leadData.tags && Array.isArray(leadData.tags)) {
          setLeadTags(leadData.tags);
          console.log(`Tags do lead carregadas via API lead: ${leadData.tags?.length || 0}`);
          return;
        } else if (leadData.labels && Array.isArray(leadData.labels)) {
          setLeadTags(leadData.labels);
          console.log(`Labels do lead carregadas via API lead: ${leadData.labels?.length || 0}`);
          return;
        }
      }
      
      // Se a primeira abordagem falhar, tente a API específica de tags
      const tagsResponse = await fetch(`/api/contacts/tags?leadId=${leadId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        setLeadTags(tagsData || []);
        console.log(`Tags do lead carregadas via API tags: ${tagsData?.length || 0}`);
      } else {
        console.error(`Erro ao buscar tags do lead: ${tagsResponse.status}`);
        
        // Último recurso - tente a API alternativa
        const fallbackResponse = await fetch(`/api/contact-tags`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (fallbackResponse.ok) {
          const allTags = await fallbackResponse.json();
          setLeadTags(allTags || []);
          console.log(`Todas as tags carregadas como fallback: ${allTags?.length || 0}`);
        } else {
          throw new Error(`Todas as tentativas de buscar tags falharam`);
        }
      }
    } catch (tagError) {
      console.error('Erro ao buscar tags do lead:', tagError);
    }
  }

  // Função para adicionar uma etiqueta e vinculá-la ao contato
  const handleAddTag = async (tagData: { name: string; color: string }) => {
    try {
      if (!business?.lead?.id) {
        toast({
          title: "Erro",
          description: "Não foi possível identificar o contato para adicionar a etiqueta",
          variant: "destructive",
        });
        return;
      }

      const leadId = business.lead.id;
      
      // 0. Primeiro, buscar os dados atuais completos do lead para preservá-los
      const leadResponse = await fetch(`/api/crm/leads/${leadId}`);
      if (!leadResponse.ok) {
        throw new Error(`Erro ao recuperar dados atuais do contato: ${leadResponse.status}`);
      }
      
      const currentLead = await leadResponse.json();
      console.log('Dados atuais do contato recuperados:', currentLead);
      
      // 1. Criar a etiqueta (ou buscar se já existir)
      const createTagResponse = await fetch('/api/contact-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tagData)
      });

      if (!createTagResponse.ok) {
        throw new Error(`Erro ao criar etiqueta: ${createTagResponse.status}`);
      }

      const newTag = await createTagResponse.json();
      console.log('Etiqueta criada com sucesso:', newTag);

      // 2. Associar a etiqueta ao contato/lead usando o método correto (PUT)
      // Obter as etiquetas atuais do lead obtido na requisição anterior
      const currentLabels = currentLead.labels || [];
      console.log('Etiquetas atuais do contato:', currentLabels);
      
      // Combinar as etiquetas existentes com a nova
      const updatedLabels = [...currentLabels, newTag];
      
      // Criar um objeto de atualização mantendo todos os dados originais
      const updateData = {
        ...currentLead,
        // Sobrescrever apenas o campo de etiquetas
        labels: updatedLabels.map(tag => ({ id: tag.id }))
      };
      
      // Garantir explicitamente que o nome seja preservado
      if (currentLead.name) {
        updateData.name = currentLead.name;
      }
      
      console.log('Dados que serão enviados para atualização:', updateData);
      
      const associateResponse = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!associateResponse.ok) {
        throw new Error(`Erro ao vincular etiqueta ao contato: ${associateResponse.status}`);
      }

      console.log('Etiqueta vinculada ao contato com sucesso');
      
      // 3. Atualizar a lista de tags na interface
      setLeadTags(updatedLabels);
      
      // 4. Atualizar os dados do negócio na interface também
      // Isso garante que qualquer exibição do lead na interface será atualizada
      const updatedBusiness = {
        ...business,
        lead: {
          ...business.lead,
          tags: updatedLabels
        }
      };
      setBusiness(updatedBusiness);
      
      toast({
        title: "Sucesso",
        description: "Etiqueta adicionada com sucesso",
      });

    } catch (error) {
      console.error('Erro ao adicionar etiqueta:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar etiqueta",
        variant: "destructive",
      });
    }
  };

  // Função para abrir a modal de funcionalidade em desenvolvimento
  const handleToolClick = (featureName: string) => {
    setDevelopmentFeatureName(featureName);
    setIsDevelopmentModalOpen(true);
  };

  // Efeito para buscar os dados quando a sessão estiver pronta
  useEffect(() => {
    // Verificar se temos um businessId
    if (!businessId) {
      setError('ID do negócio não fornecido');
      setLoading(false);
      return;
    }
    
    // Aguardar a inicialização da sessão
    if (status === 'loading') {
      return;
    }

    // Redirecionar se não estiver autenticado
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Buscar dados do negócio quando tiver a sessão
    fetchBusinessData();
  }, [status, businessId]);

  // Renderizar tela de carregamento
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin"></div>
          <p className="mt-4 text-gray-500">Carregando detalhes do negócio...</p>
        </div>
      </div>
    );
  }

  // Renderizar mensagem de erro
  if (error || !business) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <span className="text-red-500 text-xl">!</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Não foi possível carregar os dados</h2>
          <p className="text-gray-500 mb-4">{error || 'Negócio não encontrado ou você não tem permissão para visualizá-lo.'}</p>
          <button 
            onClick={() => router.back()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Extrair dados do lead, origem e grupo
  const lead = business.lead || {};
  const origin = business.origin || {};
  
  // Log para depuração da estrutura completa
  console.log('Dados completos do business:', business);
  console.log('Dados da origem:', origin);
  
  // Extrair informações do grupo de origem de forma mais robusta
  let group = null;
  let groupName = '';
  
  // Registrar todas as possíveis localizações do grupo para depuração
  console.log('Depuração de possíveis localizações do grupo:', {
    'origin.origin_group': origin.origin_group,
    'origin.group': origin.group,
    'business.origin_group': business.origin_group,
    'origin.origin_group_id': origin.origin_group_id,
    'origin.group_id': origin.group_id
  });
  
  // Estratégia 1: Obter o grupo diretamente
  if (origin.origin_group && typeof origin.origin_group === 'object') {
    group = origin.origin_group;
    console.log('Usando grupo de origin.origin_group:', group);
  } 
  else if (origin.group && typeof origin.group === 'object') {
    group = origin.group;
    console.log('Usando grupo de origin.group:', group);
  }
  else if (business.origin_group && typeof business.origin_group === 'object') {
    group = business.origin_group;
    console.log('Usando grupo de business.origin_group:', group);
  }
  // Estratégia 2: Buscar pelo ID em business.origin_groups
  else {
    // Obter o ID do grupo de todas as possíveis fontes
    const groupId = origin.origin_group_id || origin.group_id || 
                    (origin.origin_group && origin.origin_group.id) || 
                    (origin.group && origin.group.id);
    
    console.log('ID do grupo identificado:', groupId);
    
    // Se temos origin_groups no business, buscar nela
    if (groupId && business.origin_groups && Array.isArray(business.origin_groups)) {
      const foundGroup = business.origin_groups.find((g: any) => g.id === groupId);
      if (foundGroup) {
        group = foundGroup;
        console.log('Grupo encontrado em business.origin_groups:', foundGroup);
      }
    }
    
    // Se temos o origin_groups diretamente na origem, buscar nela também
    if (!group && groupId && origin.origin_groups && Array.isArray(origin.origin_groups)) {
      const foundGroup = origin.origin_groups.find((g: any) => g.id === groupId);
      if (foundGroup) {
        group = foundGroup;
        console.log('Grupo encontrado em origin.origin_groups:', foundGroup);
      }
    }
  }
  
  // Se ainda não temos um grupo, verificar outras propriedades que podem ter o nome
  if (!group) {
    // Verificar se há um nome de grupo disponível em alguma propriedade
    if (origin.group_name) {
      group = { name: origin.group_name };
      console.log('Usando nome do grupo da propriedade origin.group_name:', origin.group_name);
    } else if (origin.origin_group_name) {
      group = { name: origin.origin_group_name };
      console.log('Usando nome do grupo da propriedade origin.origin_group_name:', origin.origin_group_name);
    } else {
      // Se nada mais funcionar, usar a propriedade de nome se existir diretamente
      const possibleGroup = origin.origin_group || origin.group || business.origin_group;
      if (possibleGroup && possibleGroup.name) {
        group = { name: possibleGroup.name };
        console.log('Usando nome diretamente da propriedade grupo:', possibleGroup.name);
      } else {
        // Último caso: usar nome padrão
        group = { name: "Grupo de Origem" };
        console.log('Nenhum grupo encontrado, usando nome padrão "Grupo de Origem"');
      }
    }
  }
  
  // Extrair o nome do grupo do objeto encontrado
  if (group && typeof group === 'object') {
    groupName = group.name || 'Grupo de Origem';
  } else if (typeof group === 'string') {
    groupName = group;
  } else {
    groupName = 'Grupo de Origem';
  }
  
  console.log('Nome final do grupo após processamento:', groupName);
  
  // Não remover o prefixo "Grupo" para manter o contexto completo
  
  const originName = origin.name || 'Origem';
  const leadName = lead.name || business.title || 'Negócio';
  
  // Construir URLs para navegação no breadcrumb
  const originGroupsUrl = '/crm/pipeline';
  const originsUrl = group.id ? `/crm/origins/${group.id}` : '/crm/pipeline';
  const leadUrl = origin.id ? `/crm/pipeline/${business.id}` : '#';

  return (
    <div className="p-6">
      {/* Breadcrumb melhorado */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link 
              href={originGroupsUrl}
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-600"
            >
              {groupName}
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <Link
                href={originsUrl}
                className="ml-1 text-sm font-medium text-gray-600 hover:text-blue-600 md:ml-2"
              >
                {originName}
              </Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                {leadName}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Modal de Adicionar Etiqueta */}
      <AddLabelModal
        open={isAddTagModalOpen}
        onOpenChange={setIsAddTagModalOpen}
        onSave={handleAddTag}
      />

      {/* Modal de Funcionalidade em Desenvolvimento */}
      <Dialog open={isDevelopmentModalOpen} onOpenChange={setIsDevelopmentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Funcionalidade em desenvolvimento</DialogTitle>
            <DialogDescription>
              A funcionalidade de <strong>{developmentFeatureName}</strong> está em desenvolvimento 
              e estará disponível em breve. Agradecemos a sua compreensão.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Cabeçalho do lead com layout ajustado */}
      <div className="flex justify-between items-start mb-4">
        {/* Informações do contato e tags */}
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarImage src={lead.photo} alt={lead.name} />
              <AvatarFallback>{(lead.name || business.title || 'N')[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl font-semibold">{lead.name || business.title || 'Negócio'}</div>
              <div className="text-gray-400 text-sm">{lead.phone || lead.contact || ''}</div>
            </div>
          </div>
          
          {/* Tags do lead com botão de adicionar */}
          <div className="flex flex-wrap gap-2 mt-2 items-center">
            {leadTags.length > 0 ? (
              <>
                {leadTags.map((tag: any) => (
                  <Badge 
                    key={`tag-${tag.id}`} 
                    className="text-xs font-medium" 
                    style={{ backgroundColor: tag.color || '#6B7280', color: '#fff' }}
                  >
                    {tag.name}
                  </Badge>
                ))}
                <div className="relative">
                  <button 
                    className="group inline-flex items-center px-1.5 py-1 rounded-full bg-blue-600 text-white hover:px-4 transition-all duration-200 text-xs"
                    onClick={() => setIsAddTagModalOpen(true)}
                  >
                    <Plus className="w-3 h-3" />
                    <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-200">
                      Adicionar etiqueta
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-gray-400 text-xs flex items-center">
                  <Tag className="w-3 h-3 mr-1" />
                  Sem etiquetas
                </div>
                <div className="relative">
                  <button 
                    className="group inline-flex items-center px-1.5 py-1 rounded-full bg-blue-600 text-white hover:px-4 transition-all duration-200 text-xs"
                    onClick={() => setIsAddTagModalOpen(true)}
                  >
                    <Plus className="w-3 h-3" />
                    <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-200">
                      Adicionar etiqueta
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Ferramentas movidas para a direita */}
        <div className="flex gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="p-2 rounded hover:bg-gray-100" 
                  aria-label="Chat"
                  onClick={() => handleToolClick('Chat')}
                >
                  <MessageCircle className="w-5 h-5 text-blue-500 hover:text-blue-950" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Chat</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="p-2 rounded hover:bg-gray-100" 
                  aria-label="E-mail"
                  onClick={() => handleToolClick('E-mail')}
                >
                  <Mail className="w-5 h-5 text-blue-500 hover:text-blue-950" />
                </button>
              </TooltipTrigger>
              <TooltipContent>E-mail</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="p-2 rounded hover:bg-gray-100" 
                  aria-label="Nota"
                  onClick={() => handleToolClick('Nota')}
                >
                  <StickyNote className="w-5 h-5 text-blue-500 hover:text-blue-950" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Nota</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="p-2 rounded hover:bg-gray-100" 
                  aria-label="Agendamento"
                  onClick={() => handleToolClick('Agendamento')}
                >
                  <Calendar className="w-5 h-5 text-blue-500 hover:text-blue-950" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Agendamento</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Divisor */}
      <hr className="my-6 border-gray-300" />

      {/* Menu de navegação (como visto na imagem) */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('atividades')}
            className={`py-3 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'atividades' 
                ? 'border-indigo-500 text-blue-600' 
                : 'border-transparent text-gray-200 hover:text-blue-700 hover:border-gray-300'
            }`}
          >
            Atividades
          </button>
          <button
            onClick={() => setActiveTab('contato')}
            className={`py-3 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'contato' 
                ? 'border-indigo-500 text-blue-600' 
                : 'border-transparent text-gray-200 hover:text-blue-700 hover:border-gray-300'
            }`}
          >
            Contato
          </button>
          <button
            onClick={() => setActiveTab('empresa')}
            className={`py-3 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'empresa' 
                ? 'border-indigo-500 text-blue-600' 
                : 'border-transparent text-gray-200 hover:text-blue-700 hover:border-gray-300'
            }`}
          >
            Empresa
          </button>
          <button
            onClick={() => setActiveTab('negocio')}
            className={`py-3 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'negocio' 
                ? 'border-indigo-500 text-blue-600' 
                : 'border-transparent text-gray-200 hover:text-blue-700 hover:border-gray-300'
            }`}
          >
            Negócio
          </button>
          <button
            onClick={() => setActiveTab('conversas')}
            className={`py-3 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'conversas' 
                ? 'border-indigo-500 text-blue-600' 
                : 'border-transparent text-gray-200 hover:text-blue-700 hover:border-gray-300'
            }`}
          >
            Conversas
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`py-3 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'historico' 
                ? 'border-indigo-500 text-blue-600' 
                : 'border-transparent text-gray-200 hover:text-blue-700 hover:border-gray-300'
            }`}
          >
            Histórico
          </button>
        </nav>
      </div>

      {/* Conteúdo conforme a aba selecionada (vazio por enquanto) */}
      <div className="min-h-[200px]">
        {activeTab === 'atividades' && (
          <div className="text-white-500 text-center py-10">Conteúdo de Atividades está em desenvolvimento e estará disponível em breve.</div>
        )}
        {activeTab === 'contato' && (
          <div className="text-white-500 text-center py-10">Conteúdo de Contato está em desenvolvimento e estará disponível em breve.</div>
        )}
        {activeTab === 'empresa' && (
          <div className="text-white-500 text-center py-10">Conteúdo de Empresa está em desenvolvimento e estará disponível em breve.</div>
        )}
        {activeTab === 'negocio' && (
          <div className="text-white-500 text-center py-10">Conteúdo de Negócio está em desenvolvimento e estará disponível em breve.</div>
        )}
        {activeTab === 'conversas' && (
          <div className="text-white-500 text-center py-10">Conteúdo de Conversas está em desenvolvimento e estará disponível em breve.</div>
        )}
        {activeTab === 'historico' && (
          <div className="text-white-500 text-center py-10">Conteúdo de Histórico está em desenvolvimento e estará disponível em breve.</div>
        )}
      </div>
    </div>
  );
} 
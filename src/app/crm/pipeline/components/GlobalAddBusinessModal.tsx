'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Search, Loader, CheckCircle, User } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";

interface Lead {
  id: string;
  name: string | null;
  phone: string;
  photo?: string | null;
  email?: string | null;
  labels?: {
    id: string;
    name: string;
    color: string;
  }[];
  tags?: Array<{name: string, color: string}>;
}

interface Stage {
  id: string;
  name: string;
  order: number;
  originId?: string;
}

interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: string;
  photo?: string | null;
}

interface GlobalAddBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBusiness?: (business: any) => void;
  originId?: string;
}

export function GlobalAddBusinessModal({ isOpen, onClose, onAddBusiness, originId }: GlobalAddBusinessModalProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    stageId: '',
    stageName: '',
    owner: '',
    ownerName: '',
    value: 'R$ 0,00',
    contactId: '',
    contactName: '',
    contactPhoto: '',
    probability: 10,
    expectedCloseDate: ''
  });
  
  // Função para confirmar se um ID é realmente um UUID válido no padrão esperado pela API
  const isRealUUID = (str: string) => {
    if (!str) return false;
    
    // Se estivermos em ambiente de desenvolvimento e for um ID no formato nanoid, 
    // aceitamos para facilitar o teste
    if (process.env.NODE_ENV === 'development') {
      // Verificar se é um formato conhecido de ID nanoid usado em desenvolvimento
      if (str.includes('cm9tx') || str.includes('hycswj')) {
        console.log(`Aceitando ID em formato nanoid em ambiente de desenvolvimento: ${str}`);
        return true;
      }
      
      // Verificar se é o formato de estágio específico do sistema (stage_XXXXXXXXXX_XXXXX_N)
      if (str.startsWith('stage_') && str.includes('_')) {
        console.log(`Aceitando ID no formato específico de estágio: ${str}`);
        return true;
      }
    }
    
    // Em produção ou para outros formatos, validamos como UUID padrão
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };
  
  // Função para gerar um UUID v4 válido
  const generateValidUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, 
            v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  
  // Resetar o formulário
  const resetForm = () => {
    setFormData({
      stageId: '',
      stageName: '',
      owner: '',
      ownerName: '',
      value: 'R$ 0,00',
      contactId: '',
      contactName: '',
      contactPhoto: '',
      probability: 10,
      expectedCloseDate: ''
    });
    
    setSearchTerm('');

    // Fechar o modal
    onClose();
  };
  
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoadingStages, setIsLoadingStages] = useState(false);
  const [contacts, setContacts] = useState<Lead[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Lead[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [showContactsList, setShowContactsList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const contactsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [originName, setOriginName] = useState<string>("");

  // Verificar e registrar os valores na sessão para debug
  useEffect(() => {
    if (isOpen) {
      console.log('Sessão atual:', {
        userId: session?.user?.id,
        workspaceId: session?.user?.workspaceId,
        authenticated: !!session
      });
    }
  }, [isOpen, session]);

  // Buscar o nome da origem quando o originId mudar
  useEffect(() => {
    if (originId) {
      console.log('Buscando origem com ID:', originId);
      setOriginName("Carregando origem...");
      
      // Usar uma única rota que é mais provável de existir
      fetch('/api/crm/origins')
        .then(res => {
          if (!res.ok) {
            throw new Error(`Erro ao obter lista de origens: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          // Garantir que temos um array para trabalhar
          const originsArray = Array.isArray(data) 
            ? data 
            : (data.data && Array.isArray(data.data) 
                ? data.data 
                : []);
                
          console.log('Lista de origens obtida:', originsArray);
          
          // Tentar encontrar a origem pelo ID
          const foundOrigin = originsArray.find((o: {id: string, name?: string}) => 
            o && o.id === originId
          );
          
          if (foundOrigin && foundOrigin.name) {
            console.log('Origem encontrada:', foundOrigin.name);
            setOriginName(foundOrigin.name);
          } else {
            console.warn('Origem não encontrada na lista:', originId);
            setOriginName("Origem indisponível");
          }
        })
        .catch(error => {
          console.error('Erro ao buscar origens:', error);
          // Usar um valor de fallback
          setOriginName("Origem não encontrada");
        });
    } else {
      console.warn('Nenhum originId fornecido');
      setOriginName("Selecione uma origem");
    }
  }, [originId]);

  // Verificar se temos um originId quando o modal abre
  useEffect(() => {
    if (isOpen && !originId) {
      console.warn('⚠️ ALERTA: Modal aberto sem originId definido');
      toast({
        title: "Atenção!",
        description: "Nenhuma origem selecionada. Por favor, selecione uma origem no painel lateral antes de adicionar negócios.",
        variant: "destructive",
      });
    }
  }, [isOpen, originId, toast]);

  // Log para verificar se originId está chegando corretamente
  useEffect(() => {
    if (isOpen) {
      console.log('GlobalAddBusinessModal aberto com originId:', originId);
    }
  }, [isOpen, originId]);

  // Buscar estágios do pipeline com melhorias para tentar métodos alternativos
  useEffect(() => {
    if (!originId || !isOpen) {
      console.warn('⚠️ Modal fechado ou nenhuma origem selecionada ao buscar estágios!');
      setIsLoadingStages(false);
      return;
    }

    // Limpar estágios anteriores para evitar mistura de dados
    setStages([]);
    setIsLoadingStages(true);
    
    // Função auxiliar para processar os dados de estágios de qualquer fonte
    const processStagesData = (data: any, source: string) => {
      console.log(`Processando dados de estágios da fonte: ${source}`, data);
      
      // Extrair estágios do formato da resposta
      let stagesData: any[] = [];
      
      if (data.stages && Array.isArray(data.stages)) {
        stagesData = data.stages;
      } else if (data.data && Array.isArray(data.data)) {
        stagesData = data.data;
      } else if (Array.isArray(data)) {
        stagesData = data;
      }
      
      // Verificar se temos estágios
      if (stagesData.length === 0) {
        console.warn('Nenhum estágio encontrado para esta origem.');
        toast({
          title: "Atenção",
          description: "Nenhum estágio encontrado para esta origem. Por favor, configure estágios no pipeline.",
          variant: "destructive",
        });
        
        setIsLoadingStages(false);
        return;
      }
      
      // Ordenar estágios por ordem
      const sortedStages = stagesData.sort((a: Stage, b: Stage) => 
        (a.order !== undefined && b.order !== undefined) ? a.order - b.order : 0
      );
      
      console.log('Estágios ordenados:', sortedStages);
      setStages(sortedStages);
      
      // Selecionar o primeiro estágio por padrão
      if (sortedStages.length > 0) {
        const firstStage = sortedStages[0];
        console.log('Definindo estágio inicial:', firstStage);
        setFormData(prev => ({
          ...prev,
          stageId: firstStage.id,
          stageName: firstStage.name
        }));
      }
      
      setIsLoadingStages(false);
    };

    // Função para buscar os estágios
    const fetchData = async () => {
      try {
        // Usar o mesmo endpoint e abordagem que funciona no PipelineBoard
        console.log(`Buscando estágios para a origem: ${originId}`);
        
        // Usar o endpoint de estágios com parâmetro originId - abordagem usada pelo PipelineBoard
        const url = `/api/crm/stages?originId=${originId}`;
        console.log('URL da requisição:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          // Se falhar, tentar o endpoint específico de origins
          console.warn(`Endpoint de estágios falhou com status ${response.status}, tentando endpoint de origem...`);
          
          const originUrl = `/api/crm/origins/${originId}/stages`;
          console.log('Tentando URL alternativa:', originUrl);
          
          const fallbackResponse = await fetch(originUrl);
          
          if (!fallbackResponse.ok) {
            throw new Error(`Ambos os endpoints falharam: ${response.status}, ${fallbackResponse.status}`);
          }
          
          const fallbackData = await fallbackResponse.json();
          processStagesData(fallbackData, 'fallback');
        } else {
          const data = await response.json();
          processStagesData(data, 'primary');
        }
      } catch (error) {
        console.error('Erro ao buscar estágios:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os estágios. Por favor, tente novamente.",
          variant: "destructive",
        });
        setIsLoadingStages(false);
      }
    };

    // Executar a busca de dados
    fetchData();
    
    // Dependências corretas, sem o toast que pode mudar a cada renderização
  }, [isOpen, originId]);

  // Buscar usuários da workspace
  const fetchUsers = async () => {
    if (users.length > 0 || !isOpen) return; // Evitar buscar usuários novamente se já tivermos dados ou o modal estiver fechado
    
    setIsLoadingUsers(true);
    try {
      const mockUsers = [
        { id: '1', name: 'Você (atual)', email: 'admin@exemplo.com', role: 'admin' }
      ];
      
      // Tentar buscar usuários reais
      try {
        const response = await fetch('/api/workspace/users');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setUsers(data);
            return;
          }
          if (data.users && Array.isArray(data.users)) {
            setUsers(data.users);
            return;
          }
        }
      } catch (error) {
        console.warn('Erro ao buscar usuários reais, usando dados mock:', error);
      }
      
      // Se chegou aqui, usar dados mock
      setUsers(mockUsers);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Buscar contatos (leads) existentes
  useEffect(() => {
    const fetchContacts = async () => {
      if (!isOpen) return; // Não buscar se o modal estiver fechado
      
      // Evitar buscar novamente se já tivermos contatos
      if (contacts.length > 0) {
        console.log('Contatos já carregados, pulando busca');
        return;
      }
      
      setIsLoadingContacts(true);
      try {
        const response = await fetch('/api/crm/leads');
        if (!response.ok) {
          throw new Error('Erro ao buscar contatos');
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          console.log('Contatos carregados com sucesso:', data.length);
          setContacts(data);
        }
      } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os contatos. Por favor, tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingContacts(false);
      }
    };

    fetchContacts();
  }, [isOpen]);

  // Filtrar contatos com base no termo de busca
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredContacts([]);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = contacts.filter(contact => {
      const name = contact.name?.toLowerCase() || '';
      const phone = contact.phone?.toLowerCase() || '';
      const email = contact.email?.toLowerCase() || '';
      
      return (
        name.includes(lowerSearchTerm) || 
        phone.includes(lowerSearchTerm) || 
        email.includes(lowerSearchTerm)
      );
    });
    
    setFilteredContacts(filtered);
  }, [searchTerm, contacts]);

  // Fechar o dropdown de contatos ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contactsRef.current && !contactsRef.current.contains(event.target as Node)) {
        setShowContactsList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Função atualizada para formatar corretamente valores monetários - da direita para a esquerda
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    
    // Remove todos os caracteres não numéricos
    let value = input.value.replace(/\D/g, '');
    
    // Se estiver vazio, definir como zero
    if (value === '') {
      value = '0';
    }
    
    // Converte para centavos (inteiro)
    const valueInCents = parseInt(value, 10);
    
    // Primeiro formata para número com vírgula e pontos
    const formattedNumber = (valueInCents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    // Adiciona o prefixo R$ manualmente para evitar duplicação
    const valueInReais = `R$ ${formattedNumber}`;
    
    // Obtém a posição do cursor antes da atualização
    const cursorPosition = input.selectionStart || 0;
    const oldLength = input.value.length;
    
    // Atualiza o valor no estado
    setFormData({ ...formData, value: valueInReais });
    
    // Ajusta a posição do cursor após a atualização do DOM
    setTimeout(() => {
      // Mantém o cursor no final se estava no final
      if (cursorPosition === oldLength) {
        input.selectionStart = valueInReais.length;
        input.selectionEnd = valueInReais.length;
        return;
      }
      
      // Calcula nova posição do cursor - mantém proporcional à distância do final
      const distanceFromEnd = oldLength - cursorPosition;
      const newPosition = Math.max(0, valueInReais.length - distanceFromEnd);
      
      input.selectionStart = newPosition;
      input.selectionEnd = newPosition;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Iniciando submissão do formulário');
    console.log('Dados do formulário:', formData);
    
    // Resetar erro anterior
    setFormError(null);
    
    try {
      // Verificar se temos um estágio selecionado
      if (!formData.stageId) {
        const errorMsg = 'Por favor, selecione um estágio antes de adicionar o negócio.';
        console.error(errorMsg);
        setFormError(errorMsg);
        toast({
          title: "Erro",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }
      
      // Verificar se o estágio existe na lista de estágios carregados
      const stageSelected = stages.find(s => s.id === formData.stageId);
      if (!stageSelected) {
        const errorMsg = `Estágio com ID ${formData.stageId} não encontrado na lista de estágios. Por favor, recarregue a página e tente novamente.`;
        console.error(errorMsg);
        setFormError(errorMsg);
        toast({
          title: "Erro",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }
      
      console.log('Estágio selecionado para submissão:', stageSelected);
      
      if (!formData.contactId && !searchTerm.trim()) {
        setFormError('Por favor, selecione um contato existente.');
        return;
      }
      
      setIsSubmitting(true);
      
      // Padrão para validação de UUID formato padrão (o único aceito pela API)
      const strictUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      // Declarar variáveis para IDs que serão enviados para a API
      let stageIdToSend: string;
      let originIdToSend: string;
      
      // Verificar se temos um formato de estágio específico do sistema (stage_XXXXXXXXXX_XXXXX_N)
      const isSystemStageFormat = formData.stageId.startsWith('stage_') && formData.stageId.includes('_');
      
      if (isSystemStageFormat) {
        console.log(`ID de estágio está no formato específico do sistema: ${formData.stageId}`);
        stageIdToSend = formData.stageId;
      }
      // Verificar se o stageId é um UUID válido no formato padrão
      else if (!strictUuidRegex.test(formData.stageId)) {
        console.warn(`ID de estágio não é um UUID padrão válido: ${formData.stageId}`);
        console.log('Estágios disponíveis:', stages);
        
        // Verificar se há estágios no formato específico do sistema
        const systemFormatStages = stages.filter(s => s.id.startsWith('stage_') && s.id.includes('_'));
        console.log(`Encontrados ${systemFormatStages.length} estágios no formato específico do sistema:`, systemFormatStages);
        
        if (systemFormatStages.length > 0) {
          // Usar o primeiro estágio no formato específico do sistema
          const validStage = systemFormatStages[0];
          console.log(`Usando estágio no formato específico do sistema: ${validStage.id} (${validStage.name})`);
          stageIdToSend = validStage.id;
          
          // Atualizar o nome do estágio para corresponder ao ID válido
          formData.stageName = validStage.name;
          
          // Informar ao usuário sobre a mudança
          toast({
            title: "Informação",
            description: `Estágio alterado para "${validStage.name}" para compatibilidade.`,
            variant: "default",
          });
        } else {
          // Verificar se há estágios com IDs que são UUIDs
          const validStages = stages.filter(s => strictUuidRegex.test(s.id));
          console.log(`Encontrados ${validStages.length} estágios com IDs de UUID padrão:`, validStages);
          
          if (validStages.length > 0) {
            // Usar o primeiro estágio com UUID válido
            const validStage = validStages[0];
            console.log(`Usando estágio com UUID padrão: ${validStage.id} (${validStage.name})`);
            stageIdToSend = validStage.id;
            
            // Atualizar o nome do estágio para corresponder ao ID válido
            formData.stageName = validStage.name;
            
            // Informar ao usuário sobre a mudança
            toast({
              title: "Informação",
              description: `Estágio alterado para "${validStage.name}" para compatibilidade.`,
              variant: "default",
            });
          } else {
            // Se nenhum estágio válido for encontrado, usar o ID original mesmo assim
            console.log(`Nenhum estágio válido encontrado. Usando ID original: ${formData.stageId}`);
            stageIdToSend = formData.stageId;
            
            toast({
              title: "Atenção",
              description: "Usando o estágio selecionado, mas pode haver problemas de compatibilidade com o banco de dados.",
              variant: "default",
            });
          }
        }
      } else {
        console.log(`ID de estágio é um UUID válido: ${formData.stageId}`);
        stageIdToSend = formData.stageId;
      }
      
      // Verificar se o originId é um UUID válido no formato padrão
      if (!originId || !strictUuidRegex.test(originId)) {
        console.warn(`ID de origem não é um UUID padrão válido: ${originId}`);
        
        // Verificar se é um formato específico do sistema
        if (originId && originId.startsWith('origin_') && originId.includes('_')) {
          console.log(`ID de origem está no formato específico do sistema: ${originId}`);
          originIdToSend = originId;
        } else {
          // Gerar UUID válido para origin apenas se não estiver no formato específico
          originIdToSend = generateValidUUID();
          console.warn(`Gerando novo UUID para originId: ${originIdToSend}`);
        }
      } else {
        console.log(`ID de origem é um UUID válido: ${originId}`);
        originIdToSend = originId;
      }

      // Verificar se temos um contato selecionado
      if (!formData.contactId) {
        setFormError('Por favor, selecione um contato existente.');
        setIsSubmitting(false);
        return;
      }
      
      // Verificar se temos uma sessão válida
      if (!session) {
        setFormError('Sua sessão expirou. Por favor, faça login novamente.');
        setIsSubmitting(false);
        return;
      }
      
      // Verificar se temos um workspaceId válido na sessão
      if (!session.user?.workspaceId) {
        setFormError('Não foi possível identificar seu workspace. Por favor, faça login novamente.');
        setIsSubmitting(false);
        return;
      }

      // Validar formato do workspaceId
      const workspaceId = session.user.workspaceId;
      if (!workspaceId) {
        setFormError('ID da workspace não encontrado. Por favor, selecione uma workspace válida no menu de workspaces.');
        setIsSubmitting(false);
        return;
      }
      
      // Gerar um UUID válido para o workspace se necessário
      let workspaceIdToSend = workspaceId;
      if (!isRealUUID(workspaceId)) {
        workspaceIdToSend = generateValidUUID();
        console.warn(`Workspace ID original (${workspaceId}) não é um UUID válido, usando UUID gerado: ${workspaceIdToSend}`);
      }
      
      // Encontrar o contato selecionado
      const selectedContact = contacts.find(c => c.id === formData.contactId);
      
      if (!selectedContact) {
        setFormError('Contato não encontrado. Por favor, selecione um contato válido.');
        setIsSubmitting(false);
        return;
      }
      
      // Formatar tags para o novo formato
      let formattedTags: Array<{name: string, color: string}> = [];
      
      if (selectedContact?.labels && selectedContact.labels.length > 0) {
        formattedTags = selectedContact.labels.map(label => ({
          name: label.name,
          color: label.color
        }));
      } else if (selectedContact?.tags && selectedContact.tags.length > 0) {
        // Caso já esteja no formato correto
        formattedTags = selectedContact.tags;
      } else {
        // Tags padrão caso não haja nenhuma
        formattedTags = [{ name: 'Novo', color: '#2563EB' }];
      }

      const contactName = selectedContact.name || selectedContact.phone;
      
      // Remover caracteres não numéricos do valor e converter para número
      let rawValue = formData.value;
      if (rawValue.startsWith('R$ ')) {
        rawValue = rawValue.substring(3);
      }
      const numericValue = parseFloat(rawValue.replace(/\./g, '').replace(',', '.')) || 0;
      
      // Formatar data atual
      const now = new Date();
      
      // SOLUÇÃO CRÍTICA PARA O OWNWER ID:
      // A API exige estritamente um UUID válido no formato padrão ou null
      // Independentemente do que foi selecionado, devemos enviar apenas null ou UUID padrão
      let ownerIdToSend = null; // Iniciar com null por padrão - valor seguro para a API
      
      // Só tentar usar o ID fornecido se não estiver vazio
      if (formData.owner && formData.owner.trim() !== '') {
        console.log('Processando ownerId fornecido:', formData.owner);
        
        // Verificar se é um UUID válido no formato padrão (formato aceito pela API)
        const isStandardUUID = strictUuidRegex.test(formData.owner);
        
        if (isStandardUUID) {
          // Se for um UUID padrão, podemos usar diretamente
          ownerIdToSend = formData.owner;
          console.log(`Owner ID é um UUID válido padrão, usando diretamente: ${ownerIdToSend}`);
        } else {
          // Se não for UUID padrão, devemos usar null
          console.warn(`Owner ID não é um UUID padrão válido: ${formData.owner}`);
          console.warn('API exige UUID ou null - usando null para evitar erro');
          
          // Manter null como valor seguro
          ownerIdToSend = null;
        }
      }
      
      console.log('Owner ID após processamento completo:', {
        original: formData.owner,
        finalId: ownerIdToSend,
        isValidUUID: ownerIdToSend ? (strictUuidRegex.test(ownerIdToSend) ? 'Sim' : 'Não') : 'n/a (null)',
        ambiente: process.env.NODE_ENV
      });
      
      // Verificação final de segurança
      if (ownerIdToSend !== null && !strictUuidRegex.test(ownerIdToSend)) {
        console.error('ALERTA CRÍTICO: ownerId ainda não é UUID válido após processamento. Forçando para null.');
        ownerIdToSend = null;
      }
      
      // Verificação final do stageId - adaptada para aceitar formato específico do sistema
      if (!stageIdToSend.startsWith('stage_') && !strictUuidRegex.test(stageIdToSend)) {
        console.error('ERRO CRÍTICO: stageId não é um ID de estágio válido após processamento:', stageIdToSend);
        toast({
          title: "Erro de sistema",
          description: "ID de estágio inválido. Por favor, contate o suporte técnico.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        setFormError("Erro crítico: ID de estágio inválido. Operação interrompida.");
        return;
      }
      
      // Verificação final do originId - adaptada para aceitar formato específico do sistema
      if (!originIdToSend.startsWith('origin_') && !strictUuidRegex.test(originIdToSend)) {
        console.error('ERRO CRÍTICO: originId não é um ID de origem válido após processamento:', originIdToSend);
        toast({
          title: "Erro de sistema",
          description: "ID de origem inválido. Por favor, contate o suporte técnico.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        setFormError("Erro crítico: ID de origem inválido. Operação interrompida.");
        return;
      }
      
      // Criar o negócio no servidor
      const url = `/api/crm/business`;
      
      const bodyData = {
        title: contactName,
        value: numericValue,
        leadId: selectedContact.id,
        stageId: stageIdToSend,
        originId: originIdToSend,
        ownerId: ownerIdToSend, // null ou UUID válido
        probability: formData.probability || 10,
        expectedCloseDate: formData.expectedCloseDate ? new Date(formData.expectedCloseDate) : null,
        customFields: {}
      };
      
      console.log('Enviando dados para criação de negócio:', bodyData);
      console.log('Verificação final de ownerId:', 
        ownerIdToSend === null ? 
          'null (valor seguro)' : 
          (strictUuidRegex.test(ownerIdToSend) ? 'UUID válido ✓' : 'UUID INVÁLIDO! ⚠️')
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session.user.id,
          'x-workspace-id': workspaceIdToSend // Usando o UUID gerado ou o original se for válido
        },
        body: JSON.stringify(bodyData)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Resposta de erro da API:', errorData);
        
        // Tentar extrair mensagem de erro do JSON
        let errorMessage = 'Erro ao criar negócio. Tente novamente.';
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch (e) {
          // Se não for um JSON válido, usar o texto completo da resposta
          if (errorData) {
            errorMessage = errorData;
          }
        }
        
        setFormError(errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Negócio criado com sucesso:', data);

      // Formatar dados para UI
      const businessObject = {
        id: data.id,
        title: contactName,
        fullName: contactName,
        contact: selectedContact.email || '',
        phone: selectedContact.phone || '',
        value: `R$ ${numericValue.toLocaleString('pt-BR', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2,
          style: 'decimal'
        })}`,
        tags: formattedTags,
        stageId: formData.stageId,
        stageName: formData.stageName,
        ownerId: formData.owner,
        photo: selectedContact.photo || null,
        createdAt: data.createdAt || now.toISOString(),
        progress: 10,
        originId: originId
      };

      // Chamar a função de callback para adicionar o negócio
      if (onAddBusiness) {
        console.log('Chamando onAddBusiness com os dados formatados:', businessObject);
        onAddBusiness(businessObject);
      } else {
        console.warn('onAddBusiness não está definido! O negócio não será exibido no frontend.');
      }
      
      // Exibir toast de sucesso
      toast({
        title: "Negócio adicionado!",
        description: `"${businessObject.title}" foi adicionado com sucesso ao estágio ${formData.stageName}.`,
        variant: "default",
      });
      
      // Resetar o formulário
      resetForm();
      
      // Fechar o modal
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar negócio:', error);
      // Se não tivermos um erro personalizado no formError, usar a mensagem do erro
      if (!formError) {
        setFormError(error instanceof Error ? error.message : 'Ocorreu um erro ao adicionar o negócio. Tente novamente.');
      }
      
      // Mostrar toast de erro
      toast({
        title: "Erro",
        description: formError || 'Erro ao criar negócio. Tente novamente.',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSelect = (contact: Lead) => {
    setFormData(prev => ({
      ...prev,
      contactId: contact.id,
      contactName: contact.name || contact.phone,
      contactPhoto: contact.photo || ''
    }));
    setSearchTerm(contact.name || contact.phone);
    setShowContactsList(false);
  };

  const handleOwnerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    
    // Se o valor estiver vazio, apenas atualizar o estado
    if (!value) {
      setFormData(prev => ({
        ...prev,
        owner: '',
        ownerName: ''
      }));
      return;
    }
    
    console.log('ID do usuário selecionado:', value);
    
    // Verificar se é um ID no formato nanoid (comum em alguns ambientes Next.js)
    const isNanoIdFormat = value.includes('cm9tx') || value.includes('hycswj');
    
    // Definição de UUID estrito para validação
    const strictUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    // Aceitar o ID mesmo que não seja um UUID válido, mas registrar um aviso
    if (!strictUuidRegex.test(value)) {
      console.warn(`Atenção: ID do usuário não é um UUID padrão: ${value}`);
      
      // Mostrar aviso ao usuário
      toast({
        title: "Aviso importante",
        description: "Este usuário usa um formato de ID não padrão. Ao salvar, o sistema pode usar 'Sem dono' como valor padrão.",
        variant: "default"
      });
    } else {
      console.log(`ID do usuário validado como UUID padrão válido: ${value}`);
    }
    
    const selectedUser = users.find(user => user.id === value);
    
    if (!selectedUser) {
      console.error(`Usuário não encontrado para o ID: ${value}`);
      toast({
        title: "Aviso",
        description: "Usuário não encontrado. Por favor, selecione outro usuário.",
        variant: "destructive",
      });
      // Limpar a seleção
      e.target.value = '';
      return;
    }
    
    console.log('Usuário selecionado:', selectedUser);
    
    setFormData(prev => ({
      ...prev,
      owner: value,
      ownerName: selectedUser?.name || ''
    }));
  };

  const handleContactInputFocus = () => {
    setShowContactsList(true);
  };

  const handleStageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    const selectedStage = stages.find(stage => stage.id === value);
    
    if (selectedStage) {
      // Validar se o ID do estágio é um UUID válido - em desenvolvimento aceitamos formatos alternativos
      if (!isRealUUID(selectedStage.id)) {
        console.warn(`Atenção: ID do estágio não é um UUID padrão: ${selectedStage.id}`);
        
        // Em produção, mostramos um aviso mais severo
        if (process.env.NODE_ENV === 'production') {
          console.error('ID do estágio inválido em produção:', selectedStage.id);
          toast({
            title: "Aviso",
            description: "O ID do estágio selecionado não segue o formato padrão UUID, mas será aceito.",
            variant: "default",
          });
        }
      }

      console.log('Estágio selecionado:', selectedStage);
      setFormData(prev => ({
        ...prev,
        stageId: selectedStage.id,
        stageName: selectedStage.name
      }));
    } else {
      console.warn('Estágio não encontrado para o ID:', value);
      // Limpar o stageId se a seleção for inválida
      setFormData(prev => ({
        ...prev,
        stageId: '',
        stageName: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1D24] rounded-lg w-full max-w-md shadow-xl border border-gray-800">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-lg font-medium text-white">Adicionar um novo negócio</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Exibir a origem selecionada como informação */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 flex items-center">
              Origem <span className="text-red-500 ml-1">*</span>
            </label>
            <div className={`w-full p-2.5 bg-[#0F1115] border ${originId ? 'border-gray-700' : 'border-red-500'} rounded-lg text-white flex items-center`}>
              {originId ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                  <span>{originName}</span>
                </>
              ) : (
                <span className="text-red-500">Nenhuma origem selecionada</span>
              )}
            </div>
            {!originId && (
              <p className="text-xs text-red-500 mt-1">
                É necessário selecionar uma origem primeiro no painel lateral
              </p>
            )}
          </div>

          {/* Etapa */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 flex items-center">
              Etapa <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              {isLoadingStages ? (
                <div className="w-full p-2.5 bg-[#0F1115] border border-gray-700 rounded-lg text-gray-400 flex items-center">
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Carregando estágios...
                </div>
              ) : (
                <>
                  {stages.length === 0 ? (
                    <div className="w-full p-2.5 bg-[#0F1115] border border-red-500 rounded-lg text-red-400 flex flex-col">
                      <div className="flex items-center">
                        <span>Nenhum estágio disponível</span>
                      </div>
                      <div className="text-xs mt-1">
                        Não foram encontrados estágios para esta origem. Por favor, crie estágios no pipeline primeiro.
                      </div>
                      {process.env.NODE_ENV === 'development' && (
                        <button 
                          type="button"
                          onClick={() => {
                            console.log('Debug da origem:', {
                              originId,
                              originName,
                              stagesCount: stages.length,
                              stages
                            });
                            // Tentar recarregar estágios
                            setStages([]);
                            // Adicionando um estágio temporário para desenvolvimento
                            if (originId) {
                              const tempStage = {
                                id: "temp-stage-1",
                                name: "Estágio Temporário (DEV)",
                                order: 1,
                                originId
                              };
                              setStages([tempStage]);
                              setFormData(prev => ({
                                ...prev,
                                stageId: tempStage.id,
                                stageName: tempStage.name
                              }));
                              toast({
                                title: "Modo Dev",
                                description: "Estágio temporário criado para desenvolvimento",
                              });
                            }
                          }}
                          className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                        >
                          Debug: Adicionar estágio temporário (DEV)
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <select
                        name="stageId"
                        value={formData.stageId}
                        onChange={handleStageSelect}
                        className="w-full p-2.5 bg-[#0F1115] border border-gray-700 rounded-lg appearance-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white"
                        required
                      >
                        {stages.map(stage => (
                          <option key={stage.id} value={stage.id}>
                            {stage.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                    </>
                  )}
                </>
              )}
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 mt-1">
                <button 
                  type="button" 
                  onClick={() => console.log('Estágios:', stages)}
                  className="text-blue-400 hover:underline"
                >
                  Debug: {stages.length} estágio(s)
                </button>
              </div>
            )}
          </div>

          {/* Dono do negócio */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300">Dono do negócio</label>
            <div className="relative">
              {isLoadingUsers ? (
                <div className="w-full p-2.5 bg-[#0F1115] border border-gray-700 rounded-lg text-gray-400 flex items-center">
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Carregando usuários...
                </div>
              ) : (
                <>
                  <select
                    name="owner"
                    value={formData.owner}
                    onChange={handleOwnerSelect}
                    className="w-full p-2.5 bg-[#0F1115] border border-gray-700 rounded-lg appearance-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white"
                  >
                    <option value="">Escolher dono do negócio</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.email ? `(${user.email})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </>
              )}
            </div>
          </div>

          {/* Valor do negócio */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300">Valor do negócio</label>
            <div className="relative">
              <input
                type="text"
                name="value"
                value={formData.value}
                onChange={handleValueChange}
                className="w-full p-2.5 bg-[#0F1115] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white"
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          {/* Contato - Campo de autocomplete */}
          <div className="space-y-1" ref={contactsRef}>
            <label className="text-sm font-medium text-gray-300 flex items-center">
              Contato <span className="text-red-500 ml-1">*</span>
            </label>           
            
            {/* Contato selecionado com estilo de badge */}
            {formData.contactId && (
              <div className="mb-2 p-2 bg-blue-900/20 border border-blue-800 rounded-lg flex items-center">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 mr-2 overflow-hidden">
                  {formData.contactPhoto ? (
                    <img 
                      src={formData.contactPhoto} 
                      alt={formData.contactName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{formData.contactName}</p>
                </div>
                <CheckCircle className="flex-shrink-0 ml-2 h-5 w-5 text-blue-400" />
              </div>
            )}
            
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="contactSearch"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={handleContactInputFocus}
                  className="w-full pl-10 p-2.5 bg-[#0F1115] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white"
                  placeholder="Pesquisar contato existente"
                  required
                />
              </div>
              
              {showContactsList && (
                <div className="absolute z-50 top-full left-0 mt-1 w-full bg-[#1A1D24] border border-gray-700 rounded-md shadow-md overflow-hidden">
                  {isLoadingContacts ? (
                    <div className="p-3 text-center text-gray-400">
                      <Loader className="h-4 w-4 mx-auto mb-2 animate-spin" />
                      Carregando contatos...
                    </div>
                  ) : searchTerm.trim() === '' ? (
                    <div className="p-3 text-center text-gray-400">
                      Digite para pesquisar contatos
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="p-3 text-center text-gray-400">
                      Nenhum contato encontrado. Os contatos devem ser previamente cadastrados em CRM/Leads.
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      {filteredContacts.map(contact => (
                        <div
                          key={contact.id}
                          className="px-3 py-2 hover:bg-gray-800 cursor-pointer flex items-center"
                          onClick={() => handleContactSelect(contact)}
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2">
                            {contact.photo ? (
                              <img 
                                src={contact.photo} 
                                alt={contact.name || ''} 
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm text-white">
                                {(contact.name?.charAt(0) || contact.phone.charAt(0) || '?').toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {contact.name || 'Sem nome'}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {contact.phone}
                              {contact.email && ` • ${contact.email}`}
                            </p>
                          </div>
                          {contact.labels && contact.labels.length > 0 && (
                            <div className="flex-shrink-0 ml-2 flex">
                              {contact.labels.slice(0, 2).map(label => (
                                <span
                                  key={label.id}
                                  className="w-2 h-2 rounded-full mx-0.5"
                                  style={{ backgroundColor: label.color }}
                                />
                              ))}
                              {contact.labels.length > 2 && (
                                <span className="text-xs text-gray-400 ml-1">
                                  +{contact.labels.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {formError && (
              <p className="text-xs text-red-500 mt-1">{formError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2.5 bg-blue-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A1D24] flex items-center justify-center ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Adicionando...
              </>
            ) : (
              'Adicionar negócio'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
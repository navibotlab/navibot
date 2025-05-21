'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Loader, Search, CheckCircle, User } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";

interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: string;
  photo?: string | null;
}

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

interface Business {
  id: string;
  title: string;
  value: number;
  leadId: string;
  stageId: string;
  originId: string;
  ownerId?: string;
  probability: number;
  expectedCloseDate?: Date | null;
  customFields?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface Stage {
  id: string;
  name: string;
  order: number;
  originId?: string;
}

interface AddBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageId?: string;
  stageName?: string;
  onAddBusiness?: (business: any) => void;
  onSave?: (businessData: any) => Promise<void>;
  originId?: string;
}

// Interface do formulário para manter tipos consistentes
interface FormDataType {
  origin: string;
  originName: string;
  stage: string;
  owner: string;
  ownerName: string;
  value: string;
  contactId: string;
  contactName: string;
  contactPhoto: string;
  probability?: number;
  expectedCloseDate?: string;
}

export function AddBusinessModal({ isOpen, onClose, stageId, stageName, onAddBusiness, onSave, originId }: AddBusinessModalProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<FormDataType>({
    origin: '',
    originName: '',
    stage: '',
    owner: '',
    ownerName: '',
    value: ' 0,00',
    contactId: '',
    contactName: '',
    contactPhoto: '',
    probability: 10,
    expectedCloseDate: ''
  });
  
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
  const contactsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [origins, setOrigins] = useState<{id: string, name: string}[]>([]);
  const [isLoadingOrigins, setIsLoadingOrigins] = useState(false);

  // Garantir que o stageId seja definido no formData toda vez que o modal abrir
  useEffect(() => {
    if (isOpen) {
      // Resetar o formulário com os valores iniciais
      console.log('AddBusinessModal aberto com originId:', originId);
      console.log('AddBusinessModal aberto com stageId:', stageId);
      
      setFormData(prev => ({
        ...prev,
        origin: originId || (origins.length > 0 ? origins[0].id : ''),
        stage: stageId || '', // Garantir que o stageId seja definido
        value: ' 0,00',
        contactId: '',
        contactName: '',
        contactPhoto: '',
        probability: 10,
        expectedCloseDate: ''
      }));
      
      // Limpar o termo de busca
      setSearchTerm('');
    }
  }, [isOpen, stageId, origins, originId]);

  // Atualizar o nome da origem quando a origem mudar
  useEffect(() => {
    if (formData.origin) {
      const selectedOrigin = origins.find(o => o.id === formData.origin);
      if (selectedOrigin) {
        setFormData(prev => ({
          ...prev,
          originName: selectedOrigin.name
        }));
      }
    }
  }, [formData.origin, origins]);

  // Buscar origens disponíveis
  useEffect(() => {
    const fetchOrigins = async () => {
      setIsLoadingOrigins(true);
      try {
        const response = await fetch('/api/crm/origins');
        if (!response.ok) {
          throw new Error('Erro ao buscar origens');
        }
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setOrigins(data);
          // Atualizar o formulário com a primeira origem se estiver vazio
          if (formData.origin === '' && data.length > 0) {
            setFormData(prev => ({
              ...prev,
              origin: data[0].id
            }));
          }
        } else if (data.data && Array.isArray(data.data)) {
          setOrigins(data.data);
          // Atualizar o formulário com a primeira origem se estiver vazio
          if (formData.origin === '' && data.data.length > 0) {
            setFormData(prev => ({
              ...prev,
              origin: data.data[0].id
            }));
          }
        } else {
          // Fallback para origens estáticas se a API não retornar nada
          console.warn('API não retornou origens no formato esperado, usando fallback');
          const fallbackOrigins = [
            { id: 'ebook', name: 'Ebook - Base Out24' },
            { id: 'adm', name: 'ADM REMOTA - Sucesso do Cliente' },
            { id: 'commercial', name: 'Comercial Ativo' }
          ];
          setOrigins(fallbackOrigins);
          if (formData.origin === '') {
            setFormData(prev => ({
              ...prev,
              origin: fallbackOrigins[0].id
            }));
          }
        }
      } catch (error) {
        console.error('Erro ao buscar origens:', error);
        // Fallback para origens estáticas em caso de erro
        const fallbackOrigins = [
          { id: 'ebook', name: 'Ebook - Base Out24' },
          { id: 'adm', name: 'ADM REMOTA - Sucesso do Cliente' },
          { id: 'commercial', name: 'Comercial Ativo' }
        ];
        setOrigins(fallbackOrigins);
        if (formData.origin === '') {
          setFormData(prev => ({
            ...prev,
            origin: fallbackOrigins[0].id
          }));
        }
      } finally {
        setIsLoadingOrigins(false);
      }
    };

    if (isOpen) {
      fetchOrigins();
    }
  }, [isOpen, formData.origin]);

  // Buscar estágios do pipeline
  useEffect(() => {
    if (!isOpen) return;
    
    setIsLoadingStages(true);
    const fetchStages = async () => {
      try {
        // Modificar para incluir o parâmetro originId na URL se disponível
        const url = originId ? `/api/crm/origins/${originId}/stages` : '/api/crm/stages';
        console.log(`Buscando estágios na URL: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Erro ao buscar estágios');
        }
        const data = await response.json();
        console.log('API resposta estágios:', data);
        
        let stagesData = [];
        if (data.stages && Array.isArray(data.stages)) {
          stagesData = data.stages;
        } else if (data.data && Array.isArray(data.data)) {
          stagesData = data.data;
        } else if (Array.isArray(data)) {
          stagesData = data;
        }
        
        // Filtrar apenas estágios que pertencem à origem selecionada
        let filteredStages = stagesData;
        
        // Se temos um originId, garantir que só mostre estágios dessa origem
        if (originId) {
          filteredStages = stagesData.filter((stage: Stage) => {
            // Verificar se o estágio pertence à origem selecionada
            const belongsToOrigin = stage.originId === originId;
            
            if (!belongsToOrigin && stage.originId) {
              console.log(`Estágio ignorado - origem diferente. ID: ${stage.id}, Origin: ${stage.originId}, Esperado: ${originId}`);
            }
            
            return belongsToOrigin || !stage.originId; // Incluir estágios sem originId como fallback
          });
          
          // Se após filtragem não tivermos estágios, utilizar todos como fallback
          if (filteredStages.length === 0) {
            console.warn(`Nenhum estágio encontrado para a origem ${originId}, usando todos os estágios como fallback`);
            filteredStages = stagesData;
          }
        }
        
        // Ordenar os estágios pela propriedade order se disponível
        const sortedStages = filteredStages.sort((a: Stage, b: Stage) => 
          (a.order !== undefined && b.order !== undefined) ? a.order - b.order : 0
        );
        
        console.log(`Estágios filtrados para origem ${originId}:`, sortedStages);
        console.log('Total de estágios após filtragem:', sortedStages.length);
        setStages(sortedStages);
        
        // Se não houver estágio definido e houver estágios disponíveis, selecionar o primeiro
        if (!stageId && sortedStages.length > 0) {
          setFormData(prev => ({
            ...prev,
            stage: sortedStages[0].id
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar estágios:', error);
      } finally {
        setIsLoadingStages(false);
      }
    };

    fetchStages();
  }, [isOpen, originId, stageId]);

  // Buscar usuários da workspace
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        console.log('Buscando usuários da workspace...');
        // Tentar buscar usuários com a rota específica para workspace
        const response = await fetch('/api/workspace/users', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.log(`Primeira tentativa falhou com status: ${response.status}. Tentando rota alternativa...`);
          // Se a primeira tentativa falhar, tentar uma rota alternativa
          const alternativeResponse = await fetch('/api/account/users', {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!alternativeResponse.ok) {
            console.error(`Erro ao buscar usuários: ${alternativeResponse.status}`);
            // Usar dados mock em caso de falha
            setUsers([
              { id: '1', name: 'Você (atual)', email: 'admin@exemplo.com', role: 'admin' }
            ]);
            return;
          }
          
          const data = await alternativeResponse.json();
          console.log('Resposta da rota alternativa:', data);
          
          if (data.users && Array.isArray(data.users)) {
            setUsers(data.users);
          } else if (Array.isArray(data)) {
            setUsers(data);
          } else {
            // Se não conseguirmos dados reais, usar dados mock temporariamente
            setUsers([
              { id: '1', name: 'Você (atual)', email: 'admin@exemplo.com', role: 'admin' }
            ]);
          }
        } else {
          const data = await response.json();
          console.log('Resposta da rota principal:', data);
          
          if (data.users && Array.isArray(data.users)) {
            setUsers(data.users);
          } else if (Array.isArray(data)) {
            setUsers(data);
          } else {
            // Se não conseguirmos dados reais, usar dados mock temporariamente
            setUsers([
              { id: '1', name: 'Você (atual)', email: 'admin@exemplo.com', role: 'admin' }
            ]);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        // Em caso de erro, usar dados mock para não bloquear o usuário
        setUsers([
          { id: '1', name: 'Você (atual)', email: 'admin@exemplo.com', role: 'admin' }
        ]);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Buscar contatos (leads) existentes
  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoadingContacts(true);
      try {
        const response = await fetch('/api/crm/leads');
        if (!response.ok) {
          throw new Error('Erro ao buscar contatos');
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setContacts(data);
        }
      } catch (error) {
        console.error('Erro ao buscar contatos:', error);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    if (isOpen) {
      fetchContacts();
    }
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

  // Aplicar máscara de moeda ao valor com suporte a posição do cursor - da direita para a esquerda
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
    const valueInReais = ` ${formattedNumber}`;
    
    // Obtém a posição do cursor antes da atualização
    const cursorPosition = input.selectionStart || 0;
    const oldLength = input.value.length;
    
    // Atualiza o valor no estado
    setFormData({
      ...formData,
      value: valueInReais
    });
    
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

  const resetForm = () => {
    console.log('resetForm chamado');

    setFormData({
      origin: '',
      originName: '',
      stage: '',
      owner: '',
      ownerName: '',
      value: ' 0,00',
      contactId: '',
      contactName: '',
      contactPhoto: '',
      probability: 10,
      expectedCloseDate: ''
    });
    
    setSearchTerm('');
  };

  const handleCloseModal = () => {
    console.log('handleCloseModal chamado');
    // Resetar o formulário antes de fechar
    resetForm();
    // Fechar o modal usando a função onClose passada via props
    console.log('Chamando onClose prop para fechar o modal');
    onClose();
  };

  // Quando o modal é fechado pelo X
  const handleManualClose = () => {
    console.log('handleManualClose (X button) chamado');
    resetForm();
    onClose();
  };

  // Função utilitária para validar UUIDs - modificada para ser mais flexível
  const isUUID = (str: string) => {
    if (!str) return false;
    
    // Expressão regular UUID padrão
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    // Para desenvolvimento, aceitar IDs numéricos simples ou strings curtas
    const isDevEnv = process.env.NODE_ENV === 'development';
    const isNumericId = /^\d+$/.test(str);
    const isSimpleId = str.length < 36 && !str.includes(' ');
    
    // Em desenvolvimento, ser mais flexível
    if (isDevEnv && (isNumericId || isSimpleId)) {
      console.log(`Aceitando ID não-UUID em ambiente de desenvolvimento: ${str}`);
      return true;
    }
    
    return uuidRegex.test(str);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Iniciando submissão do formulário');
    
    // Verificações básicas antes de prosseguir
    if (!formData.stage) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um estágio antes de adicionar o negócio.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.contactId) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um contato existente.",
        variant: "destructive",
      });
      return;
    }
    
    if (!session) {
      toast({
        title: "Erro",
        description: "Sua sessão expirou. Por favor, faça login novamente.",
        variant: "destructive",
      });
      return;
    }
    
    if (!session.user?.workspaceId) {
      toast({
        title: "Erro",
        description: "Não foi possível identificar seu workspace. Por favor, faça login novamente.",
        variant: "destructive",
      });
      return;
    }
    
    // Indicar carregamento
    setIsSubmitting(true);
    
    try {
      console.log('Processando formulário com dados:', formData);
      
      // IMPORTANTE: Sempre usar os valores dos campos do formulário, não confiar nos props
      // Isso evita bugs quando vários modais são abertos em sequência
      
      // Obter o valor do lead selecionado
      const selectedContact = contacts.find(contact => contact.id === formData.contactId);
      if (!selectedContact) {
        throw new Error("Contato selecionado não encontrado");
      }
      
      // Preparar o valor financeiro
      const numericValue = formData.value 
        ? parseFloat(formData.value.replace(/[^\d,.-]/g, '').replace(',', '.')) 
        : 0;
      
      // Resolver IDs e nomes
      const stageIdToSend = formData.stage || stageId || '';
      const stageNameToUse = formData.stage 
        ? stages.find(s => s.id === formData.stage)?.name 
        : stageName;
      
      const originIdToSend = formData.origin || originId || '';
      const originName = formData.origin ? origins.find(o => o.id === formData.origin)?.name : '';
      
      const ownerIdToSend = formData.owner || undefined;
      const ownerName = formData.owner ? users.find(u => u.id === formData.owner)?.name : '';
      
      const workspaceIdToSend = session.user?.workspaceId || '';
      const contactName = formData.contactName || selectedContact.name || selectedContact.phone;
      
      // Preparar tags
      let formattedTags = [];
      
      if (selectedContact?.labels && selectedContact.labels.length > 0) {
        formattedTags = selectedContact.labels.map(label => ({
          name: label.name,
          color: label.color
        }));
      } else if (selectedContact?.tags && selectedContact.tags.length > 0) {
        formattedTags = selectedContact.tags;
      } else {
        formattedTags = [{ name: 'Novo', color: '#2563EB' }];
      }
      
      const businessData = {
        title: contactName,
        value: numericValue,
        leadId: selectedContact.id,
        stageId: stageIdToSend,
        originId: originIdToSend,
        ownerId: ownerIdToSend,
        probability: formData.probability || 10,
        expectedCloseDate: formData.expectedCloseDate ? new Date(formData.expectedCloseDate) : null,
        customFields: {}
      };
      
      console.log('Enviando dados para criação de negócio:', businessData);

      let createdBusiness = null;
      
      // Se temos uma função onSave, usar ela em vez da API direta
      if (onSave) {
        await onSave(businessData);
        
        // Gerar UUID válido para IDs temporários
        const generateTempUUID = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };
        
        const tempUUID = generateTempUUID();
        
        createdBusiness = {
          id: tempUUID,
          businessId: tempUUID,
          leadId: selectedContact.id,
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
          stageId: stageIdToSend,
          stageName: stageNameToUse || 'Estágio não definido',
          ownerId: ownerIdToSend,
          photo: selectedContact.photo || null,
          createdAt: new Date().toISOString(),
          progress: formData.probability || 10
        };
      } else {
        const response = await fetch('/api/crm/business', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': session.user.id,
            'x-workspace-id': workspaceIdToSend
          },
          body: JSON.stringify(businessData)
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          let errorMessage = 'Erro ao criar negócio. Tente novamente.';
          try {
            const errorJson = JSON.parse(errorData);
            if (errorJson.error) {
              errorMessage = errorJson.error;
            }
          } catch (e) {
            if (errorData) {
              errorMessage = errorData;
            }
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('Resposta da API após criar negócio:', data);
        
        const businessId = data.businessId || data.id;
        if (!businessId) {
          throw new Error('Erro ao obter ID do negócio criado');
        }
        
        createdBusiness = {
          id: businessId,
          businessId: businessId,
          leadId: data.leadId || selectedContact.id,
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
          stageId: stageIdToSend,
          stageName: stageNameToUse || 'Estágio não definido',
          ownerId: ownerIdToSend,
          photo: selectedContact.photo || null,
          createdAt: data.createdAt || new Date().toISOString(),
          progress: formData.probability || 10
        };
      }
      
      // 1. Mostrar toast de sucesso
      toast({
        title: "Negócio adicionado!",
        description: `Negócio criado com sucesso!`,
        variant: "default",
      });
      
      // 2. Garantir que o objeto de negócio tem todos os campos necessários para UI
      if (createdBusiness) {
        // Incluir campos de UI necessários se não existirem
        const completeBusinessObject = {
          ...createdBusiness,
          // Campos garantidos para UI
          id: createdBusiness.id || `temp_${Date.now()}`,
          businessId: createdBusiness.businessId || createdBusiness.id || `temp_${Date.now()}`,
          stageId: createdBusiness.stageId || stageIdToSend,
          stageName: createdBusiness.stageName || stageNameToUse || 'Estágio',
          title: createdBusiness.title || contactName || 'Novo negócio',
          fullName: createdBusiness.fullName || createdBusiness.title || contactName || 'Novo negócio'
        };
        
        console.log('Objeto completo de negócio a enviar para callback:', completeBusinessObject);
        
        // 3. Chamar o callback com o objeto completo
        if (onAddBusiness) {
          console.log('Chamando onAddBusiness com o negócio criado');
          try {
            onAddBusiness(completeBusinessObject);
          } catch (callbackError) {
            console.error('Erro ao chamar onAddBusiness:', callbackError);
          }
        } else {
          console.warn('onAddBusiness não está definido! O negócio não será exibido na interface.');
        }
      }
      
      // 4. Resetar o formulário
      resetForm();
      
      // 5. Fechar o modal por último, após todas as operações concluídas
      console.log('Fechando modal após processamento completo');
      onClose();
      
    } catch (error) {
      console.error('Erro ao adicionar negócio:', error);
      
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao adicionar o negócio. Tente novamente.',
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
    
    // Validar se o ID é um UUID válido
    const isUUID = (str: string) => {
      if (!str) return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };
    
    // Verificar se o ID do usuário é válido
    if (!isUUID(value)) {
      toast({
        title: "Aviso",
        description: `O ID do usuário selecionado (${value}) não é um UUID válido. Por favor, selecione outro usuário.`,
        variant: "destructive",
      });
      // Limpar a seleção
      e.target.value = '';
      return;
    }
    
    const selectedUser = users.find(user => user.id === value);
    
    setFormData(prev => ({
      ...prev,
      owner: value,
      ownerName: selectedUser?.name || ''
    }));
  };

  const handleContactInputFocus = () => {
    setShowContactsList(true);
  };

  // Efeito para quando o modal for aberto, buscar as origens
  useEffect(() => {
    if (isOpen) {
      // Log para depuração da origem selecionada
      console.log('AddBusinessModal aberto. Valores iniciais:');
      console.log('formData.origin:', formData.origin);
      console.log('origins:', origins);
    }
  }, [isOpen, formData.origin, origins]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1D24] rounded-lg w-full max-w-md shadow-xl border border-gray-800">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-lg font-medium text-white">Adicionar negócio em {stageName}</h2>
          <button onClick={handleManualClose} className="text-gray-400 hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Origem - Exibir como fixa em vez de dropdown */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 flex items-center">
              Origem <span className="text-red-500 ml-1">*</span>
              <span className="ml-2 text-xs text-blue-400">(Fixo)</span>
            </label>
            <div className="w-full p-2.5 bg-[#0F1115] border border-blue-800 rounded-lg text-white bg-blue-900/20 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-blue-400" />
              {formData.originName || (origins.find(o => o.id === formData.origin)?.name || 'Carregando origem...')}
            </div>
          </div>

          {/* Etapa */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 flex items-center">
              Etapa <span className="text-red-500 ml-1">*</span>
              {!isLoadingStages && <span className="ml-2 text-xs text-blue-400">(Fixo)</span>}
            </label>
            <div className="relative">
              {isLoadingStages ? (
                <div className="w-full p-2.5 bg-[#0F1115] border border-gray-700 rounded-lg text-gray-400 flex items-center">
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Carregando estágios...
                </div>
              ) : (
                <div className="w-full p-2.5 bg-[#0F1115] border border-blue-800 rounded-lg text-white bg-blue-900/20 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-blue-400" />
                  {stageName || (stages.find(s => s.id === formData.stage)?.name || 'Selecione uma etapa')}
                </div>
              )}
            </div>
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
              <span className="absolute left-3 top-3 text-gray-400">R$</span>
              <input
                type="text"
                name="value"
                value={formData.value}
                onChange={handleValueChange}
                className="w-full pl-8 p-2.5 bg-[#0F1115] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white"
                placeholder="0,00"
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
                      Nenhum contato encontrado. Você precisa ter contatos cadastrados no sistema.
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
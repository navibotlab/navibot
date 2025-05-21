'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

interface CreateAgentFormProps {
  onSubmit: (data: any, activeTab: string, onSuccess?: (data?: any) => void) => void;
  onCancel: () => void;
  editingAgent?: any;
}

interface FormErrors {
  [key: string]: string;
}

export function CreateAgentForm({ onSubmit, onCancel, editingAgent }: CreateAgentFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('identidade');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(`session-${Date.now()}`);
  const [vectorStores, setVectorStores] = useState<any[]>([]);
  const [loadingVectorStores, setLoadingVectorStores] = useState(false);
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    internalName: '',
    imageUrl: '',
    initialMessage: '',
    voiceTone: '',
    model: '',
    language: '',
    timezone: 'America/Sao_Paulo',
    instructions: '',
    companyName: '',
    companySector: '',
    companyWebsite: '',
    companyDescription: '',
    temperature: 0.7,
    frequencyPenalty: 0.25,
    presencePenalty: 0.25,
    topP: 1.0,
    maxMessages: 20,
    maxTokens: 5000,
    responseFormat: 'text',
    personalityObjective: '',
    agentSkills: '',
    agentFunction: '',
    productInfo: '',
    restrictions: '',
    vectorStoreId: '',
    sessionId: sessionId
  });

  // Carregar armazenamentos de vetores
  useEffect(() => {
    const fetchVectorStores = async () => {
      setLoadingVectorStores(true);
      try {
        const response = await fetch('/api/vector-stores');
        if (response.ok) {
          const data = await response.json();
          setVectorStores(data.vectorStores || []);
        } else {
          console.error('Erro ao carregar armazenamentos de vetores');
        }
      } catch (error) {
        console.error('Erro ao carregar armazenamentos de vetores:', error);
      } finally {
        setLoadingVectorStores(false);
      }
    };

    fetchVectorStores();
  }, []);

  const validateIdentityTab = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome do agente é obrigatório';
    }
    
    if (!formData.internalName.trim()) {
      newErrors.internalName = 'Nome interno é obrigatório';
    }
    
    if (!formData.initialMessage.trim()) {
      newErrors.initialMessage = 'Mensagem inicial é obrigatória';
    }
    
    if (!formData.voiceTone) {
      newErrors.voiceTone = 'Tom de voz é obrigatório';
    }

    if (!formData.model) {
      newErrors.model = 'Modelo do agente é obrigatório';
    }

    if (!formData.language) {
      newErrors.language = 'Idioma é obrigatório';
    }

    if (!formData.timezone) {
      newErrors.timezone = 'Timezone é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCompanyTab = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Nome da empresa é obrigatório';
    }
    
    if (!formData.companySector) {
      newErrors.companySector = 'Setor é obrigatório';
    }
    
    if (!formData.companyWebsite.trim()) {
      newErrors.companyWebsite = 'Website é obrigatório';
    }
    
    if (!formData.companyDescription.trim()) {
      newErrors.companyDescription = 'Descrição da empresa é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBehaviorTab = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.personalityObjective.trim()) {
      newErrors.personalityObjective = 'Objetivo e personalidade são obrigatórios';
    }
    
    if (!formData.agentSkills.trim()) {
      newErrors.agentSkills = 'Habilidades são obrigatórias';
    }
    
    if (!formData.agentFunction) {
      newErrors.agentFunction = 'Função principal é obrigatória';
    }
    
    if (!formData.restrictions.trim()) {
      newErrors.restrictions = 'Restrições são obrigatórias';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateOrUpdateAgent = async (nextTab?: string) => {
    setIsLoading(true);
    try {
      // Validar a aba atual antes de prosseguir
      let isValid = true;
      if (activeTab === 'identidade') {
        isValid = validateIdentityTab();
      } else if (activeTab === 'empresa') {
        isValid = validateCompanyTab();
      } else if (activeTab === 'comportamento') {
        isValid = validateBehaviorTab();
      }

      if (!isValid) {
        setIsLoading(false);
        return;
      }

      const dataToSubmit = {
        ...formData,
        sessionId: sessionId
      };
      
      console.log('Processando agente com sessionId:', sessionId, {
        tab: activeTab,
        data: dataToSubmit
      });

      await onSubmit(dataToSubmit, activeTab, (data) => {
        console.log('Resposta do servidor:', data);
        
        if (data?.id) {
          console.log('ID do agente recebido:', data.id);
          setFormData(prev => ({ ...prev, id: data.id }));
        }
        
        if (nextTab) {
          setActiveTab(nextTab);
        } else if (activeTab === 'comportamento') {
          router.push('/admin/agentes');
        }
      });
    } catch (error) {
      console.error('Erro ao processar agente:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndContinue = async (nextTab: string) => {
    // Validar a aba atual antes de prosseguir
    let isValid = true;
    setIsLoading(true);
    try {
      if (activeTab === 'identidade') {
        isValid = validateIdentityTab();
      } else if (activeTab === 'empresa') {
        isValid = validateCompanyTab();
      }

      if (!isValid) {
        return;
      }

      // Apenas navega para a próxima aba sem enviar dados para o servidor
      setActiveTab(nextTab);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishAgent = async () => {
    if (validateBehaviorTab()) {
      setIsLoading(true);
      try {
        await onSubmit(formData, activeTab, () => {
          setIsLoading(false);
          router.push('/admin');
          router.refresh(); // Força o recarregamento dos dados
        });
      } catch (error) {
        setIsLoading(false);
        console.error('Erro ao criar agente:', error);
      }
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    console.log(`Campo alterado: ${field}`, value);
    setFormData(prev => {
      // Tratar campos numéricos
      if (['temperature', 'frequencyPenalty', 'presencePenalty', 'maxMessages', 'maxTokens', 'topP'].includes(field)) {
        const numericValue = typeof value === 'string' ? parseFloat(value) : value;
        const newData = { ...prev, [field]: numericValue };
        console.log('Novo formData com campo numérico:', newData);
        return newData;
      }
      
      const newData = { ...prev, [field]: value };
      console.log('Novo formData:', newData);
      return newData;
    });
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Função auxiliar para obter a contagem de arquivos
  const getFileCount = (store: any) => {
    // Verificar se temos a propriedade files com dados
    if (store.files && Array.isArray(store.files)) {
      return store.files.length;
    }
    
    // Verificar se temos a propriedade file_count
    if (typeof store.file_count === 'number') {
      return store.file_count;
    }
    
    // Tentar converter para número se for string
    if (typeof store.file_count === 'string' && !isNaN(parseInt(store.file_count))) {
      return parseInt(store.file_count);
    }
    
    // Fallback para 0 se nenhuma das opções acima funcionar
    return 0;
  };

  return (
    <div className="h-full bg-[#0F1115] text-gray-100 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
      <div className="flex items-center gap-4 p-6 border-b border-gray-800">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="hover:bg-gray-800 group"
        >
          <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Criar Agente IA</h1>
          <p className="text-sm text-gray-400">Configure seu agente</p>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-transparent border-b border-gray-800 w-full justify-start gap-4 h-auto p-0">
            <TabsTrigger 
              value="identidade"
              className="text-sm text-white data-[state=active]:bg-[#1A1D24] data-[state=active]:text-white px-4 py-2 rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-600"
            >
              1. Identidade do Agente
            </TabsTrigger>
            <TabsTrigger 
              value="empresa"
              className="text-sm text-white data-[state=active]:bg-[#1A1D24] data-[state=active]:text-white px-4 py-2 rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-600"
            >
              2. Identidade da Empresa
            </TabsTrigger>
            <TabsTrigger 
              value="comportamento"
              className="text-sm text-white data-[state=active]:bg-[#1A1D24] data-[state=active]:text-white px-4 py-2 rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-600"
            >
              3. Comportamento do Agente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="identidade" className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white">
                  Imagem do Agente
                </label>
                <p className="text-sm text-gray-400 mb-2">Insira a imagem que você quer que apareça como o perfil do seu Agente</p>
                <ImageUpload
                  onImageUpload={(imageUrl) => handleInputChange('imageUrl', imageUrl)}
                  defaultImage={formData.imageUrl}
                />
                {errors.imageUrl && (
                  <p className="text-sm text-red-500 mt-1">{errors.imageUrl}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Nome do Agente <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Ex: Bot de Atendimento"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`mt-2 bg-[#1A1D24] border-gray-800 text-white ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Nome interno <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-400 mb-2">Não influencia no comportamento do Agente. Utilize para a sua organização.</p>
                <Input
                  value={formData.internalName}
                  onChange={(e) => handleInputChange('internalName', e.target.value)}
                  className={`bg-[#1A1D24] border-gray-800 text-white ${
                    errors.internalName ? 'border-red-500' : ''
                  }`}
                />
                {errors.internalName && (
                  <p className="text-sm text-red-500 mt-1">{errors.internalName}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Mensagem Inicial <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.initialMessage}
                  onChange={(e) => handleInputChange('initialMessage', e.target.value)}
                  placeholder="Mensagem que o agente enviará ao iniciar uma conversa"
                  className={`mt-2 bg-[#1A1D24] border-gray-800 text-white ${
                    errors.initialMessage ? 'border-red-500' : ''
                  }`}
                  rows={4}
                />
                {errors.initialMessage && (
                  <p className="text-sm text-red-500 mt-1">{errors.initialMessage}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Tom de Voz <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.voiceTone}
                  onChange={(e) => handleInputChange('voiceTone', e.target.value)}
                  className={`w-full mt-2 px-3 py-2 bg-[#1A1D24] border border-gray-800 rounded-md text-white ${
                    errors.voiceTone ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Selecione um tom de voz</option>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="amigavel">Amigável</option>
                  <option value="profissional">Profissional</option>
                </select>
                {errors.voiceTone && (
                  <p className="text-sm text-red-500 mt-1">{errors.voiceTone}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Modelo do Agente <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-400 mb-2">Selecione o modelo do Agente para geração da resposta</p>
                <select
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className={`w-full mt-2 px-3 py-2 bg-[#1A1D24] border border-gray-800 rounded-md text-white ${
                    errors.model ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Selecione um modelo</option>
                  <option value="gpt-4o">gpt-4o - Modelo mais recente e eficiente, totalmente compatível com File Search</option>
                  <option value="gpt-4o-mini">gpt-4o-mini - Compatível, porém com relatos de desempenho inconsistente</option>
                  <option value="gpt-4-turbo">gpt-4-turbo - Inclui versões preview compatíveis</option>
                </select>
                {errors.model && (
                  <p className="text-sm text-red-500 mt-1">{errors.model}</p>
                )}
                <p className="text-sm text-gray-400 mt-1">TPS = Tokens por segundo</p>
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Idioma <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-400 mb-2">Selecione o idioma do Agente para geração da resposta</p>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className={`w-full mt-2 px-3 py-2 bg-[#1A1D24] border border-gray-800 rounded-md text-white ${
                    errors.language ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Selecione um idioma</option>
                  <option value="deteccao">Detecção Automática</option>
                  <option value="pt">Português</option>
                  <option value="en">Inglês</option>
                  <option value="es">Espanhol</option>
                </select>
                {errors.language && (
                  <p className="text-sm text-red-500 mt-1">{errors.language}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Timezone <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-400 mb-2">Selecione o timezone do Agente para geração da resposta</p>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className={`w-full mt-2 px-3 py-2 bg-[#1A1D24] border border-gray-800 rounded-md text-white ${
                    errors.timezone ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Selecione um timezone</option>
                  <option value="America/Sao_Paulo">São Paulo (GMT -3)</option>
                  <option value="America/New_York">New York (GMT -5)</option>
                  <option value="Europe/London">London (GMT +0)</option>
                  <option value="Asia/Tokyo">Tokyo (GMT +9)</option>
                </select>
                {errors.timezone && (
                  <p className="text-sm text-red-500 mt-1">{errors.timezone}</p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => handleSaveAndContinue('empresa')}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processando...</span>
                    </div>
                  ) : (
                    'Continuar'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="empresa" className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white">
                  Nome da Empresa <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Ex: TechSolutions Brasil"
                  className={`mt-2 bg-[#1A1D24] border-gray-800 text-white ${
                    errors.companyName ? 'border-red-500' : ''
                  }`}
                />
                {errors.companyName && (
                  <p className="text-sm text-red-500 mt-1">{errors.companyName}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Setor <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.companySector}
                  onChange={(e) => handleInputChange('companySector', e.target.value)}
                  className={`w-full mt-2 px-3 py-2 bg-[#1A1D24] border border-gray-800 rounded-md text-white ${
                    errors.companySector ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Selecione um setor</option>
                  <option value="tecnologia">Tecnologia</option>
                  <option value="saude">Saúde</option>
                  <option value="educacao">Educação</option>
                  <option value="varejo">Varejo</option>
                  <option value="servicos">Serviços</option>
                </select>
                {errors.companySector && (
                  <p className="text-sm text-red-500 mt-1">{errors.companySector}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Website <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.companyWebsite}
                  onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                  placeholder="Ex: https://www.empresa.com.br (Caso não tenha site, pode inserir alguma rede social)"
                  className={`mt-2 bg-[#1A1D24] border-gray-800 text-white ${
                    errors.companyWebsite ? 'border-red-500' : ''
                  }`}
                />
                {errors.companyWebsite && (
                  <p className="text-sm text-red-500 mt-1">{errors.companyWebsite}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Descrição da Empresa <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.companyDescription}
                  onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                  placeholder="Descreva sua empresa, produtos e serviços"
                  className={`mt-2 bg-[#1A1D24] border-gray-800 text-white ${
                    errors.companyDescription ? 'border-red-500' : ''
                  }`}
                  rows={4}
                />
                {errors.companyDescription && (
                  <p className="text-sm text-red-500 mt-1">{errors.companyDescription}</p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => handleSaveAndContinue('comportamento')}
                  className="bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processando...</span>
                    </div>
                  ) : (
                    'Continuar'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comportamento" className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white">
                  Objetivo e Personalidade <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.personalityObjective}
                  onChange={(e) => handleInputChange('personalityObjective', e.target.value)}
                  placeholder="Defina o objetivo e a personalidade do agente"
                  className={`mt-2 bg-[#1A1D24] border-gray-800 text-white ${
                    errors.personalityObjective ? 'border-red-500' : ''
                  }`}
                  rows={4}
                />
                {errors.personalityObjective && (
                  <p className="text-sm text-red-500 mt-1">{errors.personalityObjective}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Habilidades <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.agentSkills}
                  onChange={(e) => handleInputChange('agentSkills', e.target.value)}
                  placeholder="Liste as habilidades do agente"
                  className={`mt-2 bg-[#1A1D24] border-gray-800 text-white ${
                    errors.agentSkills ? 'border-red-500' : ''
                  }`}
                  rows={4}
                />
                {errors.agentSkills && (
                  <p className="text-sm text-red-500 mt-1">{errors.agentSkills}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Função Principal <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.agentFunction}
                  onChange={(e) => handleInputChange('agentFunction', e.target.value)}
                  className={`w-full mt-2 px-3 py-2 bg-[#1A1D24] border border-gray-800 rounded-md text-white ${
                    errors.agentFunction ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Selecionar</option>
                  <option value="atendimento">Atendimento ao Cliente</option>
                  <option value="vendas">Vendas</option>
                  <option value="suporte">Suporte Técnico</option>
                  <option value="educacao">Educação</option>
                </select>
                {errors.agentFunction && (
                  <p className="text-sm text-red-500 mt-1">{errors.agentFunction}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Informações do Produto
                </label>
                <Textarea
                  value={formData.productInfo}
                  onChange={(e) => handleInputChange('productInfo', e.target.value)}
                  placeholder="Descreva produtos, serviços ou ofertas específicas deste agente"
                  className="mt-2 bg-[#1A1D24] border-gray-800 text-white"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Restrições <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.restrictions}
                  onChange={(e) => handleInputChange('restrictions', e.target.value)}
                  placeholder="Liste o que o agente NÃO deve fazer"
                  className={`mt-2 bg-[#1A1D24] border-gray-800 text-white ${
                    errors.restrictions ? 'border-red-500' : ''
                  }`}
                  rows={4}
                />
                {errors.restrictions && (
                  <p className="text-sm text-red-500 mt-1">{errors.restrictions}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Armazenamento de Vetores
                </label>
                <p className="text-sm text-gray-400 mb-2">Selecione um armazenamento de vetores para vincular ao agente</p>
                <select
                  value={formData.vectorStoreId}
                  onChange={(e) => handleInputChange('vectorStoreId', e.target.value)}
                  className="w-full mt-2 px-3 py-2 bg-[#1A1D24] border border-gray-800 rounded-md text-white"
                >
                  <option value="">Selecione um Armazenamento...</option>
                  {loadingVectorStores ? (
                    <option value="" disabled>Carregando armazenamentos...</option>
                  ) : (
                    vectorStores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name} ({getFileCount(store)} arquivo(s))
                      </option>
                    ))
                  )}
                </select>
                <p className="text-sm text-gray-400 mt-1">
                  O armazenamento de vetores permite que o agente acesse documentos e arquivos para responder perguntas.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">Parâmetros</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvancedParams(!showAdvancedParams)}
                    className="text-gray-400 hover:text-white"
                  >
                    {showAdvancedParams ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {showAdvancedParams && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-white">
                        Temperatura <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={formData.temperature}
                          onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                          className="w-full mt-2"
                        />
                        <span className="text-sm font-medium text-white">{typeof formData.temperature === 'number' ? formData.temperature.toFixed(2) : '0.70'}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0 (Mais focado)</span>
                        <span>1 (Mais criativo)</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-white">
                        Top P <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={formData.topP || 1.0}
                          onChange={(e) => handleInputChange('topP', parseFloat(e.target.value))}
                          className="w-full mt-2"
                        />
                        <span className="text-sm font-medium text-white">{typeof formData.topP === 'number' ? formData.topP.toFixed(2) : '1.00'}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0 (Menos diverso)</span>
                        <span>1 (Mais diverso)</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleFinishAgent}
                  className="bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Criando agente...</span>
                    </div>
                  ) : (
                    'Criar Agente'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 
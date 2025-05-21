import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageSquare, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { Agent, UpdateAgentFormProps } from '../types/agent';

// Função auxiliar para garantir o redirecionamento
function forceRedirect(url: string) {
  console.log(`Forçando redirecionamento para ${url}`);
  
  // Tentar múltiplas abordagens para garantir o redirecionamento
  try {
    // Método 1: window.location.href
    window.location.href = url;
    
    // Método 2: window.location.replace (como fallback)
    setTimeout(() => {
      if (window.location.pathname !== url) {
        console.log('Tentando método alternativo de redirecionamento');
        window.location.replace(url);
      }
    }, 500);
    
    // Método 3: último recurso
    setTimeout(() => {
      if (window.location.pathname !== url) {
        console.log('Tentando método final de redirecionamento');
        document.location.href = url;
      }
    }, 1000);
  } catch (error) {
    console.error('Erro ao redirecionar:', error);
    // Último recurso
    window.location.href = url;
  }
}

export function UpdateAgentForm({ onSubmit, onCancel, editingAgent }: UpdateAgentFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('identidade');
  const [isLoading, setIsLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [vectorStores, setVectorStores] = useState<any[]>([]);
  const [loadingVectorStores, setLoadingVectorStores] = useState(false);
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);
  const [formData, setFormData] = useState<Agent>(() => {
    if (!editingAgent) {
      return {
        id: '',
        name: '',
        internalName: '',
        imageUrl: '',
        initialMessage: '',
        voiceTone: '',
        model: 'gpt-4',
        language: 'pt',
        timezone: 'America/Sao_Paulo',
        instructions: '',
        temperature: 0.7,
        frequencyPenalty: 0,
        presencePenalty: 0,
        topP: 1.0,
        maxMessages: 20,
        maxTokens: 1000,
        responseFormat: '',
        companyName: '',
        companySector: '',
        companyWebsite: '',
        companyDescription: '',
        personalityObjective: '',
        agentSkills: '',
        agentFunction: '',
        productInfo: '',
        restrictions: '',
        assistantId: '',
        vectorStoreId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    // Construir objeto de forma explícita para garantir que todos os valores sejam preenchidos corretamente
    const initialData: Agent = {
      id: editingAgent.id || '',
      name: editingAgent.name || '',
      internalName: editingAgent.internalName || '',
      imageUrl: editingAgent.imageUrl || '',
      initialMessage: editingAgent.initialMessage || '',
      voiceTone: editingAgent.voiceTone || '',
      model: editingAgent.model || 'gpt-4',
      language: editingAgent.language || 'pt',
      timezone: editingAgent.timezone || 'America/Sao_Paulo',
      instructions: editingAgent.instructions || '',
      temperature: typeof editingAgent.temperature === 'number' ? editingAgent.temperature : 0.7,
      frequencyPenalty: typeof editingAgent.frequencyPenalty === 'number' ? editingAgent.frequencyPenalty : 0,
      presencePenalty: typeof editingAgent.presencePenalty === 'number' ? editingAgent.presencePenalty : 0,
      topP: typeof editingAgent.topP === 'number' ? editingAgent.topP : 1.0,
      maxMessages: typeof editingAgent.maxMessages === 'number' ? editingAgent.maxMessages : 20,
      maxTokens: typeof editingAgent.maxTokens === 'number' ? editingAgent.maxTokens : 1000,
      responseFormat: editingAgent.responseFormat || '',
      companyName: editingAgent.companyName || '',
      companySector: editingAgent.companySector || '',
      companyWebsite: editingAgent.companyWebsite || '',
      companyDescription: editingAgent.companyDescription || '',
      personalityObjective: editingAgent.personalityObjective || '',
      agentSkills: editingAgent.agentSkills || '',
      agentFunction: editingAgent.agentFunction || '',
      productInfo: editingAgent.productInfo || '',
      restrictions: editingAgent.restrictions || '',
      assistantId: editingAgent.assistantId || '',
      vectorStoreId: editingAgent.vectorStoreId || '',
      createdAt: editingAgent.createdAt || new Date().toISOString(),
      updatedAt: editingAgent.updatedAt || new Date().toISOString()
    };
    
    return initialData;
  });

  // Melhorar o useEffect para garantir que todos os dados estejam preenchidos
  useEffect(() => {
    if (editingAgent) {
      // SOLUÇÃO DE EMERGÊNCIA: Se temos um id mas os outros campos estão vazios, 
      // buscar os dados diretamente do banco com uma chamada separada
      if (editingAgent.id && 
          (editingAgent.internalName === undefined || 
           editingAgent.initialMessage === undefined || 
           editingAgent.voiceTone === undefined || 
           editingAgent.companyName === undefined || 
           editingAgent.personalityObjective === undefined)) {
        
        fetchAgentDirectly(editingAgent.id);
        return; // Não continua com a atualização para evitar dados incompletos
      }
      
      // Atualizar o estado de forma explícita, garantindo que todos os campos sejam preenchidos
      setFormData(prevData => {
        const newData: Agent = {
          id: editingAgent.id || prevData.id,
          name: editingAgent.name || prevData.name,
          internalName: editingAgent.internalName || prevData.internalName,
          imageUrl: editingAgent.imageUrl || prevData.imageUrl,
          initialMessage: editingAgent.initialMessage || prevData.initialMessage,
          voiceTone: editingAgent.voiceTone || prevData.voiceTone,
          model: editingAgent.model || prevData.model,
          language: editingAgent.language || prevData.language,
          timezone: editingAgent.timezone || prevData.timezone,
          instructions: editingAgent.instructions || prevData.instructions,
          temperature: typeof editingAgent.temperature === 'number' ? editingAgent.temperature : prevData.temperature,
          frequencyPenalty: typeof editingAgent.frequencyPenalty === 'number' ? editingAgent.frequencyPenalty : prevData.frequencyPenalty,
          presencePenalty: typeof editingAgent.presencePenalty === 'number' ? editingAgent.presencePenalty : prevData.presencePenalty,
          topP: typeof editingAgent.topP === 'number' ? editingAgent.topP : 1.0,
          maxMessages: typeof editingAgent.maxMessages === 'number' ? editingAgent.maxMessages : prevData.maxMessages,
          maxTokens: typeof editingAgent.maxTokens === 'number' ? editingAgent.maxTokens : prevData.maxTokens,
          responseFormat: editingAgent.responseFormat || prevData.responseFormat,
          companyName: editingAgent.companyName || prevData.companyName,
          companySector: editingAgent.companySector || prevData.companySector,
          companyWebsite: editingAgent.companyWebsite || prevData.companyWebsite,
          companyDescription: editingAgent.companyDescription || prevData.companyDescription,
          personalityObjective: editingAgent.personalityObjective || prevData.personalityObjective,
          agentSkills: editingAgent.agentSkills || prevData.agentSkills,
          agentFunction: editingAgent.agentFunction || prevData.agentFunction,
          productInfo: editingAgent.productInfo || prevData.productInfo,
          restrictions: editingAgent.restrictions || prevData.restrictions,
          assistantId: editingAgent.assistantId || prevData.assistantId,
          vectorStoreId: editingAgent.vectorStoreId || prevData.vectorStoreId,
          createdAt: editingAgent.createdAt || prevData.createdAt,
          updatedAt: editingAgent.updatedAt || prevData.updatedAt
        };
        return newData;
      });
    }
  }, [editingAgent]);

  // SOLUÇÃO DE EMERGÊNCIA: Buscar os dados diretamente do banco com uma chamada alternativa
  const fetchAgentDirectly = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}?_bypass=true&_timestamp=${Date.now()}`);
      
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      
      if (!data || Object.keys(data).length === 0) {
        return;
      }
      
      // Atualizar o estado com os dados recebidos diretamente
      setFormData(prevData => {
        const newData: Agent = {
          ...prevData,
          id: data.id || prevData.id,
          name: data.name || prevData.name,
          internalName: data.internalName || prevData.internalName,
          imageUrl: data.imageUrl || prevData.imageUrl,
          initialMessage: data.initialMessage || prevData.initialMessage,
          voiceTone: data.voiceTone || prevData.voiceTone,
          model: data.model || prevData.model,
          language: data.language || prevData.language,
          timezone: data.timezone || prevData.timezone,
          instructions: data.instructions || prevData.instructions,
          temperature: typeof data.temperature === 'number' ? data.temperature : prevData.temperature,
          frequencyPenalty: typeof data.frequencyPenalty === 'number' ? data.frequencyPenalty : prevData.frequencyPenalty,
          presencePenalty: typeof data.presencePenalty === 'number' ? data.presencePenalty : prevData.presencePenalty,
          topP: typeof data.topP === 'number' ? data.topP : 1.0,
          maxMessages: typeof data.maxMessages === 'number' ? data.maxMessages : prevData.maxMessages,
          maxTokens: typeof data.maxTokens === 'number' ? data.maxTokens : prevData.maxTokens,
          responseFormat: data.responseFormat || prevData.responseFormat,
          companyName: data.companyName || prevData.companyName,
          companySector: data.companySector || prevData.companySector,
          companyWebsite: data.companyWebsite || prevData.companyWebsite,
          companyDescription: data.companyDescription || prevData.companyDescription,
          personalityObjective: data.personalityObjective || prevData.personalityObjective,
          agentSkills: data.agentSkills || prevData.agentSkills,
          agentFunction: data.agentFunction || prevData.agentFunction,
          productInfo: data.productInfo || prevData.productInfo,
          restrictions: data.restrictions || prevData.restrictions,
          assistantId: data.assistantId || prevData.assistantId,
          vectorStoreId: data.vectorStoreId || prevData.vectorStoreId,
          createdAt: data.createdAt || prevData.createdAt,
          updatedAt: data.updatedAt || prevData.updatedAt
        };
        
        return newData;
      });
    } catch (error) {
    }
  };

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
        }
      } catch (error) {
      } finally {
        setLoadingVectorStores(false);
      }
    };

    fetchVectorStores();
  }, []);

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

  const handleUpdateAgent = async (onSuccess?: () => void) => {
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    setUpdateSuccess(false);
    try {
      if (!editingAgent?.id) {
        return;
      }

      const dataToUpdate = {
        ...formData,
        id: editingAgent.id
      };

      await onSubmit(dataToUpdate, activeTab, (data) => {
        setUpdateSuccess(true);
        
        // Se estiver na aba de comportamento, redireciona diretamente
        if (activeTab === 'comportamento') {
          setTimeout(() => {
            forceRedirect('/admin');
          }, 1000);
        }
        
        // Chama o callback de sucesso se fornecido
        if (onSuccess) {
          onSuccess();
        }
      });
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextTab = async () => {
    if (isLoading) return;
    
    await handleUpdateAgent(() => {
      if (activeTab === 'identidade') {
        setActiveTab('empresa');
      } else if (activeTab === 'empresa') {
        setActiveTab('comportamento');
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Verificar se o nome do campo existe no formData
    if (!Object.prototype.hasOwnProperty.call(formData, name)) {
      console.warn(`[DEBUG] Campo ${name} não existe no formData. Verificar se o atributo "name" está correto no input.`);
    }
    
    setFormData(prev => {
      // Tratar campos numéricos
      if (['temperature', 'frequencyPenalty', 'presencePenalty', 'maxMessages', 'maxTokens', 'topP'].includes(name)) {
        const numericValue = type === 'range' ? parseFloat(value) : parseInt(value);
        return {
          ...prev,
          [name]: isNaN(numericValue) ? (name === 'topP' ? 1.0 : 0) : numericValue
        };
      }
      
      // Tratar campos select
      if (e.target.tagName.toLowerCase() === 'select') {
        // Se o valor for vazio, usar valor padrão para evitar campos vazios em selects
        const defaultValues: {[key: string]: string} = {
          'model': 'gpt-4',
          'language': 'pt',
          'timezone': 'America/Sao_Paulo',
          'voiceTone': 'formal',
          'companySector': 'tecnologia',
          'agentFunction': 'atendimento'
        };
        
        // Se o campo tiver um valor padrão e o valor atual for vazio, usar o valor padrão
        if (value === '' && defaultValues[name]) {
          return {
            ...prev,
            [name]: defaultValues[name]
          };
        }
      }
      
      // Se o valor for undefined ou null, usar string vazia
      const safeValue = value === null || value === undefined ? '' : value;
      
      return {
        ...prev,
        [name]: safeValue
      };
    });
  };

  // Função auxiliar para upload de imagem
  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrl
    }));
  };

  return (
    <div className="h-full bg-[#0F1115] text-gray-100 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
      {/* Header */}
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
          <h1 className="text-xl font-semibold">Editar Agente IA</h1>
          <p className="text-sm text-gray-400">Edite seu agente</p>
        </div>
      </div>

      {/* Agent Card */}
      <div className="p-6 pb-0">
        <div className="bg-[#1A1D24] rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                {formData.imageUrl ? (
                  <img 
                    src={formData.imageUrl.startsWith('/avatars') ? `/api${formData.imageUrl}` : formData.imageUrl} 
                    alt={formData.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback para usar apenas as iniciais se a imagem falhar
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = formData.name?.substring(0, 2).toUpperCase() || "AT";
                    }}
                  />
                ) : (
                  formData.name?.substring(0, 2).toUpperCase() || "AT"
                )}
              </div>
              <div>
                <h2 className="font-medium text-white">{formData.name || "Agente Teste"}</h2>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span>ID do Agente: {formData.assistantId}</span>
                  {formData.id && (
                    <button 
                      className="text-gray-400 hover:text-white"
                      onClick={() => {
                        navigator.clipboard.writeText(formData.id);
                        alert("ID copiado para a área de transferência!");
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400">0 mensagens trocadas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-[#0F1115] hover:bg-white transition-colors"
                onClick={() => editingAgent?.id && router.push(`/admin/chat/${editingAgent.id}`)}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-[#0F1115] hover:bg-white transition-colors"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
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
                  onImageUpload={handleImageUpload}
                  defaultImage={formData.imageUrl}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Nome do Agente <span className="text-red-500">*</span>
                </label>
                <Input
                  name="name"
                  placeholder="Ex: Bot de Atendimento"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-2 bg-[#1A1D24] border-gray-800 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Nome interno <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-400 mb-2">Não influencia no comportamento do Agente. Utilize para a sua organização.</p>
                <Input
                  name="internalName"
                  value={formData.internalName}
                  onChange={handleInputChange}
                  className="bg-[#1A1D24] border-gray-800 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Mensagem Inicial <span className="text-red-500">*</span>
                </label>
                <Textarea
                  name="initialMessage"
                  value={formData.initialMessage}
                  onChange={handleInputChange}
                  placeholder="Mensagem que o agente enviará ao iniciar uma conversa"
                  className="mt-2 bg-[#1A1D24] border-gray-800 text-white"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Tom de Voz <span className="text-red-500">*</span>
                </label>
                <select
                  name="voiceTone"
                  value={formData.voiceTone}
                  onChange={handleInputChange}
                  className="w-full mt-2 px-3 py-2 bg-[#1A1D24] border border-gray-800 rounded-md text-white"
                >
                  <option value="">Selecione um tom de voz</option>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="amigavel">Amigável</option>
                  <option value="profissional">Profissional</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Modelo do Agente <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-400 mb-2">Selecione o modelo do Agente para geração da resposta</p>
                <select
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="w-full mt-2 px-3 py-2 bg-[#1A1D24] border border-gray-800 rounded-md text-white"
                >
                  <option value="">Selecione um modelo</option>
                  <option value="gpt-4o">gpt-4o - Modelo mais recente e eficiente, totalmente compatível com File Search</option>
                  <option value="gpt-4o-mini">gpt-4o-mini - Compatível, porém com relatos de desempenho inconsistente</option>
                  <option value="gpt-4-turbo">gpt-4-turbo - Inclui versões preview compatíveis</option>
                </select>
                <p className="text-sm text-gray-400 mt-1">TPS = Tokens por segundo</p>
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Idioma <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-400 mb-2">Selecione o idioma do Agente para geração da resposta</p>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full mt-2 px-3 py-2 bg-[#1A1D24] border border-gray-800 rounded-md text-white"
                >
                  <option value="">Selecione um idioma</option>
                  <option value="deteccao">Detecção Automática</option>
                  <option value="pt">Português</option>
                  <option value="en">Inglês</option>
                  <option value="es">Espanhol</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Timezone <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-400 mb-2">Selecione o timezone do Agente para geração da resposta</p>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="w-full mt-2 px-3 py-2 bg-[#1A1D24] border border-gray-800 rounded-md text-white"
                >
                  <option value="">Selecione um timezone</option>
                  <option value="America/Sao_Paulo">São Paulo (GMT -3)</option>
                  <option value="America/New_York">New York (GMT -5)</option>
                  <option value="Europe/London">London (GMT +0)</option>
                  <option value="Asia/Tokyo">Tokyo (GMT +9)</option>
                </select>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleNextTab}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Atualizando agente...</span>
                    </div>
                  ) : (
                    'Atualizar e Avançar'
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
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Ex: TechSolutions Brasil"
                  className="mt-2 bg-[#1A1D24] border-gray-800 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Setor <span className="text-red-500">*</span>
                </label>
                <select
                  name="companySector"
                  value={formData.companySector}
                  onChange={handleInputChange}
                  className="w-full mt-2 px-3 py-2 bg-[#1A1D24] border border-gray-800 rounded-md text-white"
                >
                  <option value="">Selecione um setor</option>
                  <option value="tecnologia">Tecnologia</option>
                  <option value="saude">Saúde</option>
                  <option value="educacao">Educação</option>
                  <option value="varejo">Varejo</option>
                  <option value="servicos">Serviços</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Website <span className="text-red-500">*</span>
                </label>
                <Input
                  name="companyWebsite"
                  value={formData.companyWebsite}
                  onChange={handleInputChange}
                  placeholder="Ex: https://www.empresa.com.br (Caso não tenha site, pode inserir alguma rede social)"
                  className="mt-2 bg-[#1A1D24] border-gray-800 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Descrição da Empresa <span className="text-red-500">*</span>
                </label>
                <Textarea
                  name="companyDescription"
                  value={formData.companyDescription}
                  onChange={handleInputChange}
                  placeholder="Descreva sua empresa, produtos e serviços"
                  className="mt-2 bg-[#1A1D24] border-gray-800 text-white"
                  rows={4}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleNextTab}
                  className="bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Atualizando agente...</span>
                    </div>
                  ) : (
                    'Atualizar e Avançar'
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
                  name="personalityObjective"
                  value={formData.personalityObjective}
                  onChange={handleInputChange}
                  placeholder="Defina o objetivo e a personalidade do agente"
                  className="mt-2 bg-[#1A1D24] border-gray-800 text-white"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Habilidades <span className="text-red-500">*</span>
                </label>
                <Textarea
                  name="agentSkills"
                  value={formData.agentSkills}
                  onChange={handleInputChange}
                  placeholder="Liste as habilidades do agente"
                  className="mt-2 bg-[#1A1D24] border-gray-800 text-white"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Função Principal <span className="text-red-500">*</span>
                </label>
                <select
                  name="agentFunction"
                  value={formData.agentFunction}
                  onChange={handleInputChange}
                  className="w-full mt-2 px-3 py-2 bg-[#1A1D24] border border-gray-800 rounded-md text-white"
                >
                  <option value="">Selecionar</option>
                  <option value="atendimento">Atendimento ao Cliente</option>
                  <option value="vendas">Vendas</option>
                  <option value="suporte">Suporte Técnico</option>
                  <option value="educacao">Educação</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Informações do Produto
                </label>
                <Textarea
                  name="productInfo"
                  value={formData.productInfo}
                  onChange={handleInputChange}
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
                  name="restrictions"
                  value={formData.restrictions}
                  onChange={handleInputChange}
                  placeholder="Liste o que o agente NÃO deve fazer"
                  className="mt-2 bg-[#1A1D24] border-gray-800 text-white"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white">
                  Armazenamento de Vetores
                </label>
                <p className="text-sm text-gray-400 mb-2">Selecione um armazenamento de vetores para vincular ao agente</p>
                <select
                  name="vectorStoreId"
                  value={formData.vectorStoreId}
                  onChange={handleInputChange}
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
                          name="temperature"
                          min="0"
                          max="1"
                          step="0.1"
                          value={formData.temperature}
                          onChange={handleInputChange}
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
                          name="topP"
                          min="0"
                          max="1"
                          step="0.1"
                          value={formData.topP || 1.0}
                          onChange={handleInputChange}
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
                {updateSuccess && activeTab === 'comportamento' && (
                  <div className="flex flex-col items-end gap-2 w-full">
                    <div className="bg-green-600 text-white px-4 py-2 rounded-md mb-2 w-full text-center">
                      Agente atualizado com sucesso! Redirecionando...
                    </div>
                    <Button
                      onClick={() => forceRedirect('/admin')}
                      className="bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
                    >
                      Clique aqui se não for redirecionado automaticamente
                    </Button>
                  </div>
                )}
                {(!updateSuccess || activeTab !== 'comportamento') && (
                  <Button
                    onClick={() => {
                      handleUpdateAgent(() => {
                        setTimeout(() => {
                          forceRedirect('/admin');
                        }, 1000);
                      });
                    }}
                    className="bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Atualizando agente...</span>
                      </div>
                    ) : (
                      'Atualizar Agente'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 
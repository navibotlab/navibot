'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Check, KeyRound, Settings, Edit, Trash2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interface para a configuração
interface ConfigDetails {
  id: string;
  key: string;
  lastUpdated: string;
}

export default function IntegracoesPage() {
  const [isOpenAIModalOpen, setIsOpenAIModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [openAIKey, setOpenAIKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [configDetails, setConfigDetails] = useState<ConfigDetails | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingCurrentKey, setLoadingCurrentKey] = useState(false);
  const { toast } = useToast();

  const handleSaveOpenAIKey = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/integrations/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: openAIKey }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Configuração salva",
          description: "A integração com a OpenAI foi configurada com sucesso.",
          variant: "default",
        });
        setIsConfigured(true);
        setIsOpenAIModalOpen(false);
        checkConfiguration(); // Recarrega a configuração
      } else {
        toast({
          title: "Erro ao configurar",
          description: data.error || "Erro ao salvar a chave da API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao salvar API Key:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/integrations/openai/delete', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Configuração excluída",
          description: "A integração com a OpenAI foi removida com sucesso.",
          variant: "default",
        });
        setIsConfigured(false);
        setConfigDetails(null);
        setIsDeleteModalOpen(false);
      } else {
        toast({
          title: "Erro ao excluir",
          description: data.error || "Erro ao excluir a configuração",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao excluir configuração:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = async () => {
    try {
      setIsEditMode(true);
      setLoadingCurrentKey(true);
      
      // Buscar a chave completa da API
      const response = await fetch('/api/integrations/openai/key');
      const data = await response.json();
      
      if (response.ok && data.key) {
        setOpenAIKey(data.key);
      } else {
        setOpenAIKey('');
        toast({
          title: "Aviso",
          description: "Não foi possível recuperar a chave atual. Por favor, insira uma nova.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Erro ao obter chave atual:', error);
      setOpenAIKey('');
    } finally {
      setLoadingCurrentKey(false);
      setIsOpenAIModalOpen(true);
    }
  };

    const checkConfiguration = async () => {
      try {
        const response = await fetch('/api/integrations/openai/check');
        const data = await response.json();
      
        if (response.ok) {
        setIsConfigured(data.configured);
        if (data.configured && data.config) {
          setConfigDetails(data.config);
        } else {
          setConfigDetails(null);
        }
        }
      } catch (error) {
        console.error('Erro ao verificar configuração:', error);
      }
    };

  useEffect(() => {
    checkConfiguration();
  }, []);

  useEffect(() => {
    if (!isOpenAIModalOpen) {
      setIsEditMode(false);
      setShowPassword(false);
    }
  }, [isOpenAIModalOpen]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Integrações</h1>
      <p className="text-gray-400 mb-6">Configure as integrações com serviços externos</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card OpenAI */}
        <Card className="bg-[#1A1D24] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-white text-md font-medium">OpenAI</CardTitle>
            {isConfigured ? (
              <div className="flex items-center gap-2 text-green-500">
                <Check size={16} />
                <span className="text-sm">Configurado</span>
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              Integre com a OpenAI para utilizar modelos de linguagem avançados
            </p>
            
            {isConfigured && configDetails ? (
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">API Key:</span>
                  <span className="text-sm font-mono">{configDetails.key}</span>
                </div>
                {configDetails.lastUpdated && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Atualizado:</span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(configDetails.lastUpdated), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
            ) : null}
            
            <div className="flex space-x-2">
              {isConfigured ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 bg-[#1A1D24] text-gray-400 hover:bg-blue-900 hover:text-white border-gray-700"
                    onClick={handleEditClick}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-[#1A1D24] text-gray-400 hover:bg-red-900 hover:text-white border-gray-700"
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </>
              ) : (
            <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
              onClick={() => setIsOpenAIModalOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurar
            </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card Claude AI (Em breve) */}
        <Card className="bg-[#1A1D24] border-gray-800 opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-white text-md font-medium">Claude AI</CardTitle>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">em breve</span>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              Integre com o Claude AI da Anthropic
            </p>
            <Button variant="outline" className="w-full" disabled>
              <Settings className="w-4 h-4 mr-2" />
              Configurar
            </Button>
          </CardContent>
        </Card>

        {/* Card Mistral AI (Em breve) */}
        <Card className="bg-[#1A1D24] border-gray-800 opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-white text-md font-medium">Mistral AI</CardTitle>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">em breve</span>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              Integre com os modelos da Mistral AI
            </p>
            <Button variant="outline" className="w-full" disabled>
              <Settings className="w-4 h-4 mr-2" />
              Configurar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Configuração OpenAI */}
      <Dialog open={isOpenAIModalOpen} onOpenChange={setIsOpenAIModalOpen}>
        <DialogContent className="bg-[#1A1D24] border-gray-800">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Configuração OpenAI" : "Configurar OpenAI"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {isEditMode 
                ? "Você pode alterar a chave de API atual para uma nova." 
                : "Insira sua chave de API para conectar-se à OpenAI."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                API Key da OpenAI
              </label>
              <div className="relative">
              <Input
                  type={showPassword ? "text" : "password"}
                placeholder="sk-..."
                value={openAIKey}
                onChange={(e) => setOpenAIKey(e.target.value)}
                  className="bg-[#0F1115] border-gray-800 pr-10"
                  disabled={loadingCurrentKey}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline mt-2 inline-block"
              >
                Encontre sua API Key no painel da OpenAI
              </a>
            </div>
            <Button 
              onClick={handleSaveOpenAIKey}
              disabled={!openAIKey || isLoading || loadingCurrentKey}
              className="w-full bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-700"
            >
              {isLoading ? 'Salvando...' : (loadingCurrentKey ? 'Carregando...' : 'Salvar')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-[#1A1D24] border-gray-800">
          <DialogHeader>
            <DialogTitle>Excluir Configuração</DialogTitle>
            <DialogDescription className="text-gray-400">
              Tem certeza que deseja excluir a configuração da OpenAI? 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1 sm:flex-none"
              disabled={isLoading}
              onClick={handleDeleteConfig}
            >
              {isLoading ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
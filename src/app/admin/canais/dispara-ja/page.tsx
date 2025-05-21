'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Plus, RefreshCw, Filter, RotateCw, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Agent } from '@/types/agent';
import { DisparaJaConnection } from './types';
import ConnectionsList from './components/ConnectionsList';
import ConnectionForm from './components/ConnectionForm';
import Tutorial from './components/Tutorial';
import { Spinner } from '@/components/ui/spinner';
import { verifyAllConnections } from './utils/connection-status';
import { QRCodeGenerator } from "./components/QRCodeGenerator";
import { safeLog, maskSensitiveData } from '@/lib/utils/security';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function DisparaJaPage() {
  // Função auxiliar local para logs de erro
  const logError = (message: string, error: any) => {
    console.error(message, error instanceof Error ? error.message : error);
  };

  // Função auxiliar local para logs seguros com parâmetro obrigatório
  const logSafe = (message: string, data: object = {}) => {
    console.log(message, maskSensitiveData(data));
  };

  const [agents, setAgents] = useState<Agent[]>([]);
  const [connections, setConnections] = useState<DisparaJaConnection[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingConnection, setEditingConnection] = useState<DisparaJaConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  
  // Estado para o QR code generator
  const [showQrCode, setShowQrCode] = useState(false);
  const [currentSecret, setCurrentSecret] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');

  // Carregar dados dos agentes e conexões
  useEffect(() => {
    fetchData();
    
    // Configurar verificação periódica a cada minuto
    const intervalId = setInterval(() => {
      fetchConnectionsAndVerifyStatus();
    }, 60000); // 60 segundos
    
    // Event listener para o evento personalizado de exibir QR code
    const handleShowQrCodeEvent = (event: CustomEvent<{ secret: string; agentId: string }>) => {
      handleShowQrCode(event.detail.secret, event.detail.agentId);
    };
    
    // Adicionar event listener
    window.addEventListener('disparaja:showqrcode', handleShowQrCodeEvent as EventListener);
    
    // Limpar intervalo e event listener quando o componente for desmontado
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('disparaja:showqrcode', handleShowQrCodeEvent as EventListener);
    };
  }, []);

  // Função para buscar os dados
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar agentes
      const agentsResponse = await fetch('/api/agents');
      if (!agentsResponse.ok) throw new Error('Falha ao carregar agentes');
      const agentsData = await agentsResponse.json();
      setAgents(agentsData);

      // Buscar conexões Dispara Já e verificar status
      await fetchConnectionsAndVerifyStatus();
    } catch (error) {
      logError('Erro ao carregar dados', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para atualizar apenas as conexões e verificar status
  const fetchConnectionsAndVerifyStatus = async () => {
    try {
      const connectionsResponse = await fetch('/api/dispara-ja/connections');
      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json();
        
        // Verificar status atual de todas as conexões
        const verifiedConnections = await verifyAllConnections(connectionsData);
        setConnections(verifiedConnections);
        
        // Atualizar as conexões no servidor com os status verificados
        updateConnectionsStatus(verifiedConnections);
      }
    } catch (error) {
      logError('Erro ao atualizar conexões', error);
    }
  };
  
  // Função para atualizar o status das conexões no servidor
  const updateConnectionsStatus = async (updatedConnections: DisparaJaConnection[]) => {
    try {
      // Filtra apenas conexões que tiveram seu status alterado
      // Para isso, seria necessário ter o estado anterior das conexões
      // Como isso não é possível neste componente, vamos enviar todas as conexões
      // mas logar quantas conexões estão sendo atualizadas
      
      logSafe('[DisparaJá UI] Atualizando status de conexões', { count: updatedConnections.length });
      
      const updateResponse = await fetch('/api/dispara-ja/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connections: updatedConnections }),
      });
      
      if (updateResponse.ok) {
        const result = await updateResponse.json();
        const successCount = result.results?.filter((r: any) => r.success).length || 0;
        logSafe('[DisparaJá UI] Status de conexões atualizado', { 
          success: successCount, 
          total: updatedConnections.length 
        });
      } else {
        logError('[DisparaJá UI] Erro ao atualizar status', await updateResponse.text());
      }
    } catch (error) {
      logError('[DisparaJá UI] Erro ao atualizar status no servidor', error);
    }
  };
  
  // Função para atualizar manualmente as conexões
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchConnectionsAndVerifyStatus();
      toast({
        title: 'Atualizado',
        description: 'Lista de conexões atualizada com sucesso.',
      });
    } catch (error) {
      logError('Erro ao atualizar conexões', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as conexões.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Função para abrir o formulário de nova conexão
  const handleNewConnection = () => {
    setIsEditing(false);
    setEditingConnection(null);
    setIsConfigOpen(true);
  };

  // Função para abrir o formulário de edição
  const handleEdit = (connection: DisparaJaConnection) => {
    setIsEditing(true);
    setEditingConnection(connection);
    setIsConfigOpen(true);
  };
  
  // Função para exibir o QR code de conexão
  const handleShowQrCode = (secret: string, agentId: string) => {
    setCurrentSecret(secret);
    setSelectedAgentId(agentId);
    setShowQrCode(true);
    setIsConfigOpen(false); // Fechar o modal de configuração
  };
  
  // Resetar o formulário
  const resetForm = () => {
    setCurrentSecret('');
    setSelectedAgentId('');
  };
  
  // Função para lidar com o sucesso da conexão
  const handleConnectionSuccess = async (connectionId: string, connectedPhoneNumber: string) => {
    // Atualizar a lista de conexões
    toast({
      title: "Sucesso",
      description: `Conexão estabelecida com número ${connectedPhoneNumber}`,
    });
    
    // Redefine os estados
    setShowQrCode(false);
    resetForm();
    
    // Tenta atualizar a lista de conexões com múltiplas tentativas
    logSafe('[DisparaJá UI] Conexão estabelecida', { 
      connectionId, 
      phoneNumber: connectedPhoneNumber ? connectedPhoneNumber.substring(0, 5) + '****' : 'N/A'
    });
    
    // Mostrar feedback visual de carregamento enquanto tenta atualizar
    setIsRefreshing(true);
    
    // Fazer 5 tentativas para atualizar a lista com intervalo de 2 segundos
    let attempt = 0;
    const maxAttempts = 5;
    
    const tryUpdate = async () => {
      try {
        logSafe(`[DisparaJá UI] Tentativa de atualizar lista`, { attempt: attempt + 1, maxAttempts });
        
        // Buscar diretamente o endpoint de conexões
        const response = await fetch('/api/dispara-ja/connections');
        if (!response.ok) {
          throw new Error(`Erro na requisição: ${response.status}`);
        }
        
        const data = await response.json();
        logSafe(`[DisparaJá UI] Conexões recebidas`, { count: data.length });
        
        // Verificar se a conexão recém-criada está na lista
        const found = data.some((conn: DisparaJaConnection) => conn.id === connectionId);
        
        if (found) {
          logSafe(`[DisparaJá UI] Conexão encontrada na lista`, { connectionId });
          
          // Atualizar a lista de conexões e verificar status
          const verifiedConnections = await verifyAllConnections(data);
          setConnections(verifiedConnections);
          
          logSafe(`[DisparaJá UI] Lista atualizada`, { attempt: attempt + 1 });
          setIsRefreshing(false);
          
          // Atualizar status no servidor
          updateConnectionsStatus(verifiedConnections);
          
          return; // Sai da função se encontrou
        } else {
          logSafe(`[DisparaJá UI] Conexão não encontrada ainda`, { attempt: attempt + 1 });
          
          // Incrementar tentativa e tentar novamente após delay
          attempt++;
          if (attempt < maxAttempts) {
            logSafe(`[DisparaJá UI] Tentando novamente`, { attempt: attempt + 1, maxAttempts });
            setTimeout(tryUpdate, 2000);
          } else {
            logSafe(`[DisparaJá UI] Número máximo de tentativas atingido`);
            setIsRefreshing(false);
          }
        }
      } catch (error) {
        logError('[DisparaJá UI] Erro ao atualizar lista após conexão', error);
        setIsRefreshing(false);
      }
    };
    
    // Inicia o processo de tentativas
    tryUpdate();
  };

  const filteredConnections = connections.filter(connection =>
    connection.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full">
      <div className="max-w-[1800px] mx-auto px-8">
        {/* Cabeçalho com título e botões principais */}
        <div className="flex items-center justify-between py-6">
          <h1 className="text-2xl font-bold text-white">DisparaJá</h1>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-gray-700 hover:bg-gray-800 h-10"
                    onClick={() => setIsTutorialOpen(true)}
                  >
                    <Play className="h-4 w-4 text-white" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver tutorial de configuração</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-500 h-10"
                    onClick={handleNewConnection}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Conexão
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Adicionar nova conexão DisparaJá</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Barra de ferramentas */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-700 hover:bg-gray-800 hover:text-white h-7 w-7"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filtrar conexões</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="relative w-64">
              <Search className="absolute left-3 top-1.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar conexões..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-[#1A1D24] border-gray-700 h-7 min-h-0"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-700 hover:bg-gray-800 hover:text-white h-7 w-7"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Atualizar lista</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : connections.length === 0 ? (
          <div className="rounded-lg border border-gray-800 p-6">
            <h3 className="text-white font-medium">Sem conexões</h3>
            <p className="text-gray-400">Nenhuma conexão DisparaJá foi encontrada.</p>
          </div>
        ) : (
          <ConnectionsList 
            connections={filteredConnections}
            onEdit={handleEdit}
            onRefresh={handleRefresh}
          />
        )}
      </div>

      {/* Modais */}
      <ConnectionForm
        isOpen={isConfigOpen}
        onOpenChange={setIsConfigOpen}
        agents={agents}
        onSuccess={handleRefresh}
        isEditing={isEditing}
        editingConnection={editingConnection}
      />

      <Tutorial
        isOpen={isTutorialOpen}
        onOpenChange={setIsTutorialOpen}
      />

      <QRCodeGenerator
        secret={currentSecret}
        agentId={selectedAgentId}
        onSuccess={handleConnectionSuccess}
        onClose={() => {
          setShowQrCode(false);
          resetForm();
        }}
        isOpen={showQrCode}
      />
    </div>
  );
} 
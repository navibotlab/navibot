'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Agent } from '@/types/agent';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Settings2, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';

// Interface para as conexões WhatsApp
interface WhatsappConnection {
  id: string;
  agentId: string;
  provider: string;
  instanceId: string;
  token: string;
  status: string;
  phoneNumber?: string;
  apiDomain?: string;
  createdAt: string;
  updatedAt: string;
  agent?: Agent;
}

const WhatsAppZAPIContent = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [connections, setConnections] = useState<WhatsappConnection[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [instanceId, setInstanceId] = useState('');
  const [token, setToken] = useState('');
  const [clientToken, setClientToken] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [apiDomain, setApiDomain] = useState('https://api.z-api.io');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar lista de agentes e conexões
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar agentes
        const agentsResponse = await fetch('/api/agents');
        if (!agentsResponse.ok) throw new Error('Falha ao carregar agentes');
        const agentsData = await agentsResponse.json();
        setAgents(agentsData);

        // Buscar conexões WhatsApp
        const connectionsResponse = await fetch('/api/whatsapp/zapi/connections');
        if (connectionsResponse.ok) {
          const connectionsData = await connectionsResponse.json();
          setConnections(connectionsData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados.',
          variant: 'destructive',
        });
      }
    };

    fetchData();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);

    try {
      const response = await fetch('/api/whatsapp/zapi/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: selectedAgent,
          instanceId,
          token,
          clientToken,
          phoneNumber,
          apiDomain
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Falha ao conectar com Z-API');
      }

      // Atualizar a lista de conexões
      const connectionsResponse = await fetch('/api/whatsapp/zapi/connections');
      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json();
        setConnections(connectionsData);
      }

      setIsConfigOpen(false);
      setIsEditing(false);
      setEditingConnectionId(null);
      resetForm();
      
      toast({
        title: 'Sucesso',
        description: isEditing 
          ? 'Conexão WhatsApp Z-API atualizada com sucesso!' 
          : 'WhatsApp Z-API conectado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível conectar ao WhatsApp Z-API.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Função para resetar o formulário
  const resetForm = () => {
    setSelectedAgent('');
    setInstanceId('');
    setToken('');
    setClientToken('');
    setPhoneNumber('');
    setApiDomain('https://api.z-api.io');
  };

  // Função para abrir o formulário de edição
  const handleEdit = (connection: WhatsappConnection) => {
    setIsEditing(true);
    setEditingConnectionId(connection.id);
    setSelectedAgent(connection.agentId);
    setInstanceId(connection.instanceId);
    setToken(connection.token);
    setPhoneNumber(connection.phoneNumber || '');
    setApiDomain(connection.apiDomain || 'https://api.z-api.io');
    setIsConfigOpen(true);
  };

  // Função para abrir o diálogo de nova conexão
  const handleNewConnection = () => {
    setIsEditing(false);
    setEditingConnectionId(null);
    resetForm();
    setIsConfigOpen(true);
  };

  const handleDisconnect = async (agentId: string) => {
    setIsDisconnecting(true);
    try {
      const response = await fetch('/api/whatsapp/zapi/connect', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falha ao desconectar');
      }

      // Atualizar a lista de conexões
      const connectionsResponse = await fetch('/api/whatsapp/zapi/connections');
      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json();
        setConnections(connectionsData);
      }

      toast({
        title: 'Sucesso',
        description: 'WhatsApp Z-API desconectado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível desconectar do WhatsApp Z-API.',
        variant: 'destructive',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Função para iniciar o processo de exclusão
  const handleDeleteRequest = (agentId: string) => {
    setConnectionToDelete(agentId);
    setDeleteConfirmText('');
    setIsDeleteDialogOpen(true);
  };

  // Função para confirmar e executar a exclusão
  const handleConfirmDelete = async () => {
    if (deleteConfirmText !== 'Delete' || !connectionToDelete) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const response = await fetch('/api/whatsapp/zapi/connect', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: connectionToDelete
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falha ao desconectar');
      }

      // Atualizar a lista de conexões
      const connectionsResponse = await fetch('/api/whatsapp/zapi/connections');
      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json();
        setConnections(connectionsData);
      }

      setIsDeleteDialogOpen(false);
      setConnectionToDelete(null);
      setDeleteConfirmText('');

      toast({
        title: 'Sucesso',
        description: 'WhatsApp Z-API desconectado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível desconectar do WhatsApp Z-API.',
        variant: 'destructive',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Função para obter o nome do agente pelo ID
  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : agentId;
  };

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">WhatsApp Z-API</h1>
        <Button onClick={handleNewConnection}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Conexão
        </Button>
      </div>

      <div className="bg-[#1A1D24] rounded-lg overflow-hidden">
        <div className="grid grid-cols-4 gap-4 p-4 font-medium text-gray-400 border-b border-gray-800">
          <div>Status</div>
          <div>Número do WA</div>
          <div>Nome do Agente</div>
          <div>Atualizado em</div>
        </div>

        {connections.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma conexão encontrada. Clique em "Nova Conexão" para adicionar.
          </div>
        ) : (
          connections.map((connection) => (
            <div key={connection.id} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-800 items-center">
              <div>
                {connection.status === 'CONNECTED' ? (
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-white">Ativo</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                    <span className="text-gray-400">Inativo</span>
                  </div>
                )}
              </div>
              <div className="text-white">{connection.phoneNumber || '-'}</div>
              <div className="text-white">{getAgentName(connection.agentId)}</div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{formatDate(connection.updatedAt)}</span>
                <div className="flex space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEdit(connection)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar Conexão</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-400"
                          onClick={() => handleDeleteRequest(connection.agentId)}
                          disabled={isDisconnecting}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Excluir Conexão</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isConfigOpen} onOpenChange={(open) => {
        if (!open) {
          resetForm();
          setIsEditing(false);
          setEditingConnectionId(null);
        }
        setIsConfigOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Conexão WhatsApp Z-API' : 'Configurar WhatsApp Z-API'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConnect} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Selecione o Agente
                <span className="text-red-500">*</span>
              </label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um agente" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Número do WhatsApp
                <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. 5511999999999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">Por favor, insira o número do WhatsApp.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Domínio da API
              </label>
              <Input
                placeholder="e.g. https://api.z-api.io"
                value={apiDomain}
                onChange={(e) => setApiDomain(e.target.value)}
              />
              <p className="text-xs text-gray-500">https://api.z-api.io</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Instance ID
                <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. 3DE1AE6BDF5EB08D2A86DE2FE557D1BB"
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Token
                <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. 8959D3A2A97"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Client Token
              </label>
              <Input
                placeholder="e.g. 123456789"
                value={clientToken}
                onChange={(e) => setClientToken(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={isConnecting} className="w-full">
              {isConnecting ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  {isEditing ? 'Atualizando...' : 'Conectando...'}
                </>
              ) : (
                isEditing ? 'Atualizar Conexão' : 'Conectar'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Conexão</DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. A conexão será removida permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Digite <span className="font-bold">Delete</span> para confirmar
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Delete"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteConfirmText !== 'Delete' || isDisconnecting}
            >
              {isDisconnecting ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Excluindo...
                </>
              ) : (
                'Excluir Conexão'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function WhatsAppZAPIPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
        <span className="ml-2">Carregando...</span>
      </div>
    }>
      <WhatsAppZAPIContent />
    </Suspense>
  );
} 
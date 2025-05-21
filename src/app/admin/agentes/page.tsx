'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { Filter, Search, RotateCw, Play } from 'lucide-react';
import { AgentCard } from '@/components/AgentCard';
import { Agent } from '@/types/agent';
import { CreateAgentForm } from '@/components/CreateAgentForm';
import { UpdateAgentForm } from '@/components/UpdateAgentForm';
import { DeleteAgentDialog } from '@/components/DeleteAgentDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import Tutorial from './components/Tutorial';

export default function AgentesPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [error, setError] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [showDeleteMultipleDialog, setShowDeleteMultipleDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Erro ao buscar agentes');
      const data = await response.json();
      setAgents(data);
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      setError(error.message);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar agente');
      }

      await fetchAgents();
      // Remover o agente da lista de selecionados se estiver lá
      setSelectedAgents(prev => prev.filter(id => id !== agentId));
    } catch (error: any) {
      console.error('Error deleting agent:', error);
      setError(error.message);
    }
  };

  const handleDeleteSelectedAgents = async () => {
    try {
      // Criar um array de promessas para deletar cada agente selecionado
      const deletePromises = selectedAgents.map(agentId => 
        fetch(`/api/agents/${agentId}`, {
          method: 'DELETE',
        })
      );

      // Executar todas as promessas
      await Promise.all(deletePromises);

      // Atualizar a lista de agentes
      await fetchAgents();
      
      // Limpar a lista de agentes selecionados
      setSelectedAgents([]);
      
      // Fechar o diálogo de confirmação
      setShowDeleteMultipleDialog(false);
    } catch (error: any) {
      console.error('Error deleting selected agents:', error);
      setError(error.message);
    }
  };

  const handleSelectAgent = (agentId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedAgents(prev => [...prev, agentId]);
    } else {
      setSelectedAgents(prev => prev.filter(id => id !== agentId));
    }
  };

  const handleEditAgent = async (formData: any, activeTab: string, onSuccess?: (data?: any) => void) => {
    if (!editingAgent) return;

    try {
      const response = await fetch(`/api/agents/${editingAgent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar agente');
      }

      const updatedAgent = await response.json();
      setAgents(agents.map(agent => 
        agent.id === editingAgent.id ? updatedAgent : agent
      ));
      
      if (onSuccess) {
        onSuccess(updatedAgent);
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const handleCreateAgent = async (formData: any, activeTab: string, onSuccess?: (data?: any) => void) => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar agente');
      }

      const newAgent = await response.json();
      
      // Atualiza a lista de agentes
      await fetchAgents();
      
      // Fecha o formulário
      setIsCreating(false);
      
      if (onSuccess) {
        onSuccess(newAgent);
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAgents();
    setIsRefreshing(false);
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mainContent = isCreating || editingAgent ? (
    <div className="h-full">
      {editingAgent ? (
        <UpdateAgentForm
          onSubmit={handleEditAgent}
          onCancel={() => {
            setEditingAgent(null);
          }}
          editingAgent={editingAgent}
        />
      ) : (
        <CreateAgentForm
          onSubmit={handleCreateAgent}
          onCancel={() => {
            setIsCreating(false);
          }}
        />
      )}
    </div>
  ) : (
    <div className="h-full">
      <div className="max-w-[1800px] mx-auto px-8">
        {/* Cabeçalho com título e botões principais */}
        <div className="flex items-center justify-between py-6">
          <h1 className="text-2xl font-bold text-white">Agentes</h1>
          <div className="flex gap-2">
            <TooltipProvider>
              {selectedAgents.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-red-800 text-red-500 hover:bg-red-950 hover:text-red-400"
                      onClick={() => setShowDeleteMultipleDialog(true)}
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Excluir Selecionados ({selectedAgents.length})
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Excluir agentes selecionados</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-700 bg-gray-800/40 text-gray-300 hover:bg-gray-700 hover:text-white mr-2"
                    onClick={() => setIsTutorialOpen(true)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver tutorial</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-500"
                    onClick={() => setIsCreating(true)}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Criar Agente
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Adicionar novo agente</p>
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
                  <p>Filtrar agentes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="relative w-64">
              <Search className="absolute left-3 top-1.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar agentes..."
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

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-800 text-red-100 rounded-lg">
            {error}
          </div>
        )}

        {agents.length === 0 ? (
          <div className="rounded-lg border border-gray-800 p-6">
            <h3 className="text-white font-medium">Sem agentes</h3>
            <p className="text-gray-400">Nenhum agente foi encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent: Agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={() => setEditingAgent(agent)}
                onDelete={() => handleDeleteAgent(agent.id)}
                isSelected={selectedAgents.includes(agent.id)}
                onSelect={handleSelectAgent}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tutorial Modal */}
      <Tutorial 
        isOpen={isTutorialOpen} 
        onOpenChange={setIsTutorialOpen} 
      />
    </div>
  );

  return (
    <div className="h-full">
      <main className="flex-1 overflow-y-auto">
        {mainContent}
      </main>

      <DeleteAgentDialog
        isOpen={showDeleteMultipleDialog}
        onClose={() => setShowDeleteMultipleDialog(false)}
        onConfirm={handleDeleteSelectedAgents}
        agentName={`${selectedAgents.length} agentes selecionados`}
        title="Excluir Agentes Selecionados"
        description="Tem certeza que deseja excluir todos os agentes selecionados? Esta ação não pode ser desfeita."
      />
    </div>
  );
} 
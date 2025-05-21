'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsAppCloudConfigModal } from '@/components/WhatsAppCloudConfigModal';
import { Plus, Filter, Search, RotateCw, Play } from 'lucide-react';
import { WhatsAppCloudConnectionsList } from "@/components/WhatsAppCloudConnectionsList";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { safeLog, safeErrorLog } from "@/lib/utils/security";
import Tutorial from './components/Tutorial';

interface WhatsAppConnection {
  id: string;
  phoneNumberId: string;
  accessToken: string;
  webhookUrl?: string;
  status: 'active' | 'inactive' | 'error';
  createdAt: string;
  updatedAt: string;
}

export default function WhatsAppCloudPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const handleRefreshConnections = async () => {
    try {
      setIsRefreshing(true);
      safeLog('Buscando conexões WhatsApp Cloud...', {});
      
      const response = await fetch('/api/whatsapp-cloud');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        safeErrorLog('Erro na resposta:', response.status, errorData);
        throw new Error(`Erro ao carregar conexões: ${response.status} ${errorData.error || ''}`);
      }
      
      const data = await response.json();
      safeLog('Conexões recebidas: quantidade:', { count: data.length });
      setConnections(data);
    } catch (error) {
      safeErrorLog('Erro ao carregar conexões:', error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  // Carregar conexões quando a página for montada
  useEffect(() => {
    handleRefreshConnections();
  }, []);

  const filteredConnections = connections.filter(connection =>
    connection.phoneNumberId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full">
      <div className="max-w-[1800px] mx-auto px-8">
        {/* Cabeçalho com título e botões principais */}
        <div className="flex items-center justify-between py-6">
          <h1 className="text-2xl font-bold text-white">WhatsApp Cloud API</h1>
          <div className="flex gap-2">
            <TooltipProvider>
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
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Conexão
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Adicionar nova conexão WhatsApp</p>
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
                    onClick={handleRefreshConnections}
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
            <p className="text-gray-400">Nenhuma conexão WhatsApp Cloud foi encontrada.</p>
          </div>
        ) : (
          <WhatsAppCloudConnectionsList 
            connections={filteredConnections} 
            onRefresh={handleRefreshConnections} 
          />
        )}
      </div>

      <WhatsAppCloudConfigModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          handleRefreshConnections();
        }}
      />
      
      {/* Tutorial Modal */}
      <Tutorial 
        isOpen={isTutorialOpen} 
        onOpenChange={setIsTutorialOpen} 
      />
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart3, MessageSquare, Users, Bot, PhoneCall } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface DashboardStats {
  agents: number;
  conversations: number;
  messages: number;
  connections: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats>({
    agents: 0,
    conversations: 0,
    messages: 0,
    connections: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Simulação de carregamento de dados - futuramente será substituído por API real
  useEffect(() => {
    // Função temporária para simular o carregamento de dados
    const simulateLoading = () => {
      setTimeout(() => {
        setStats({
          agents: 0,
          conversations: 0,
          messages: 0,
          connections: 0
        });
        setIsLoading(false);
      }, 1000);
    };

    simulateLoading();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner className="h-8 w-8 text-purple-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card de Agentes */}
          <Card className="bg-[#1A1D24] border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total de Agentes</p>
                <h3 className="text-3xl font-bold text-white mt-2">{stats.agents}</h3>
              </div>
              <div className="bg-blue-900/30 p-3 rounded-full">
                <Bot className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </Card>

          {/* Card de Conversas */}
          <Card className="bg-[#1A1D24] border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total de Conversas</p>
                <h3 className="text-3xl font-bold text-white mt-2">{stats.conversations}</h3>
              </div>
              <div className="bg-green-900/30 p-3 rounded-full">
                <MessageSquare className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </Card>

          {/* Card de Mensagens */}
          <Card className="bg-[#1A1D24] border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total de Mensagens</p>
                <h3 className="text-3xl font-bold text-white mt-2">{stats.messages}</h3>
              </div>
              <div className="bg-purple-900/30 p-3 rounded-full">
                <MessageSquare className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </Card>

          {/* Card de Conexões */}
          <Card className="bg-[#1A1D24] border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total de Conexões</p>
                <h3 className="text-3xl font-bold text-white mt-2">{stats.connections}</h3>
              </div>
              <div className="bg-yellow-900/30 p-3 rounded-full">
                <PhoneCall className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 
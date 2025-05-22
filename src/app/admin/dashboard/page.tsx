'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { MessageSquare, Bot, PhoneCall, Building } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  agents: number;
  conversations: number;
  messages: number;
  connections: number;
  workspace: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    agents: 0,
    conversations: 0,
    messages: 0,
    connections: 0,
    workspace: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Verificar autenticação
  useEffect(() => {
    async function checkAuthentication() {
      try {
        // Verificar autenticação usando a API de status
        const statusResponse = await fetch('/api/auth/status', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store' // Evitar cache
        });
        
        if (!statusResponse.ok) {
          console.error('Falha na verificação de status. Redirecionando para login...');
          router.replace('/login');
          return;
        }
        
        const statusData = await statusResponse.json();
        console.log('Status de autenticação:', statusData);
        
        if (!statusData.authenticated) {
          console.error('Não autenticado de acordo com a API de status.');
          router.replace('/login');
          return;
        }
        
        // Verificação adicional com a API de check
        const authResponse = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store' // Evitar cache
        });
        
        if (!authResponse.ok) {
          console.error('Falha na verificação de autenticação. Redirecionando para login...');
          router.replace('/login');
          return;
        }
        
        const authData = await authResponse.json();
        console.log('Resposta da verificação de autenticação:', authData);
        
        // Se o status da sessão NextAuth for unauthenticated, também redirecionar
        if (status === 'unauthenticated') {
          console.error('NextAuth indica não autenticado. Redirecionando para login...');
          router.replace('/login');
          return;
        }
        
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        router.replace('/login');
      }
    }
    
    checkAuthentication();
  }, [status, router]);

  // Carregar dados do dashboard
  useEffect(() => {
    if (!isCheckingAuth && status === 'authenticated') {
      // Simulação de carregamento de dados do dashboard
      const loadDashboardData = () => {
        setTimeout(() => {
          setStats({
            agents: Math.floor(Math.random() * 10),
            conversations: Math.floor(Math.random() * 100),
            messages: Math.floor(Math.random() * 1000),
            connections: Math.floor(Math.random() * 5),
            workspace: session?.user?.name || 'Meu Workspace'
          });
          setIsLoading(false);
        }, 1000);
      };

      loadDashboardData();
    }
  }, [isCheckingAuth, status, session]);

  // Mostrar um spinner enquanto carrega
  if (isCheckingAuth || status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-white">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Bem-vindo, {session?.user?.name || 'Usuário'}</p>
        </div>
        <div className="bg-blue-900/20 py-2 px-4 rounded-md flex items-center">
          <Building className="h-4 w-4 text-blue-400 mr-2" />
          <span className="text-blue-300 text-sm">{stats.workspace}</span>
        </div>
      </div>

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
    </div>
  );
}
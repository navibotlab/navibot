'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { UpdateAgentForm } from '@/components/UpdateAgentForm';
import { Agent } from '@/types/agent';

// Função auxiliar para garantir o redirecionamento
function forceRedirect(url: string) {
  // Tentar múltiplas abordagens para garantir o redirecionamento
  try {
    // Método 1: window.location.href
    window.location.href = url;
    
    // Método 2: window.location.replace (como fallback)
    setTimeout(() => {
      if (window.location.pathname !== url) {
        window.location.replace(url);
      }
    }, 500);
    
    // Método 3: último recurso
    setTimeout(() => {
      if (window.location.pathname !== url) {
        document.location.href = url;
      }
    }, 1000);
  } catch (error) {
    // Último recurso
    window.location.href = url;
  }
}

export default function EditAgentPage({ params }: { params: { id: string } }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAgent();
  }, []);

  const fetchAgent = async () => {
    try {
      // Abordagem 1: Buscar via API normal
      const response = await fetch(`/api/agents/${params.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao carregar agente');
        return;
      }

      const data = await response.json();
      
      if (!data || Object.keys(data).length === 0) {
        setError('Dados do agente inválidos');
        return;
      }

      // Clone profundo dos dados para evitar referências e garantir tipos
      const agentData: Agent = JSON.parse(JSON.stringify({
        id: data.id || '',
        name: data.name || '',
        internalName: data.internalName || '',
        imageUrl: data.imageUrl || '',
        initialMessage: data.initialMessage || '',
        voiceTone: data.voiceTone || '',
        model: data.model || 'gpt-4',
        language: data.language || 'pt',
        timezone: data.timezone || 'America/Sao_Paulo',
        instructions: data.instructions || '',
        temperature: typeof data.temperature === 'number' ? data.temperature : 0.7,
        frequencyPenalty: typeof data.frequencyPenalty === 'number' ? data.frequencyPenalty : 0,
        presencePenalty: typeof data.presencePenalty === 'number' ? data.presencePenalty : 0,
        topP: typeof data.topP === 'number' ? data.topP : 1.0,
        maxMessages: typeof data.maxMessages === 'number' ? data.maxMessages : 20,
        maxTokens: typeof data.maxTokens === 'number' ? data.maxTokens : 1000,
        responseFormat: data.responseFormat || '',
        companyName: data.companyName || '',
        companySector: data.companySector || '',
        companyWebsite: data.companyWebsite || '',
        companyDescription: data.companyDescription || '',
        personalityObjective: data.personalityObjective || '',
        agentSkills: data.agentSkills || '',
        agentFunction: data.agentFunction || '',
        productInfo: data.productInfo || '',
        restrictions: data.restrictions || '',
        assistantId: data.assistantId || '',
        vectorStoreId: data.vectorStoreId || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
      }));

      setAgent(agentData);
      setIsLoading(false);
    } catch (error) {
      setError('Erro ao carregar dados do agente: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleUpdateAgent = async (formData: any, activeTab: string, onSuccess?: (data?: any) => void) => {
    try {
      const response = await fetch(`/api/agents/${params.id}`, {
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
      
      if (onSuccess) {
        onSuccess(updatedAgent);
      }

      // Se estiver na última aba (comportamento), redireciona diretamente
      if (activeTab === 'comportamento') {
        // Adicionar um pequeno atraso para garantir que a atualização seja concluída
        setTimeout(() => {
          forceRedirect('/admin');
        }, 1000);
      }
    } catch (error) {
      // Capturar erro mas não exibir no console
    }
  };

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-500">Erro: {error}</div>
        <button 
          onClick={() => router.push('/admin/agentes')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Voltar para lista
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {agent ? (
        <UpdateAgentForm
          editingAgent={agent}
          onSubmit={async (updatedAgent, activeTab, onSuccess) => {
            try {
              const response = await fetch(`/api/agents/${params.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedAgent),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error('Erro ao atualizar agente');
              }

              const data = await response.json();
              
              if (onSuccess) {
                onSuccess(data);
              }
              
              router.push('/admin/agentes');
            } catch (error) {
              setError('Erro ao atualizar agente');
            }
          }}
          onCancel={() => router.push('/admin/agentes')}
        />
      ) : (
        <div>Carregando...</div>
      )}
    </div>
  );
} 
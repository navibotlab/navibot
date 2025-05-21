/**
 * Serviços de API para operações de negócios no CRM
 */

import { useSession } from 'next-auth/react';
import { useToast } from "@/components/ui/use-toast";

// Cache para controlar exclusões já realizadas e evitar duplicações
const deletionCache = new Set<string>();

/**
 * Tenta encontrar o ID de business relacionado a um leadId
 * @param leadId ID do lead para buscar o business relacionado
 * @returns Promise com o ID do business, ou null se não encontrado
 */
async function findBusinessIdByLeadId(leadId: string, workspaceId: string): Promise<string | null> {
  console.log(`🔍 Service: Buscando ID de business para o lead: ${leadId}`);
  
  try {
    // Tentar buscar o business pelo leadId
    const response = await fetch(`/api/crm/leads/${leadId}/business`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': workspaceId
      }
    });
    
    if (!response.ok) {
      console.error(`Erro ao buscar business pelo leadId: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    if (data && data.businessId) {
      console.log(`✅ Business encontrado para leadId ${leadId}: ${data.businessId}`);
      return data.businessId;
    }
    
    console.log(`❌ Nenhum business encontrado para leadId ${leadId}`);
    return null;
  } catch (error) {
    console.error(`Erro ao buscar business pelo leadId: ${error}`);
    return null;
  }
}

/**
 * Exclui um negócio pelo ID
 * @param businessId ID do negócio a ser excluído
 * @returns Promise com a resposta da operação
 */
export async function deleteBusinessById(businessId: string): Promise<any> {
  console.log('🔧 NOVA VERSÃO - Service: deleteBusinessById chamado com ID:', businessId);
  
  // Verificar se esta exclusão já foi processada recentemente
  if (deletionCache.has(businessId)) {
    console.log(`🔄 Ignorando exclusão duplicada para ID: ${businessId}`);
    // Retornar resposta de sucesso simulada para não quebrar o fluxo
    return { success: true, message: "Negócio já excluído", id: businessId };
  }
  
  // Adicionar ao cache para evitar duplicações
  deletionCache.add(businessId);
  
  // Limpar o cache após 5 segundos para permitir novas exclusões no futuro
  setTimeout(() => {
    deletionCache.delete(businessId);
  }, 5000);
  
  if (!businessId || typeof businessId !== 'string') {
    throw new Error('ID de negócio inválido ou não fornecido');
  }
  
  try {
    // Obtendo workspaceId para a requisição
    let workspaceId: string | undefined;
    
    // Tentar obter da API de sessão primeiro
    try {
      const sessionResponse = await fetch('/api/auth/session');
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        workspaceId = session.user?.workspaceId;
      }
    } catch (e) {
      console.warn('Não foi possível obter workspaceId da sessão, tentando localStorage');
    }
    
    // Tentar obter workspaceId de localStorage como fallback
    if (!workspaceId) {
      try {
        const storedSession = localStorage.getItem('next-auth.session-token');
        if (storedSession) {
          const sessionData = JSON.parse(storedSession);
          workspaceId = sessionData.user?.workspaceId;
        }
      } catch (e) {
        console.warn('Não foi possível obter workspaceId do localStorage');
      }
    }
    
    if (!workspaceId) {
      console.error('Erro: workspaceId não encontrado para execução da operação');
      throw new Error('Workspace não identificado. Tente fazer login novamente.');
    }
    
    // Chamar diretamente a API para excluir o negócio pelo businessId - DIRETAMENTE
    console.log(`🔧 NOVA VERSÃO - Service: Enviando requisição para excluir negócio: /api/crm/business/${businessId}`);
    const response = await fetch(`/api/crm/business/${businessId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': workspaceId
      }
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Erro ao excluir negócio: ${response.status} ${response.statusText}`);
      console.error("Resposta de erro completa:", errorData);
      
      // Tentar fazer parse do JSON da resposta
      let errorMessage = `Falha ao excluir negócio: ${response.statusText}`;
      try {
        const jsonError = JSON.parse(errorData);
        if (jsonError.error) {
          errorMessage = jsonError.error;
        }
      } catch (parseError) {
        if (errorData) {
          errorMessage = errorData;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log('🎉 NOVA VERSÃO - Negócio excluído com sucesso:', result);
    
    return result;
  } catch (error) {
    console.error('⚠️ Erro ao excluir negócio:', error);
    throw error;
  }
}

// Função para buscar estágios do pipeline com leads inclusos
export async function fetchPipelineStages(originId?: string, includeLeads = true) {
  try {
    const url = `/api/crm/stages${originId ? `?originId=${originId}` : ''}${includeLeads ? '&includeLeads=true' : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar estágios: ${response.status}`);
    }
    
    const data = await response.json();
    return data.stages || [];
  } catch (error) {
    console.error('Erro ao buscar estágios do pipeline:', error);
    throw error;
  }
}

// Função para buscar um negócio pelo ID
export async function getBusinessById(businessId: string) {
  try {
    if (!businessId) {
      throw new Error('ID do negócio não fornecido');
    }
    
    const response = await fetch(`/api/crm/business/${businessId}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar negócio: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar negócio ${businessId}:`, error);
    throw error;
  }
}

// Função para mover um negócio entre estágios
export async function moveBusinessToStage(businessId: string, stageId: string) {
  try {
    if (!businessId || !stageId) {
      throw new Error('ID do negócio ou do estágio não fornecido');
    }
    
    console.log(`Movendo negócio ${businessId} para o estágio ${stageId}`);
    
    // Obter workspace ID
    let workspaceId: string | undefined;
    
    // Tentar obter da API de sessão
    try {
      const sessionResponse = await fetch('/api/auth/session');
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        workspaceId = session.user?.workspaceId;
      }
    } catch (e) {
      console.warn('Não foi possível obter workspaceId da sessão, tentando localStorage');
    }
    
    // Fallback para localStorage
    if (!workspaceId) {
      try {
        const storedSession = localStorage.getItem('next-auth.session-token');
        if (storedSession) {
          const sessionData = JSON.parse(storedSession);
          workspaceId = sessionData.user?.workspaceId;
        }
      } catch (e) {
        console.warn('Não foi possível obter workspaceId do localStorage');
      }
    }
    
    if (!workspaceId) {
      workspaceId = 'ws_default'; // Usar valor padrão como último recurso
      console.warn('Usando workspaceId padrão: ws_default');
    }
    
    // Registra a ação que será realizada para depuração
    console.log(`Enviando requisição: MOVER negócio ${businessId} para estágio ${stageId} na workspace ${workspaceId}`);
    
    const response = await fetch(`/api/crm/business/${businessId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': workspaceId
      },
      body: JSON.stringify({
        stageId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Erro ao mover negócio: ${errorData}`);
      
      // Tentar analisar o erro se for JSON
      try {
        const errorJson = JSON.parse(errorData);
        throw new Error(errorJson.error || `Erro ao mover negócio: ${response.status}`);
      } catch (e) {
        // Se não for JSON, usar o texto bruto
        throw new Error(`Erro ao mover negócio: ${errorData}`);
      }
    }
    
    // Aguardar a resposta e registrar o resultado
    const result = await response.json();
    console.log('Negócio movido com sucesso para novo estágio:', result);
    
    return result;
  } catch (error) {
    console.error(`Erro ao mover negócio ${businessId} para estágio ${stageId}:`, error);
    throw error;
  }
}

// Função para atualizar um negócio
export async function updateBusiness(businessId: string, data: Record<string, any>) {
  try {
    if (!businessId) {
      throw new Error('ID do negócio não fornecido');
    }
    
    console.log(`Atualizando negócio ${businessId} com dados:`, data);
    
    const response = await fetch(`/api/crm/business/${businessId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar negócio: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao atualizar negócio ${businessId}:`, error);
    throw error;
  }
}

// Função para criar um novo negócio
export async function createBusiness(data: Record<string, any>) {
  try {
    console.log('Criando novo negócio com dados:', data);
    
    const response = await fetch('/api/crm/business', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao criar negócio: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao criar negócio:', error);
    throw error;
  }
}

// Função para buscar tags disponíveis
export async function fetchTags() {
  try {
    const response = await fetch('/api/contact-tags');
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar tags: ${response.status}`);
    }
    
    const data = await response.json();
    return data.tags || [];
  } catch (error) {
    console.error('Erro ao buscar tags:', error);
    throw error;
  }
}

// Função para buscar usuários da workspace (para proprietários de negócios)
export async function fetchWorkspaceUsers() {
  try {
    const response = await fetch('/api/workspace/users');
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar usuários: ${response.status}`);
    }
    
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error('Erro ao buscar usuários da workspace:', error);
    throw error;
  }
} 
import { v4 as uuidv4 } from 'uuid';
import { Label } from '../components/LabelsList';

// Adaptar dados retornados da API para o formato esperado pelo frontend
function adaptApiTagToLabel(tag: any): Label {
  console.log("Adaptando tag:", tag);
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    usageCount: tag.usageCount || tag.leads?.length || 0, // Contagem de uso vinda diretamente da API ou calculada pelo frontend
    createdAt: tag.createdAt || new Date().toISOString(),
  };
}

// Controle para evitar loop infinito de requisições
let retryCount = 0;
const MAX_RETRIES = 3;
let isCurrentlyFetching = false;

// Função para obter todas as etiquetas
export async function getAllLabels(): Promise<Label[]> {
  console.log("Buscando todas as etiquetas...");

  // Se já estiver buscando, retorna array vazio para evitar chamadas paralelas
  if (isCurrentlyFetching) {
    console.log("Já existe uma requisição em andamento, aguardando...");
    return [];
  }

  // Se atingiu o limite de tentativas, retorne um array vazio e não tente mais
  if (retryCount >= MAX_RETRIES) {
    console.error(`Limite de ${MAX_RETRIES} tentativas atingido. Parando requisições.`);
    return [];
  }

  isCurrentlyFetching = true;
  
  try {
    const response = await fetch('/api/contact-tags', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Adicionar para garantir dados mais recentes
    });

    if (!response.ok) {
      throw new Error(`Falha ao buscar etiquetas: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Dados retornados da API:", data);
    
    if (!Array.isArray(data)) {
      console.error("Formato de resposta inválido. Esperava um array:", data);
      return [];
    }

    // Resetar contador de tentativas quando obtiver sucesso
    retryCount = 0;
    
    const labels = data.map(adaptApiTagToLabel);
    console.log("Etiquetas adaptadas:", labels);
    return labels;
  } catch (error) {
    console.error('Erro ao carregar etiquetas:', error);
    
    // Incrementar contador de tentativas apenas para erros de API
    retryCount++;
    console.log(`Tentativa ${retryCount}/${MAX_RETRIES} falhou`);
    
    // Fallback para localStorage se a API falhar (ajuda na transição)
    if (typeof window !== 'undefined') {
      const storedLabels = localStorage.getItem('navibot_labels');
      if (storedLabels) {
        try {
          console.log("Usando fallback do localStorage");
          return JSON.parse(storedLabels);
        } catch (e) {
          console.error("Erro ao analisar dados do localStorage:", e);
          return [];
        }
      }
    }
    
    return [];
  } finally {
    isCurrentlyFetching = false;
  }
}

// Função para criar uma nova etiqueta
export async function createLabel(data: { name: string; color: string }): Promise<Label> {
  try {
    console.log("Criando nova etiqueta:", data);
    
    // Validar dados de entrada
    if (!data.name || !data.color) {
      console.error("Dados de etiqueta inválidos:", data);
      throw new Error("Nome e cor da etiqueta são obrigatórios");
    }
    
    const response = await fetch('/api/contact-tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: data.name,
        color: data.color,
        description: '',
      }),
      cache: 'no-store',
    });

    const responseText = await response.text();
    console.log("Resposta da API (texto):", responseText);
    
    let errorData;
    let newTag;
    
    try {
      // Tentar fazer parse do JSON, se falhar, usar o texto como erro
      const responseData = responseText ? JSON.parse(responseText) : {};
      
      if (!response.ok) {
        errorData = responseData;
      } else {
        newTag = responseData;
      }
    } catch (parseError) {
      console.error("Erro ao fazer parse da resposta:", parseError);
      throw new Error(`Erro na resposta da API: ${responseText}`);
    }

    if (!response.ok) {
      const errorMessage = errorData?.error || `Falha ao criar etiqueta (status: ${response.status})`;
      console.error("Erro retornado pela API:", errorMessage);
      throw new Error(errorMessage);
    }

    console.log("Etiqueta criada com sucesso:", newTag);
    return adaptApiTagToLabel(newTag);
  } catch (error) {
    console.error('Erro ao criar etiqueta:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido ao criar etiqueta');
    }
  }
}

// Função para atualizar uma etiqueta existente
export async function updateLabel(id: string, data: { name: string; color: string }): Promise<Label | null> {
  try {
    console.log("Atualizando etiqueta:", id, data);
    const response = await fetch(`/api/contact-tags?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: data.name,
        color: data.color,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Falha ao atualizar etiqueta');
    }

    const updatedTag = await response.json();
    console.log("Etiqueta atualizada com sucesso:", updatedTag);
    return adaptApiTagToLabel(updatedTag);
  } catch (error) {
    console.error('Erro ao atualizar etiqueta:', error);
    throw error;
  }
}

// Função para excluir uma etiqueta
export async function deleteLabel(id: string): Promise<boolean> {
  try {
    console.log("Excluindo etiqueta:", id);
    const response = await fetch(`/api/contact-tags?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Falha ao excluir etiqueta');
    }

    console.log("Etiqueta excluída com sucesso");
    return true;
  } catch (error) {
    console.error('Erro ao excluir etiqueta:', error);
    throw error;
  }
}

// Função para pesquisar etiquetas
export async function searchLabels(searchTerm: string): Promise<Label[]> {
  console.log("Pesquisando etiquetas com termo:", searchTerm);
  // Primeiro buscamos todas as etiquetas 
  // (a API ainda não tem endpoint específico para busca)
  const labels = await getAllLabels();
  
  if (!searchTerm) return labels;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  const filteredLabels = labels.filter(label => 
    label.name.toLowerCase().includes(lowerSearchTerm) ||
    label.id.toLowerCase().includes(lowerSearchTerm)
  );
  
  console.log("Resultado da pesquisa:", filteredLabels);
  return filteredLabels;
} 
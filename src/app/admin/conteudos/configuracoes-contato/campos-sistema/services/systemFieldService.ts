import { api } from '@/lib/api';

// Interface para os campos do sistema
export interface SystemField {
  id: string;
  name: string;
  key: string;
  type: string;
  required: boolean;
  editable: boolean;
  options: string[];
  group: string;
  usageCount: number;
  description?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

// Interface para criação e atualização de campos
export interface SystemFieldInput {
  name: string;
  key: string;
  type: string;
  required?: boolean;
  editable?: boolean;
  options?: string[];
  group?: string;
  description?: string;
}

// Tipos de campos disponíveis
export enum FieldType {
  TEXT = "text",
  NUMBER = "number",
  BOOLEAN = "boolean",
  DATE = "date",
  DATETIME = "datetime",
  JSON = "json"
}

/**
 * Busca todos os campos do sistema
 */
export async function getAllSystemFields(): Promise<SystemField[]> {
  try {
    console.log("Iniciando busca de campos do sistema");
    const response = await fetch('/api/system-fields', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store' // Evitar cache para sempre buscar a versão mais recente
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resposta da API não foi bem-sucedida:", {
        status: response.status, 
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Erro ao carregar campos do sistema: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Campos do sistema obtidos com sucesso:", data.length);
    return data;
  } catch (error) {
    console.error('Erro ao buscar campos do sistema:', error);
    throw new Error('Não foi possível carregar os campos do sistema. Verifique sua conexão e tente novamente.');
  }
}

/**
 * Busca um campo do sistema específico pelo ID
 */
export async function getSystemFieldById(id: string): Promise<SystemField> {
  try {
    const response = await fetch(`/api/system-fields?id=${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Erro ao carregar campo do sistema');
    }
    
    return response.json();
  } catch (error) {
    console.error(`Erro ao buscar campo do sistema ${id}:`, error);
    throw new Error('Não foi possível carregar o campo do sistema');
  }
}

/**
 * Cria um novo campo do sistema
 */
export async function createSystemField(data: SystemFieldInput): Promise<SystemField> {
  try {
    console.log("Iniciando criação de campo do sistema:", data);
    
    // Validação básica antes de enviar para a API
    if (!data.name || !data.key || !data.type) {
      console.error("Dados inválidos para criação de campo:", data);
      throw new Error("Nome, identificador e tipo são obrigatórios");
    }
    
    const response = await fetch('/api/system-fields', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      cache: 'no-store'
    });
    
    const responseText = await response.text();
    console.log("Resposta da API:", responseText);
    
    let errorData;
    let responseData;
    
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
      if (!response.ok) {
        errorData = responseData;
      }
    } catch (parseError) {
      console.error("Erro ao processar resposta da API:", parseError);
      throw new Error(`Erro na resposta do servidor: ${responseText}`);
    }
    
    if (!response.ok) {
      const errorMessage = errorData?.error || `Erro ao criar campo do sistema: ${response.status} ${response.statusText}`;
      console.error("Erro retornado pela API:", errorMessage, errorData);
      throw new Error(errorMessage);
    }
    
    console.log("Campo do sistema criado com sucesso:", responseData);
    return responseData;
  } catch (error: any) {
    console.error('Erro ao criar campo do sistema:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido ao criar campo do sistema');
    }
  }
}

/**
 * Atualiza um campo do sistema existente
 */
export async function updateSystemField(id: string, data: SystemFieldInput): Promise<SystemField> {
  try {
    const response = await fetch(`/api/system-fields?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao atualizar campo do sistema');
    }
    
    return response.json();
  } catch (error: any) {
    console.error(`Erro ao atualizar campo do sistema ${id}:`, error);
    throw error;
  }
}

/**
 * Exclui um campo do sistema
 */
export async function deleteSystemField(id: string): Promise<boolean> {
  try {
    console.log(`Iniciando exclusão do campo com ID: ${id}`);
    
    if (!id) {
      throw new Error('ID do campo não fornecido para exclusão');
    }
    
    const response = await fetch(`/api/system-fields?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
    
    const responseText = await response.text();
    console.log(`Resposta da API para exclusão: ${responseText}`);
    
    let errorData;
    try {
      // Tentar fazer parse do JSON, se falhar, usar o texto como erro
      const responseData = responseText ? JSON.parse(responseText) : {};
      
      if (!response.ok) {
        errorData = responseData;
      } else if (responseData.success) {
        console.log(`Campo com ID ${id} excluído com sucesso`);
        return true;
      }
    } catch (parseError) {
      console.error("Erro ao processar resposta da API:", parseError);
      throw new Error(`Erro na resposta da API: ${responseText}`);
    }
    
    if (!response.ok) {
      const errorMessage = errorData?.error || `Falha ao excluir campo do sistema: ${response.status} ${response.statusText}`;
      console.error("Erro retornado pela API:", errorMessage);
      throw new Error(errorMessage);
    }
    
    return true;
  } catch (error: any) {
    console.error(`Erro ao excluir campo do sistema ${id}:`, error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido ao excluir campo do sistema');
    }
  }
}

/**
 * Pesquisa campos do sistema por termo
 */
export function searchSystemFields(fields: SystemField[], searchTerm: string): SystemField[] {
  if (!searchTerm.trim()) return fields;
  
  const term = searchTerm.toLowerCase();
  return fields.filter(field => 
    field.name.toLowerCase().includes(term) || 
    field.key.toLowerCase().includes(term) || 
    field.description?.toLowerCase().includes(term)
  );
}

/**
 * Inicializa os campos do sistema padrão se eles não existirem
 */
export async function initializeDefaultSystemFields(): Promise<void> {
  console.log("Iniciando verificação de campos padrão do sistema");
  
  try {
    // Tenta buscar os campos existentes
    let existingFields: SystemField[] = [];
    try {
      existingFields = await getAllSystemFields();
      console.log(`Encontrados ${existingFields.length} campos existentes`);
    } catch (error) {
      console.log('Nenhum campo existente encontrado, criando campos padrão');
    }
    
    const existingKeys = existingFields.map(field => field.key);
    let hasNew = false;
    let createdCount = 0;
    
    const defaultFields: SystemFieldInput[] = [
      {
        name: "Nome",
        key: "name",
        type: FieldType.TEXT,
        required: false,
        editable: false,
        group: "Informações Gerais",
        description: "Nome do contato"
      },
      {
        name: "Telefone",
        key: "phone",
        type: FieldType.NUMBER,
        required: true,
        editable: false,
        group: "Informações Gerais",
        description: "Número de telefone do contato (obrigatório para todos os contatos)"
      },
      {
        name: "Foto",
        key: "photo",
        type: FieldType.TEXT,
        required: false,
        editable: false,
        group: "Informações Gerais",
        description: "Foto do perfil do contato"
      },
      {
        name: "E-mail",
        key: "email",
        type: FieldType.TEXT,
        required: false,
        editable: false,
        group: "Informações Gerais",
        description: "Endereço de e-mail do contato"
      },
      {
        name: "Cargo",
        key: "position",
        type: FieldType.TEXT,
        required: false,
        editable: false,
        group: "Informações Gerais",
        description: "Cargo ou função do contato"
      },
      {
        name: "Profissão",
        key: "profession",
        type: FieldType.TEXT,
        required: false,
        editable: false,
        group: "Informações Gerais",
        description: "Profissão ou ocupação do contato"
      },
      {
        name: "Instagram",
        key: "instagram",
        type: FieldType.TEXT,
        required: false,
        editable: false,
        group: "Informações Gerais",
        description: "Perfil do Instagram do contato"
      }
    ];
    
    // Criar apenas os campos que não existem
    for (const field of defaultFields) {
      if (!existingKeys.includes(field.key)) {
        try {
          console.log(`Criando campo padrão: ${field.name} (${field.key})`);
          await createSystemField(field);
          createdCount++;
          hasNew = true;
        } catch (fieldError) {
          console.error(`Erro ao criar campo padrão ${field.name}:`, fieldError);
          // Continuar para o próximo campo mesmo se houver erro
        }
      }
    }
    
    if (hasNew) {
      console.log(`${createdCount} campos padrão inicializados com sucesso`);
    } else {
      console.log('Todos os campos padrão já existem, nenhum novo criado');
    }
  } catch (error) {
    console.error('Erro ao inicializar campos do sistema padrão:', error);
    // Não propagar o erro para permitir que a página seja carregada mesmo se falhar a inicialização
  }
} 
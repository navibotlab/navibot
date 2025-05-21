import { prisma } from '@/lib/prisma';

// Tipos de campos disponíveis
export enum FieldType {
  TEXT = "text",
  NUMBER = "number",
  BOOLEAN = "boolean",
  DATE = "date",
  DATETIME = "datetime",
  JSON = "json"
}

interface SystemFieldInput {
  name: string;
  key: string;
  type: string;
  required?: boolean;
  editable?: boolean;
  options?: string[];
  group?: string;
  description?: string;
}

/**
 * Cria os campos padrão do sistema para um workspace específico
 * 
 * Esta função é chamada quando uma requisição é feita à API e não existem campos
 * para o workspace atual. Ela cria os campos básicos necessários automaticamente.
 */
export async function initializeSystemFields(workspaceId: string): Promise<void> {
  console.log(`[SystemFields] Inicializando campos padrão para workspace: ${workspaceId}`);
  
  if (!workspaceId) {
    console.error('[SystemFields] Erro: workspaceId não fornecido');
    throw new Error('workspaceId é obrigatório para inicializar campos do sistema');
  }

  const defaultFields: SystemFieldInput[] = [
    {
      name: "Nome",
      key: "name",
      type: FieldType.TEXT,
      required: false,
      editable: false,
      description: "Nome do contato"
    },
    {
      name: "Telefone",
      key: "phone",
      type: FieldType.TEXT,
      required: true,
      editable: false,
      description: "Número de telefone do contato (obrigatório para todos os contatos)"
    },
    {
      name: "Foto",
      key: "photo",
      type: FieldType.TEXT,
      required: false,
      editable: false,
      description: "Foto do perfil do contato"
    },
    {
      name: "E-mail",
      key: "email",
      type: FieldType.TEXT,
      required: false,
      editable: false,
      description: "Endereço de e-mail do contato"
    },
    {
      name: "Cargo",
      key: "position",
      type: FieldType.TEXT,
      required: false,
      editable: false,
      description: "Cargo ou função do contato"
    },
    {
      name: "Profissão",
      key: "profession",
      type: FieldType.TEXT,
      required: false,
      editable: false,
      description: "Profissão ou ocupação do contato"
    },
    {
      name: "Instagram",
      key: "instagram",
      type: FieldType.TEXT,
      required: false,
      editable: false,
      description: "Perfil do Instagram do contato"
    }
  ];

  try {
    // Verifica se já existem campos para este workspace
    let existingFields = [];
    try {
      existingFields = await (prisma as any).system_fields.findMany({
        where: { workspaceId },
        select: { key: true }
      });
      
      console.log(`[SystemFields] Encontrados ${existingFields.length} campos existentes para workspace ${workspaceId}`);
    } catch (findError) {
      console.error('[SystemFields] Erro ao buscar campos existentes:', findError);
      // Continuar mesmo com erro, assumindo que não existem campos
      existingFields = [];
    }

    const existingKeys = existingFields.map((field: { key: string }) => field.key);
    let fieldsCreated = 0;
    let fieldsWithError = 0;

    // Cria apenas os campos que não existem
    for (const field of defaultFields) {
      if (!existingKeys.includes(field.key)) {
        try {
          console.log(`[SystemFields] Criando campo ${field.name} (${field.key}) para workspace ${workspaceId}`);
          
          await (prisma as any).system_fields.create({
            data: {
              id: `${field.key}_${workspaceId}`,
              ...field,
              workspaceId,
              options: field.options || [],
              group: field.group || 'Informações Gerais',
              updatedAt: new Date(),
              createdAt: new Date()
            }
          });
          
          fieldsCreated++;
          console.log(`[SystemFields] Campo ${field.key} criado com sucesso`);
        } catch (createError) {
          fieldsWithError++;
          console.error(`[SystemFields] Erro ao criar campo ${field.key}:`, createError);
          // Continue para o próximo campo mesmo com erro
        }
      }
    }

    console.log(`[SystemFields] Resultado da inicialização para workspace ${workspaceId}: ${fieldsCreated} criados, ${fieldsWithError} com erro`);
  } catch (error) {
    console.error('[SystemFields] Erro fatal ao inicializar campos padrão:', error);
    throw error;
  }
} 
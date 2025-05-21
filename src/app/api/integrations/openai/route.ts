import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { getWorkspaceFromContext } from '@/lib/utils/workspace'
import { v4 as uuidv4 } from 'uuid'

// Função para salvar a configuração no banco de dados
async function saveConfig(apiKey: string) {
  try {
    const { workspaceId } = await getWorkspaceFromContext();

    const existingConfig = await prisma.system_configs.findFirst({
      where: { 
        key: 'OPENAI_API_KEY',
        workspaceId
      }
    });

    if (existingConfig) {
      // Atualizar configuração existente
      await prisma.system_configs.update({
        where: { id: existingConfig.id },
        data: { value: apiKey }
      });
    } else {
      // Criar nova configuração
      await prisma.system_configs.create({
        data: {
          id: uuidv4(),
          key: 'OPENAI_API_KEY',
          value: apiKey,
          description: 'Chave da API da OpenAI',
          workspaceId,
          updatedAt: new Date()
        }
      });
    }
    
    console.log(`Configuração OpenAI salva para workspace: ${workspaceId}`);
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    throw error;
  }
}

// Função para ler a configuração do banco de dados
export async function readConfig(): Promise<any | null> {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    
    const config = await prisma.system_configs.findFirst({
      where: { 
        key: 'OPENAI_API_KEY',
        workspaceId
      }
    });
    
    console.log(`Configuração OpenAI para workspace ${workspaceId}: ${config ? 'encontrada' : 'não encontrada'}`);
    
    return config || null;
  } catch (error) {
    console.error('Erro ao ler configuração:', error);
    return null;
  }
}

// Obter o cliente OpenAI
export async function getOpenAIClient(): Promise<OpenAI | null> {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    console.log(`Obtendo cliente OpenAI para workspace: ${workspaceId}`);
    
    const config = await readConfig();
    const apiKey = config?.value;
    
    if (!apiKey) {
      throw new Error('OpenAI não configurada');
    }
    
    return new OpenAI({ apiKey });
  } catch (error) {
    console.error('Erro ao criar cliente OpenAI:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json();
    const { workspaceId } = await getWorkspaceFromContext();
    console.log(`Configurando OpenAI para workspace: ${workspaceId}`);

    // Validar a API key tentando criar uma instância do cliente OpenAI
    try {
      const client = new OpenAI({ apiKey });
      // Testar a conexão listando os modelos
      await client.models.list();
      
      // Se chegou aqui, a API key é válida
      // Salvar a configuração
      await saveConfig(apiKey);
    } catch (error) {
      return NextResponse.json(
        { error: 'API Key inválida' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao configurar OpenAI:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    console.log(`Verificando configuração OpenAI para workspace: ${workspaceId}`);
    
    const client = await getOpenAIClient();
    return NextResponse.json({ configured: !!client });
  } catch (error) {
    console.error('Erro ao verificar configuração:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar configuração' },
      { status: 500 }
    );
  }
} 
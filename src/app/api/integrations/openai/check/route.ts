import { NextResponse } from 'next/server'
import { getOpenAIClient, readConfig } from '../route'
import { getWorkspaceFromContext } from '@/lib/utils/workspace'

/**
 * Função para mascarar a chave da API, mantendo apenas os primeiros e últimos caracteres
 */
function maskApiKey(apiKey: string): string {
  if (!apiKey) return '';
  
  // Se a chave for muito curta, retorna apenas os primeiros caracteres
  if (apiKey.length < 10) return apiKey.substring(0, 3) + '...';
  
  // Mantém os primeiros 4 e últimos 4 caracteres, máscara o resto
  const firstPart = apiKey.substring(0, 4);
  const lastPart = apiKey.substring(apiKey.length - 4);
  return `${firstPart}...${lastPart}`;
}

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceFromContext();
    console.log(`Verificando cliente OpenAI para workspace: ${workspaceId}`);
    
    // Obter a configuração atual
    const config = await readConfig();
    const apiKey = config?.value;
    const configId = config?.id;
    
    // Se não houver configuração, retorna status não configurado
    if (!apiKey) {
      return NextResponse.json({ 
        ok: false, 
        error: 'API Key não configurada',
        configured: false 
      });
    }

    const client = await getOpenAIClient();
    if (!client) {
      return NextResponse.json({ 
        ok: false, 
        error: 'API Key não configurada',
        configured: false 
      });
    }

    try {
      // Testar a conexão
      await client.models.list();
      
      // Retorna status configurado + dados mascarados
      return NextResponse.json({ 
        ok: true, 
        configured: true,
        config: {
          id: configId,
          key: maskApiKey(apiKey),
          lastUpdated: config?.updatedAt
        }
      });
    } catch (error) {
      console.error('Erro ao verificar API OpenAI:', error);
      
      // Retorna erro, mas ainda considera configurado com a chave mascarada
      return NextResponse.json({ 
        ok: false, 
        error: 'API Key inválida',
        configured: true,
        config: {
          id: configId,
          key: maskApiKey(apiKey),
          lastUpdated: config?.updatedAt
        }
      });
    }
  } catch (error) {
    console.error('Erro na rota de verificação OpenAI:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro ao verificar configuração' },
      { status: 500 }
    );
  }
} 
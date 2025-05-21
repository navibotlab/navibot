import { NextResponse } from 'next/server'
import { getOpenAIClient } from '../route'
import { getWorkspaceFromContext } from '@/lib/utils/workspace'

const ALLOWED_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo'
]

export async function POST(request: Request) {
  try {
    const { model } = await request.json()
    const { workspaceId } = await getWorkspaceFromContext();
    console.log(`Validando modelo OpenAI para workspace: ${workspaceId}`);
    
    // Validar se o modelo é permitido
    if (!ALLOWED_MODELS.includes(model)) {
      return NextResponse.json(
        { error: 'Modelo não permitido' },
        { status: 400 }
      )
    }

    // Obter cliente OpenAI
    const openai = await getOpenAIClient()
    
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI não configurada' },
        { status: 400 }
      )
    }

    // Verificar se o modelo está disponível
    const models = await openai.models.list()
    const isAvailable = models.data.some(m => m.id === model)

    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Modelo não disponível na sua conta' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao validar modelo:', error)
    if (error.message === 'OpenAI não configurada') {
      return NextResponse.json(
        { error: 'Configure a integração com a OpenAI primeiro' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao validar modelo' },
      { status: 500 }
    )
  }
} 
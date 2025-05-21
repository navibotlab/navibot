import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const authCookie = cookies().get('auth')
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Aqui você pode adicionar mais verificações de autenticação
    // Por exemplo, verificar se o token é válido, se o usuário existe, etc.

    return NextResponse.json({ authenticated: true })
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar autenticação' },
      { status: 500 }
    )
  }
} 
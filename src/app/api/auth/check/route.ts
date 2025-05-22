import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Usar await com cookies() antes de chamar o método get
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth')
    
    // Verificar cookies do NextAuth também
    const nextAuthCookie = cookieStore.get('next-auth.session-token') ||
                          cookieStore.get('__Secure-next-auth.session-token')
    
    if (!authCookie && !nextAuthCookie) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Aqui você pode adicionar mais verificações de autenticação
    // Por exemplo, verificar se o token é válido, se o usuário existe, etc.

    return NextResponse.json({ 
      authenticated: true,
      authType: authCookie ? 'custom' : 'nextauth'
    })
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar autenticação' },
      { status: 500 }
    )
  }
} 
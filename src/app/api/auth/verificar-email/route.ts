import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { email, token } = await req.json()

    // Validações básicas
    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email e token são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar o usuário pelo email e token
    const user = await prisma.users.findFirst({
      where: {
        email,
        verifyToken: token,
        status: 'pending'
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      )
    }

    // Atualizar o usuário para ativo e limpar o token
    await prisma.users.update({
      where: { id: user.id },
      data: {
        status: 'active',
        verifyToken: null,
        emailVerified: new Date()
      }
    })

    return NextResponse.json({
      message: 'Email verificado com sucesso!'
    })
  } catch (error) {
    console.error('Erro ao verificar email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao verificar email' },
      { status: 500 }
    )
  }
} 
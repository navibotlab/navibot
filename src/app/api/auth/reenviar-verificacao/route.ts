import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/emailService'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe e ainda não foi verificado
    const user = await prisma.users.findFirst({
      where: {
        email,
        status: 'pending'
      }
    })

    if (!user) {
      // Não revelamos se o usuário existe ou não para evitar enumeração
      return NextResponse.json({
        message: 'Se seu email estiver cadastrado e não verificado, um novo código será enviado'
      })
    }

    // Gerar novo token de verificação
    const newVerifyToken = crypto.randomBytes(32).toString('hex')

    // Atualizar o token no banco de dados
    await prisma.users.update({
      where: { id: user.id },
      data: { verifyToken: newVerifyToken }
    })

    // Enviar email de verificação
    try {
      await sendVerificationEmail(email, newVerifyToken)
      console.log(`Email de verificação reenviado para ${email}`)
    } catch (emailError) {
      console.error('Erro ao reenviar email de verificação:', emailError)
      return NextResponse.json(
        { error: 'Erro ao enviar email de verificação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Um novo código de verificação foi enviado para seu email'
    })
  } catch (error) {
    console.error('Erro ao reenviar verificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao reenviar código de verificação' },
      { status: 500 }
    )
  }
} 
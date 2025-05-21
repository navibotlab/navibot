import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/emailService'

const DEFAULT_FREE_PLAN_ID = 'plan_free' // Certifique-se de usar o ID correto do seu plano gratuito

export async function POST(req: Request) {
  try {
    const { name, email, password, phone } = await req.json()

    // Validações básicas
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se o email já está em uso
    const existingUser = await prisma.users.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 409 }
      )
    }

    // Obter o plano gratuito
    const freePlan = await prisma.plan.findFirst({
      where: { 
        price: 0,
        // @ts-ignore - O campo isActive existe no modelo Plan mas não está definido no tipo PlanWhereInput
        isActive: true 
      }
    })

    if (!freePlan) {
      return NextResponse.json(
        { error: 'Plano gratuito não encontrado, entre em contato com o suporte' },
        { status: 500 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Gerar token de verificação
    const verifyToken = crypto.randomBytes(32).toString('hex')

    // Criar um workspace para o usuário
    const workspaceName = `${name.split(' ')[0]}'s Workspace`
    const subdomain = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')

    // Criar tudo em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar o workspace
      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          subdomain: subdomain,
        }
      })

      // 2. Criar o usuário
      // Nota: O campo 'phone' não está definido no schema do Prisma.
      // É necessário adicionar este campo ao schema antes de usá-lo.
      const userData = {
        name,
        email,
        password: hashedPassword,
        workspaceId: workspace.id,
        // @ts-ignore - O campo planId existe no modelo users mas não está definido no tipo usersCreateInput
        planId: freePlan.id,
        verifyToken,
        status: 'pending', // Pendente até a verificação do email
        role: 'admin' // Admin do próprio workspace
      }
      
      // Armazenamos o telefone em uma variável para uso futuro
      // quando o schema for atualizado para incluir o campo phone
      console.log('Telefone recebido:', phone || 'Não fornecido')
      
      const user = await tx.users.create({
        data: userData
      })

      return { user, workspace }
    })

    // Enviar email de verificação
    try {
      await sendVerificationEmail(email, verifyToken)
      console.log(`Email de verificação enviado para ${email}`)
    } catch (emailError) {
      console.error('Erro ao enviar email de verificação:', emailError)
      // Não falharemos a requisição por erro de email
    }

    return NextResponse.json({
      message: 'Usuário registrado com sucesso! Verifique seu email para ativar sua conta.',
      workspaceId: result.workspace.id,
    })
  } catch (error) {
    console.error('Erro no processo de registro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao criar usuário' },
      { status: 500 }
    )
  }
} 
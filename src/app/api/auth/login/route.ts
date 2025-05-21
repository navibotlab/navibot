import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma' // Importar a instância global do Prisma
import { safeLog, safeErrorLog } from '@/lib/utils/security'

// Adicionar indicador de dinâmico para resolver problemas com cookies
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    safeLog('Iniciando processo de login', {});
    
    // Validar se a requisição é JSON válido
    let body;
    try {
      body = await req.json()
    } catch (e) {
      return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
    }
    
    // Extrair e validar campos necessários
    const { email, password, remember } = body
    
    if (!email || !password) {
      safeLog('Dados de login incompletos', {});
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    }
    
    safeLog('Tentativa de login', { email }, ['email']);

    // Buscar usuário na tabela users (não mais AdminUser)
    const user = await prisma.users.findUnique({
      where: { email }
    })

    if (!user) {
      safeLog('Usuário não encontrado', { email }, ['email']);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    // Verificar se o usuário está ativo
    if (user.status !== 'active') {
      safeLog('Usuário não está ativo', { email, status: user.status }, ['email']);
      return NextResponse.json({ error: 'Conta inativa ou pendente. Entre em contato com o suporte.' }, { status: 401 })
    }

    safeLog('Usuário encontrado, verificando senha', { id: user.id, email: user.email }, ['email']);
    
    // Verificar senha
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.password)
    } catch (e) {
      safeErrorLog('Erro ao verificar senha', e, { id: user.id });
      return NextResponse.json({ error: 'Erro ao processar autenticação' }, { status: 500 })
    }

    if (!isValidPassword) {
      safeLog('Senha incorreta', { email }, ['email']);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    safeLog('Login bem-sucedido, definindo cookie', { id: user.id, email: user.email }, ['email']);
    
    // Configuração do cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      // Se remember for true, o cookie expira em 30 dias, caso contrário expira ao fechar o navegador
      ...(remember ? { maxAge: 30 * 24 * 60 * 60 } : {})
    }

    try {
      // A partir do Next.js 15, cookies() é uma função assíncrona
      const cookieStore = await cookies()
      
      // Define o cookie de autenticação
      cookieStore.set('auth', user.id, cookieOptions)
      safeLog('Cookie definido com sucesso', { remember, userId: user.id });
    } catch (e) {
      safeErrorLog('Erro ao definir cookie', e, { userId: user.id });
      return NextResponse.json({ error: 'Erro ao processar autenticação' }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        workspaceId: user.workspaceId
      }
    })
  } catch (error) {
    safeErrorLog('Erro ao fazer login', error);
    return NextResponse.json(
      { error: 'Erro ao processar login' },
      { status: 500 }
    )
  }
} 
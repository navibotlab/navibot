import { NextResponse } from 'next/server';
import { compare } from 'bcrypt';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Log inicial para garantir que a API está sendo chamada mesmo em produção
  const isProduction = process.env.NODE_ENV === 'production';
  const logPrefix = isProduction ? '🚀 PROD DEBUG:' : '🔧 DEV DEBUG:';
  
  console.warn(`${logPrefix} API de debug chamada - ${new Date().toISOString()}`);
  
  try {
    const { email, password } = await req.json();
    
    console.warn(`${logPrefix} Dados recebidos - Email: ${email?.substring(0, 5)}...`);
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV || 'not-vercel',
      step: '',
      success: false,
      error: null as any,
      dbConnection: false,
      userFound: false,
      userActive: false,
      passwordValid: false,
      env_vars: {
        database_url_exists: !!process.env.DATABASE_URL,
        database_url_preview: process.env.DATABASE_URL?.substring(0, 20) + '...' || 'undefined',
        nextauth_secret_exists: !!process.env.NEXTAUTH_SECRET,
        nextauth_url: process.env.NEXTAUTH_URL,
        vercel_url: process.env.VERCEL_URL,
        node_env: process.env.NODE_ENV,
      }
    };

    console.warn(`${logPrefix} Variáveis de ambiente verificadas`);

    // Verificação inicial: se não há dados básicos, retorna imediatamente
    if (!email || !password) {
      debugInfo.step = 'validation_failed';
      debugInfo.error = 'Email ou senha não fornecidos';
      console.warn(`${logPrefix} ❌ Dados de entrada inválidos`);
      return NextResponse.json(debugInfo, { status: 400 });
    }

    // 1. Testar conexão com BD
    debugInfo.step = 'database_connection';
    let prisma;
    try {
      console.warn(`${logPrefix} Testando conexão com BD...`);
      
      // Tentativa dinâmica de importar Prisma
      try {
        const { prisma: prismaClient } = await import('@/lib/prisma');
        prisma = prismaClient;
        console.warn(`${logPrefix} Prisma client importado com sucesso`);
      } catch (importError) {
        debugInfo.error = `Prisma import failed: ${importError}`;
        console.error(`${logPrefix} ❌ Falha ao importar Prisma:`, importError);
        return NextResponse.json(debugInfo, { status: 500 });
      }
      
      await prisma.$queryRaw`SELECT 1`;
      debugInfo.dbConnection = true;
      console.warn(`${logPrefix} ✅ Conexão com BD funciona`);
    } catch (error) {
      debugInfo.error = `DB Connection failed: ${error}`;
      console.error(`${logPrefix} ❌ Falha na conexão com BD:`, error);
      return NextResponse.json(debugInfo, { status: 500 });
    }

    // 2. Verificar se usuário existe
    debugInfo.step = 'user_lookup';
    let user;
    try {
      console.warn(`${logPrefix} Procurando usuário...`);
      user = await prisma.users.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          status: true,
          role: true,
          workspaceId: true
        }
      });
      
      if (user) {
        debugInfo.userFound = true;
        console.warn(`${logPrefix} ✅ Usuário encontrado:`, { id: user.id, email: user.email, status: user.status });
      } else {
        console.warn(`${logPrefix} ❌ Usuário não encontrado para email:`, email);
      }
    } catch (error) {
      debugInfo.error = `User lookup failed: ${error}`;
      console.error(`${logPrefix} ❌ Erro ao buscar usuário:`, error);
      return NextResponse.json(debugInfo, { status: 500 });
    }

    if (!user) {
      debugInfo.error = 'User not found';
      console.warn(`${logPrefix} Retornando erro: usuário não encontrado`);
      return NextResponse.json(debugInfo, { status: 401 });
    }

    // 3. Verificar status ativo
    debugInfo.step = 'user_status_check';
    if (user.status === 'active') {
      debugInfo.userActive = true;
      console.warn(`${logPrefix} ✅ Usuário está ativo`);
    } else {
      debugInfo.error = `User status is ${user.status}, not active`;
      console.warn(`${logPrefix} ❌ Usuário não está ativo: ${user.status}`);
      return NextResponse.json(debugInfo, { status: 401 });
    }

    // 4. Verificar senha
    debugInfo.step = 'password_validation';
    try {
      console.warn(`${logPrefix} Validando senha...`);
      const isPasswordValid = await compare(password, user.password);
      if (isPasswordValid) {
        debugInfo.passwordValid = true;
        console.warn(`${logPrefix} ✅ Senha válida`);
      } else {
        debugInfo.error = 'Invalid password';
        console.warn(`${logPrefix} ❌ Senha inválida`);
        return NextResponse.json(debugInfo, { status: 401 });
      }
    } catch (error) {
      debugInfo.error = `Password validation failed: ${error}`;
      console.error(`${logPrefix} ❌ Erro ao validar senha:`, error);
      return NextResponse.json(debugInfo, { status: 500 });
    }

    // 5. Sucesso total
    debugInfo.step = 'complete';
    debugInfo.success = true;
    console.warn(`${logPrefix} 🎉 Todos os checks passaram - login deveria funcionar!`);

    const response = {
      ...debugInfo,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        workspaceId: user.workspaceId
      }
    };

    console.warn(`${logPrefix} Retornando sucesso para o cliente`);
    return NextResponse.json(response);

  } catch (error) {
    console.error(`${logPrefix} ❌ Erro geral no debug:`, error);
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV || 'not-vercel',
      step: 'general_error',
      success: false,
      error: `General error: ${error}`,
      stack: isProduction ? 'hidden in production' : (error as Error)?.stack
    }, { status: 500 });
  }
} 
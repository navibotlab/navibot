import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcrypt';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      step: '',
      success: false,
      error: null as any,
      dbConnection: false,
      userFound: false,
      userActive: false,
      passwordValid: false,
      env_vars: {
        database_url_exists: !!process.env.DATABASE_URL,
        nextauth_secret_exists: !!process.env.NEXTAUTH_SECRET,
        nextauth_url: process.env.NEXTAUTH_URL,
      }
    };

    // 1. Testar conexão com BD
    debugInfo.step = 'database_connection';
    try {
      await prisma.$queryRaw`SELECT 1`;
      debugInfo.dbConnection = true;
      console.log('✅ Conexão com BD funciona');
    } catch (error) {
      debugInfo.error = `DB Connection failed: ${error}`;
      console.error('❌ Falha na conexão com BD:', error);
      return NextResponse.json(debugInfo, { status: 500 });
    }

    // 2. Verificar se usuário existe
    debugInfo.step = 'user_lookup';
    let user;
    try {
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
        console.log('✅ Usuário encontrado:', { id: user.id, email: user.email, status: user.status });
      } else {
        console.log('❌ Usuário não encontrado para email:', email);
      }
    } catch (error) {
      debugInfo.error = `User lookup failed: ${error}`;
      console.error('❌ Erro ao buscar usuário:', error);
      return NextResponse.json(debugInfo, { status: 500 });
    }

    if (!user) {
      debugInfo.error = 'User not found';
      return NextResponse.json(debugInfo, { status: 401 });
    }

    // 3. Verificar status ativo
    debugInfo.step = 'user_status_check';
    if (user.status === 'active') {
      debugInfo.userActive = true;
      console.log('✅ Usuário está ativo');
    } else {
      debugInfo.error = `User status is ${user.status}, not active`;
      console.log(`❌ Usuário não está ativo: ${user.status}`);
      return NextResponse.json(debugInfo, { status: 401 });
    }

    // 4. Verificar senha
    debugInfo.step = 'password_validation';
    try {
      const isPasswordValid = await compare(password, user.password);
      if (isPasswordValid) {
        debugInfo.passwordValid = true;
        console.log('✅ Senha válida');
      } else {
        debugInfo.error = 'Invalid password';
        console.log('❌ Senha inválida');
        return NextResponse.json(debugInfo, { status: 401 });
      }
    } catch (error) {
      debugInfo.error = `Password validation failed: ${error}`;
      console.error('❌ Erro ao validar senha:', error);
      return NextResponse.json(debugInfo, { status: 500 });
    }

    // 5. Sucesso total
    debugInfo.step = 'complete';
    debugInfo.success = true;
    console.log('🎉 Todos os checks passaram - login deveria funcionar!');

    return NextResponse.json({
      ...debugInfo,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        workspaceId: user.workspaceId
      }
    });

  } catch (error) {
    console.error('❌ Erro geral no debug:', error);
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      step: 'general_error',
      success: false,
      error: `General error: ${error}`
    }, { status: 500 });
  }
} 
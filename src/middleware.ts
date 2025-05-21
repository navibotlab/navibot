import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Função para mascarar dados sensíveis em logs
const secureLog = (message: string, data?: any) => {
  // Dados originais que não devem ser expostos
  if (!data) {
    console.log(message)
    return
  }

  // Clone para não modificar os dados originais
  const sanitizedData = { ...data }
  
  // Mascarar informações sensíveis
  if (sanitizedData.email) {
    const [username, domain] = sanitizedData.email.split('@')
    sanitizedData.email = `${username.slice(0, 3)}***@${domain}`
  }
  
  if (sanitizedData.sub) {
    sanitizedData.sub = sanitizedData.sub.slice(0, 5) + '***'
  }
  
  if (sanitizedData.workspaceId) {
    sanitizedData.workspaceId = sanitizedData.workspaceId.slice(0, 5) + '***'
  }
  
  if (sanitizedData.id) {
    sanitizedData.id = sanitizedData.id.slice(0, 5) + '***'
  }
  
  // Adicionar proteção para userId também
  if (sanitizedData.userId) {
    sanitizedData.userId = sanitizedData.userId.slice(0, 5) + '***'
  }
  
  console.log(message, sanitizedData)
}

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    
    // Log da rota atual para depuração
    console.log(`Middleware processando rota: ${pathname}`);
    
    // Pular middleware para rotas públicas e estáticas
    if (pathname.startsWith('/api/auth') || 
        pathname.startsWith('/_next') ||
        pathname.startsWith('/public') ||
        pathname === '/favicon.ico' ||
        pathname === '/signout' ||
        pathname === '/logout' ||
        pathname === '/api/auth/signout' ||
        pathname === '/login' ||
        pathname === '/registro' ||
        pathname === '/criar-conta' ||
        pathname === '/verificar-email' ||
        pathname === '/esqueci-senha' ||
        pathname === '/recuperar-senha' ||
        pathname === '/teste-dom' ||
        pathname === '/aceitar-convite' ||
        pathname === '/teste' ||
        pathname.startsWith('/api/dispara-ja/webhook/') ||
        pathname.startsWith('/webhook/whatsapp-cloud') ||
        pathname === '/api/version' ||
        pathname.startsWith('/api/version')) {
      console.log(`Rota pública ou estática: ${pathname}, permitindo acesso`);
      return NextResponse.next();
    }

    // Para todas as outras rotas, verificar autenticação e workspace
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    secureLog('Verificando autenticação para:', { rota: pathname });
    
    if (!token) {
      secureLog('Token não encontrado, redirecionando para login');
      // Se for uma rota da API, retorna erro 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
      // Se for uma rota de página, redireciona para login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    } else {
      secureLog('Usuário autenticado', { 
        sub: token.sub,
        email: token.email,
        id: token.id,
        workspaceId: token.workspaceId
      });
    }

    // Buscar usuário e workspace
    const userId = token.sub;
    if (!userId) {
      secureLog('ID do usuário não encontrado no token');
      return NextResponse.json({ error: 'ID do usuário não encontrado' }, { status: 401 });
    }

    // Adicionar workspaceId ao cabeçalho da requisição
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-workspace-id', token.workspaceId as string);
    requestHeaders.set('x-user-id', userId);
    
    // Log para debug
    console.log('Token workspaceId:', token.workspaceId);
    console.log('Token userId:', userId);
    
    // Corrigindo vazamento de dados sensíveis
    secureLog('Adicionando headers para a requisição', { 
      userId: userId, // Será mascarado pela função secureLog que já trata 'id'
      workspaceId: token.workspaceId 
    });

    // Retornar a requisição modificada
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Erro no middleware:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Configurar em quais rotas o middleware será aplicado
export const config = {
  matcher: [
    // Aplicar middleware em todas as rotas da API exceto /api/auth, /api/version e webhooks
    '/(api(?!/auth|/dispara-ja/webhook|/version).*)',
    
    // Aplicar middleware em todas as outras rotas exceto estáticas, públicas e webhook
    '/((?!api/auth|api/version|_next/static|_next/image|favicon.ico|api/dispara-ja/webhook|login|registro|criar-conta|verificar-email|recuperar-senha|esqueci-senha).*)'
  ]
} 
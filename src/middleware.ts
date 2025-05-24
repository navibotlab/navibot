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

// Verificar se a rota está na lista de públicas
function isPublicRoute(pathname: string): boolean {
  return pathname.startsWith('/api/auth') || 
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname === '/favicon.ico' ||
    pathname === '/signout' ||
    pathname === '/logout' ||
    pathname === '/api/auth/signout' ||
    pathname === '/api/auth/status' ||
    pathname === '/api/auth/check' ||
    pathname === '/login' ||
    pathname === '/registro' ||
    pathname === '/criar-conta' ||
    pathname === '/verificar-email' ||
    pathname === '/esqueci-senha' ||
    pathname === '/recuperar-senha' ||
    pathname === '/teste-dom' ||
    pathname === '/aceitar-convite' ||
    pathname === '/teste' ||
    pathname === '/diagnostico-publico' ||
    pathname === '/diagnostico-standalone' ||
    pathname === '/version.json' ||
    pathname === '/api/version/index.json' ||
    pathname.startsWith('/api/diagnostico-publico') ||
    pathname.startsWith('/api/dispara-ja/webhook/') ||
    pathname.startsWith('/webhook/whatsapp-cloud') ||
    pathname === '/api/version' ||
    pathname.startsWith('/api/version') ||
    pathname.startsWith('/api/diagnostico') ||
    pathname.startsWith('/images/') ||
    pathname.includes('favicon');
}

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    
    // PROTEÇÃO CRÍTICA: Limpar credenciais na URL ANTES de qualquer processamento
    const url = request.nextUrl;
    if (url.searchParams.has('email') || url.searchParams.has('password')) {
      console.log(`🚨 CREDENCIAIS NA URL DETECTADAS - REDIRECIONANDO: ${pathname}${url.search}`);
      
      // Extrair credenciais
      const email = url.searchParams.get('email');
      const password = url.searchParams.get('password');
      
      // Criar URL limpa
      const cleanUrl = new URL(pathname, request.url);
      
      // Criar response de redirecionamento
      const response = NextResponse.redirect(cleanUrl);
      
      // Salvar credenciais em cookies temporários para a página usar
      if (email) {
        response.cookies.set('temp_email', encodeURIComponent(email), { 
          maxAge: 30, // 30 segundos apenas
          httpOnly: false, // Permitir acesso via JS
          path: '/'
        });
      }
      if (password) {
        response.cookies.set('temp_password', encodeURIComponent(password), { 
          maxAge: 30, // 30 segundos apenas  
          httpOnly: false, // Permitir acesso via JS
          path: '/'
        });
      }
      
      // Adicionar flag para login automático
      response.cookies.set('auto_login', 'true', { 
        maxAge: 30,
        httpOnly: false,
        path: '/'
      });
      
      console.log(`✅ Redirecionamento para URL limpa: ${cleanUrl.href}`);
      return response;
    }
    
    // Pular middleware para rotas públicas e estáticas
    if (isPublicRoute(pathname)) {
      console.log(`✅ Rota pública ou estática: ${pathname}, permitindo acesso`);
      return NextResponse.next();
    }

    // Log da rota atual para depuração
    console.log(`🔍 Middleware iniciando: ${pathname}`);
    
    // Verificar se o usuário já está autenticado primeiro
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production'
    });
    
    // Log detalhado do token para diagnóstico
    console.log(`🔑 Token recebido no middleware:`, token ? 'Presente' : 'Ausente');
    if (token) {
      console.log(`🔑 Token sub:`, token.sub ? token.sub.substring(0, 5) + '***' : 'undefined');
      console.log(`🔑 Token email:`, token.email ? token.email.substring(0, 3) + '***' : 'undefined');
    }
    
    // IMPORTANTE: Se for um usuário autenticado tentando acessar a raiz, 
    // redirecionar para o dashboard admin
    if (token && (pathname === '/' || pathname === '')) {
      console.log(`✅ Usuário autenticado acessando a raiz, redirecionando para dashboard`);
      const adminUrl = new URL('/admin/dashboard', request.url);
      return NextResponse.redirect(adminUrl);
    }

    // Se usuário autenticado está tentando acessar login, redirecionar para dashboard
    if (token && pathname === '/login') {
      console.log(`✅ Usuário autenticado tentando acessar login, redirecionando para dashboard`);
      const adminUrl = new URL('/admin/dashboard', request.url);
      return NextResponse.redirect(adminUrl);
    }
    
    // ANTI-LOOP: Se detectar muitos redirecionamentos consecutivos, permitir a página
    const antiLoopCookie = request.cookies.get('anti_loop');
    const currentCount = antiLoopCookie ? parseInt(antiLoopCookie.value) : 0;
    
    // Se houver mais de 3 redirecionamentos em sequência rápida, permitir o acesso à página
    if (currentCount > 3 && pathname.startsWith('/admin')) {
      console.log(`🛑 Anti-loop ativado: ${currentCount} redirecionamentos detectados para ${pathname}`);
      
      // Encaminhar para login em vez de continuar o loop
      const loginUrl = new URL('/login?error=auth_required', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set('anti_loop', '0', { maxAge: 0 });
      return response;
    }

    // Para todas as outras rotas, verificar autenticação e workspace
    if (!token) {
      console.log(`🚫 Token não encontrado, redirecionando: ${pathname}`);
      
      // Incrementar contador anti-loop
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set('anti_loop', (currentCount + 1).toString(), { maxAge: 10 });
      
      // Se for uma rota da API, retorna erro 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
      
      // Se for uma rota de página, redireciona para login
      return response;
    } else {
      console.log(`✅ Usuário autenticado: ${pathname}`);
      // Resetar contador anti-loop
      const response = NextResponse.next({
        request: {
          headers: new Headers(request.headers),
        },
      });
      response.cookies.set('anti_loop', '0', { maxAge: 0 });
      
      secureLog('Usuário autenticado', { 
        sub: token.sub,
        email: token.email,
        id: token.id,
        workspaceId: token.workspaceId
      });
      
      // Adicionar workspaceId ao cabeçalho da requisição
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-workspace-id', token.workspaceId as string);
      requestHeaders.set('x-user-id', token.sub as string);
      
      console.log(`➡️ Middleware concluído com sucesso: ${pathname}`);
      // Retornar a requisição modificada
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  } catch (error) {
    console.error('Erro no middleware:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Configurar em quais rotas o middleware será aplicado
export const config = {
  matcher: [
    // Aplicar middleware em todas as rotas exceto arquivos estáticos
    '/((?!_next/static|_next/image).*)',
  ]
} 
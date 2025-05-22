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
    pathname === '/diagnostico-standalone' || // Adiciona diagnostico-standalone como rota pública
    pathname === '/version.json' ||  // Permitir acesso direto ao arquivo de versão estático
    pathname === '/api/version/index.json' || // Permitir acesso ao arquivo JSON de versão
    pathname.startsWith('/api/diagnostico-publico') ||
    pathname.startsWith('/api/dispara-ja/webhook/') ||
    pathname.startsWith('/webhook/whatsapp-cloud') ||
    pathname === '/api/version' ||
    pathname.startsWith('/api/version') ||
    pathname.startsWith('/api/diagnostico') ||
    pathname.startsWith('/images/') || // Permitir acesso a imagens públicas
    pathname.includes('favicon'); // Permitir acesso a favicons
}

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    
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

    // PROTEÇÃO CONTRA CREDENCIAIS NA URL - Verificação em todas as rotas antes de qualquer outro processamento
    const url = request.nextUrl;
    
    // Verificação mais rigorosa de credenciais na URL
    // Não redirecionar para diagnostico-standalone se já estiver autenticado
    // E não redirecionar se for a página de verificar-email com o parâmetro email
    if ((url.searchParams.has('email') || url.searchParams.has('password')) && 
        !token && 
        pathname !== '/verificar-email') {
      console.log(`⚠️ ALERTA DE SEGURANÇA: Credenciais detectadas na URL: ${pathname}${url.search}`);
      
      // Redirecionar para a página de diagnóstico standalone que é independente de APIs
      const diagnosticoUrl = new URL('/diagnostico-standalone', request.url);
      return NextResponse.redirect(diagnosticoUrl);
    }
    
    // Se usuário autenticado está tentando acessar login com credenciais na URL,
    // redirecionar direto para dashboard admin em vez de diagnostico-standalone
    if (token && pathname === '/login' && url.search.length > 0) {
      console.log(`✅ Usuário autenticado tentando acessar login com parâmetros, redirecionando para dashboard`);
      const adminUrl = new URL('/admin/dashboard', request.url);
      return NextResponse.redirect(adminUrl);
    }
    
    // Verificação específica para login com qualquer parâmetro de query
    // Apenas redirecionar se houver parâmetros suspeitos
    if (pathname === '/login' && url.search.length > 0 && 
        (url.search.includes('email=') || url.search.includes('password=') || url.search.includes('callbackUrl='))) {
      console.log(`⚠️ Parâmetros de URL detectados na página de login: ${url.search}`);
      
      // Redirecionar para a página de login limpa
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
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
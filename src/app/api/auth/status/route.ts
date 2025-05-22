import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic'; // Impedir cache

export async function GET(req: Request) {
  try {
    // Obter todos os cookies para diagnóstico
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // Filtrar cookies sensíveis para o log
    const cookieNames = allCookies.map(cookie => {
      const isSensitive = cookie.name.includes('token') || 
                          cookie.name.includes('auth') || 
                          cookie.name.includes('session');
      
      return {
        name: cookie.name,
        // Mascarar valor se for cookie sensível
        value: isSensitive ? '[PROTECTED]' : cookie.value.substring(0, 10) + '...'
      };
    });
    
    // Verificar token do NextAuth
    const token = await getToken({ 
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production'
    });
    
    // Verificar cookies de autenticação específicos
    const authCookie = cookieStore.get('auth');
    const nextAuthSessionToken = cookieStore.get('next-auth.session-token') || 
                                cookieStore.get('__Secure-next-auth.session-token');
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      authenticated: !!token || !!authCookie,
      authMethods: {
        nextAuthToken: !!token,
        authCookie: !!authCookie,
        nextAuthCookie: !!nextAuthSessionToken
      },
      cookies: {
        count: allCookies.length,
        names: cookieNames
      },
      tokenInfo: token ? {
        sub: token.sub ? token.sub.substring(0, 5) + '...' : undefined,
        email: token.email ? token.email.substring(0, 3) + '...' : undefined,
        hasWorkspaceId: !!token.workspaceId
      } : null
    });
  } catch (error) {
    console.error('Erro ao verificar status de autenticação:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar status de autenticação' },
      { status: 500 }
    );
  }
} 
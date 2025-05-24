import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    console.log('🧪 Testando NextAuth diretamente em produção');
    console.log('📧 Email recebido:', email);
    console.log('🔧 Environment:', process.env.NODE_ENV);
    console.log('🔑 NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
    console.log('🌐 NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    
    // Informações detalhadas da configuração
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      nextauth_config: {
        secret_exists: !!process.env.NEXTAUTH_SECRET,
        nextauth_url: process.env.NEXTAUTH_URL,
        vercel_url: process.env.VERCEL_URL,
        auth_options_exists: !!authOptions,
        providers_count: authOptions?.providers?.length || 0,
        session_strategy: authOptions?.session?.strategy,
        debug_enabled: authOptions?.debug
      },
      credentials: {
        email_provided: !!email,
        password_provided: !!password,
        email_length: email?.length || 0,
        password_length: password?.length || 0
      }
    };
    
    console.log('🔍 Debug Info:', debugInfo);
    
    return NextResponse.json({
      success: true,
      message: 'NextAuth test endpoint funcionando',
      debug: debugInfo
    });
    
  } catch (error) {
    console.error('❌ Erro no teste NextAuth:', error);
    return NextResponse.json({
      success: false,
      error: `Erro no teste: ${error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 
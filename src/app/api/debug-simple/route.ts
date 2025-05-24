import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Log inicial para garantir que a API está sendo chamada mesmo em produção
  const isProduction = process.env.NODE_ENV === 'production';
  const logPrefix = isProduction ? '🚀 PROD DEBUG SIMPLE:' : '🔧 DEV DEBUG SIMPLE:';
  
  console.warn(`${logPrefix} API de debug simples chamada - ${new Date().toISOString()}`);
  
  try {
    const { email, password } = await req.json();
    
    console.warn(`${logPrefix} Dados recebidos - Email: ${email?.substring(0, 5)}...`);
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV || 'not-vercel',
      url_origin: req.url,
      success: true,
      api_working: true,
      env_vars: {
        database_url_exists: !!process.env.DATABASE_URL,
        database_url_preview: process.env.DATABASE_URL?.substring(0, 30) + '...' || 'undefined',
        nextauth_secret_exists: !!process.env.NEXTAUTH_SECRET,
        nextauth_url: process.env.NEXTAUTH_URL,
        vercel_url: process.env.VERCEL_URL,
        node_env: process.env.NODE_ENV,
      },
      received_data: {
        email_provided: !!email,
        password_provided: !!password,
        email_preview: email?.substring(0, 5) + '...' || 'not provided',
      }
    };

    console.warn(`${logPrefix} Retornando dados de debug simples`);
    
    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error(`${logPrefix} ❌ Erro geral no debug simples:`, error);
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV || 'not-vercel',
      success: false,
      api_working: false,
      error: `General error: ${error}`,
      stack: isProduction ? 'hidden in production' : (error as Error)?.stack
    }, { status: 500 });
  }
}

export async function GET() {
  console.warn('🔬 API de debug simples chamada via GET');
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV || 'not-vercel',
    method: 'GET',
    api_working: true,
    message: 'API de debug simples funcionando'
  });
} 
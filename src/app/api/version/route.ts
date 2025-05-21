import { NextResponse } from 'next/server';

// Este endpoint retorna informações de versão do sistema
export async function GET(req: Request) {
  try {
    // Retorna informações básicas de versão, evitando dependências externas
    // que possam causar erros
    const versionInfo = {
      version: process.env.APP_VERSION || '1.0.0',
      buildDate: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      serverTime: new Date().toISOString()
    };
    
    return new NextResponse(JSON.stringify(versionInfo), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Erro ao obter informações de versão:', error);
    
    // Mesmo com erro, retorna 200 com dados mínimos
    return new NextResponse(JSON.stringify({
      version: '1.0.0',
      error: 'Não foi possível obter versão completa',
      serverTime: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
} 
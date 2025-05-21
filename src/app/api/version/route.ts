import { NextResponse } from 'next/server';

// Este endpoint retorna informações de versão do sistema
export async function GET(req: Request) {
  try {
    // Retorna informações básicas de versão, evitando dependências externas
    // que possam causar erros
    const versionInfo = {
      version: process.env.APP_VERSION || '1.0.0',
      buildDate: process.env.BUILD_DATE || new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      serverTime: new Date().toISOString()
    };

    return NextResponse.json(versionInfo);
  } catch (error) {
    console.error('Erro ao obter informações de versão:', error);
    
    // Retorna um erro mais amigável
    return NextResponse.json(
      { 
        error: 'Não foi possível obter informações de versão',
        serverTime: new Date().toISOString() 
      },
      { status: 200 } // Retorna status 200 mesmo com erro para evitar mais problemas
    );
  }
} 
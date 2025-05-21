import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    // Coletar informações básicas de diagnóstico (sem informações sensíveis)
    const diagnostico = {
      ambiente: process.env.NODE_ENV || 'não definido',
      nextauth_url: process.env.NEXTAUTH_URL || 'não definido',
      url_base: process.env.NEXT_PUBLIC_URL || 'não definido',
      timestamp: new Date().toISOString(),
      headers: {
        host: req.headers.get('host') || 'não encontrado',
        referer: req.headers.get('referer') || 'não encontrado',
        'user-agent': req.headers.get('user-agent') || 'não encontrado'
      },
      url: req.url,
      serverInfo: {
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: JSON.stringify(process.memoryUsage())
      }
    };
    
    // Adicionar CORS headers para permitir acesso de qualquer origem
    return new NextResponse(JSON.stringify(diagnostico), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    // Em caso de erro, retornar um objeto mínimo de diagnóstico
    console.error('Erro ao gerar diagnóstico:', error);
    
    // Ainda tenta retornar algo útil
    return new NextResponse(
      JSON.stringify({
        error: 'Erro ao gerar diagnóstico',
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        status: 200, // Retornar 200 mesmo com erro para evitar problemas no cliente
        headers: {
          'content-type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
        },
      }
    );
  }
} 
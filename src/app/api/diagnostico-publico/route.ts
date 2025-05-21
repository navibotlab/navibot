import { NextResponse } from 'next/server';

export async function GET(req: Request) {
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
    url: req.url
  };
  
  return NextResponse.json(diagnostico);
} 
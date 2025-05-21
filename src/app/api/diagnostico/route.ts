import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  // Verificar autenticação (opcional, só se quiser restringir o acesso)
  const session = await getServerSession(authOptions);
  
  // Coletar informações de diagnóstico
  const diagnostico = {
    ambiente: process.env.NODE_ENV || 'não definido',
    nextauth_url: process.env.NEXTAUTH_URL || 'não definido',
    url_base: process.env.NEXT_PUBLIC_URL || 'não definido',
    session_exists: !!session,
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(req.headers)
  };
  
  return NextResponse.json(diagnostico);
} 
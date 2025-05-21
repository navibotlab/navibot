import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // Este endpoint será protegido pelo middleware
  // Se o middleware estiver funcionando, apenas usuários autenticados chegarão aqui
  
  // Obter headers adicionados pelo middleware
  const workspaceId = req.headers.get('x-workspace-id') || 'não encontrado';
  const userId = req.headers.get('x-user-id') || 'não encontrado';
  
  return NextResponse.json({
    status: 'ok',
    message: 'Se você está vendo esta mensagem, o middleware está funcionando',
    headers: {
      workspaceId,
      userId
    }
  });
} 
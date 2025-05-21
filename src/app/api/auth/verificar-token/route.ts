import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, token, type = 'verification' } = await req.json();

    // Validações básicas
    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email e token são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar o usuário pelo email e token
    const user = await prisma.users.findFirst({
      where: {
        email,
        verifyToken: token,
        status: type === 'invitation' ? 'pending' : undefined
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    // Verificar se o token já foi usado (verificado pelo status)
    if (type === 'verification' && user.status === 'active') {
      return NextResponse.json(
        { error: 'Este email já foi verificado' },
        { status: 400 }
      );
    }

    // Token válido, retorna sucesso sem ativar ainda o usuário
    return NextResponse.json({
      valid: true,
      message: type === 'invitation' 
        ? 'Token de convite válido' 
        : 'Token de verificação válido'
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
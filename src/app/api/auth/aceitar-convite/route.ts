import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcrypt';

export async function POST(req: Request) {
  try {
    const { email, token, password } = await req.json();

    // Validações básicas
    if (!email || !token || !password) {
      return NextResponse.json(
        { error: 'Email, token e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Buscar o usuário pelo email e token
    const user = await prisma.users.findFirst({
      where: {
        email,
        verifyToken: token,
        status: 'pending'
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    // Gerar hash da nova senha
    const hashedPassword = await hash(password, 10);

    // Atualizar o usuário: ativar conta, atualizar senha e limpar token
    const updatedUser = await prisma.users.update({
      where: { id: user.id },
      data: {
        status: 'active',
        password: hashedPassword,
        verifyToken: null,
        emailVerified: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true
      }
    });

    // Log para o console (em vez de usar userAuditLog)
    console.log(`Usuário ${user.id} ativou a conta através de convite em ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: 'Conta ativada com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao aceitar convite:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
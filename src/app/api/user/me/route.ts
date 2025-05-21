import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const authCookie = cookies().get('auth')
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Decodificar o cookie para obter o email do usuário
    // Normalmente você usaria uma biblioteca como jwt para decodificar tokens
    // Aqui estamos assumindo um formato simples para exemplo
    let userEmail = '';
    try {
      // Tentativa de decodificar o cookie (isso depende de como sua autenticação funciona)
      const cookieValue = authCookie.value;
      // Se o cookie for um JWT, você usaria algo como:
      // const decoded = jwt.verify(cookieValue, process.env.JWT_SECRET);
      // userEmail = decoded.email;
      
      // Para fins de demonstração, vamos usar o email do usuário logado
      userEmail = 'ivancnogueira@gmail.com'; // Aqui você substituiria pela lógica real
    } catch (e) {
      console.error('Erro ao decodificar cookie:', e);
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    // Buscar dados do usuário no banco de dados
    // const user = await prisma.user.findUnique({
    //   where: { email: userEmail },
    //   select: {
    //     id: true,
    //     name: true,
    //     email: true,
    //     image: true,
    //   },
    // });

    // Se não encontrar o usuário, retorna erro
    // if (!user) {
    //   return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    // }

    // Para fins de demonstração, vamos retornar dados simulados
    const user = {
      id: '1',
      name: 'Ivan Nogueira',
      email: userEmail,
      image: null
    };

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do usuário' },
      { status: 500 }
    );
  }
} 
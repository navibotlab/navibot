import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll(); // Obter a lista de cookies

    // Usar for...of para permitir await dentro do loop
    for (const cookie of allCookies) {
      if (cookie.name.includes('next-auth') || cookie.name.includes('__Secure-next-auth')) {
        // A chamada delete pode precisar ser await também, dependendo da implementação
        // Mas geralmente é síncrona após obter o cookieStore.
        cookieStore.delete(cookie.name);
        console.log(`Cookie removido: ${cookie.name}`);
      }
    }
    
    // Limpar cookies específicos do next-auth como garantia adicional (opcional)
    cookieStore.delete('next-auth.session-token');
    cookieStore.delete('next-auth.callback-url');
    cookieStore.delete('next-auth.csrf-token');
    cookieStore.delete('__Secure-next-auth.session-token');
    cookieStore.delete('__Secure-next-auth.callback-url');
    cookieStore.delete('__Secure-next-auth.csrf-token');

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao fazer logout (POST):', error)
    return NextResponse.json(
      { error: 'Erro ao processar logout' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll(); // Obter a lista de cookies

    // Usar for...of para permitir await dentro do loop
    for (const cookie of allCookies) {
      if (cookie.name.includes('next-auth') || cookie.name.includes('__Secure-next-auth')) {
        cookieStore.delete(cookie.name);
        console.log(`Cookie removido: ${cookie.name}`);
      }
    }

    // Limpar cookies específicos do next-auth como garantia adicional (opcional)
    cookieStore.delete('next-auth.session-token');
    cookieStore.delete('next-auth.callback-url');
    cookieStore.delete('next-auth.csrf-token');
    cookieStore.delete('__Secure-next-auth.session-token');
    cookieStore.delete('__Secure-next-auth.callback-url');
    cookieStore.delete('__Secure-next-auth.csrf-token');

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao fazer logout (GET):', error)
    return NextResponse.json(
      { error: 'Erro ao processar logout' },
      { status: 500 }
    )
  }
} 
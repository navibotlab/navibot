import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { NextAuthProvider } from '@/providers/NextAuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Registro - AI Agents Platform',
  description: 'Crie sua conta na plataforma de Agentes de IA',
};

// Layout específico para a página de registro sem componentes que usam findDOMNode
export default function RegistroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
        {/* Anti-cache meta tags */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      <head>
        {/* Adicionando meta tags para evitar problemas de renderização */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
      </head>
      <body className={inter.className}>
        {/* Layout extremamente simplificado para evitar qualquer problema com bibliotecas externas */}
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
} 
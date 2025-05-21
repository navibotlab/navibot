'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function ConfiguracoesPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      // Redirecionar para a página de configurações de conta por padrão
      router.push('/admin/configuracoes/conta');
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Mostrar loading enquanto carrega a sessão ou redireciona
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
} 
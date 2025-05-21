'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConfiguracoesContatoPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionamento para a página de Campos do Contato por padrão
    router.push('/admin/conteudos/configuracoes-contato/campos-contato');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
} 
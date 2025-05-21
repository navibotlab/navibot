'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página principal do admin
    router.push('/admin');
  }, [router]);

  // Renderiza um elemento vazio enquanto o redirecionamento acontece
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}
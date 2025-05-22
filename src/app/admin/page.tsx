'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Página de redirecionamento para dashboard
export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para o dashboard
    router.replace('/admin/dashboard');
  }, [router]);

  // Mostrar um spinner enquanto redireciona
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-white">Redirecionando para o dashboard...</p>
      </div>
    </div>
  );
} 
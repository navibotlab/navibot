'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DocumentacaoPage() {
  useEffect(() => {
    // Redirigir a la documentación
    window.location.href = '/docs';
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-gray-600">Redirecionando para a documentação...</p>
    </div>
  );
} 
'use client';

import { useEffect, Suspense } from 'react';
import NProgress from 'nprogress';
import { usePathname, useSearchParams } from 'next/navigation';

const LoadingProgressContent = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Configurar o NProgress
    NProgress.configure({ 
      showSpinner: false,
      trickleSpeed: 100,
      minimum: 0.3,
    });
  }, []);

  useEffect(() => {
    // Iniciar o loading quando a rota mudar
    NProgress.start();

    // Finalizar o loading após um pequeno delay para garantir que a página carregou
    const timer = setTimeout(() => {
      NProgress.done();
    }, 100);

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname, searchParams]);

  return null;
}

export function LoadingProgress() {
  return (
    <Suspense fallback={null}>
      <LoadingProgressContent />
    </Suspense>
  );
} 
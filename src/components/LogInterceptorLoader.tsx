'use client';

import { useEffect } from 'react';
import { setupLogInterceptor } from '@/lib/middleware/log-interceptor';

/**
 * Componente para inicializar o interceptor de logs no lado do cliente
 * Este componente deve ser adicionado ao layout principal da aplicação
 */
export function LogInterceptorLoader() {
  useEffect(() => {
    // Configura o interceptor de logs apenas no cliente
    setupLogInterceptor();
  }, []);

  // Este componente não renderiza nenhum elemento visual
  return null;
} 
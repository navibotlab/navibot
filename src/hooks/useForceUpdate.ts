import { useState, useCallback } from 'react';

/**
 * Hook para forçar uma atualização de um componente React
 * Útil quando você precisa forçar uma renderização sem alterar o estado principal
 */
export function useForceUpdate() {
  const [, setTick] = useState(0);
  
  const forceUpdate = useCallback(() => {
    setTick(tick => tick + 1);
  }, []);
  
  return forceUpdate;
} 
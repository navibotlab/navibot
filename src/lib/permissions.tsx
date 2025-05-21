'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkPermission } from './permissions-utils';

// Tipo para a estrutura de permissões
type PermissionValue = boolean | { [key: string]: PermissionValue };

// Interface para permissões e metadados do usuário
interface PermissionData {
  role: string;
  permissions: Record<string, any>;
  permissionGroup?: {
    id: string;
    name: string;
  } | null;
}

/**
 * Hook para carregar e verificar permissões do usuário
 */
export function usePermission(permissionKey: string, redirectTo?: string) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);

  useEffect(() => {
    async function loadPermissions() {
      if (status === 'loading') return;
      
      if (status === 'unauthenticated') {
        if (redirectTo) router.push(redirectTo);
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/user/me/permissions');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Falha ao carregar permissões');
        }
        
        setPermissionData(data);
        
        // Roles admin e owner têm permissão implícita para tudo
        if (data.role === 'admin' || data.role === 'owner') {
          setHasPermission(true);
        } else {
          // Verificar permissão específica
          const result = checkPermission(data.permissions, permissionKey);
          setHasPermission(result);
          
          // Redirecionar se não tiver permissão
          if (!result && redirectTo) {
            router.push(redirectTo);
          }
        }
      } catch (err: any) {
        console.error('Erro ao carregar permissões:', err);
        setError(err.message || 'Erro ao verificar permissões');
      } finally {
        setLoading(false);
      }
    }
    
    loadPermissions();
  }, [status, session, permissionKey, redirectTo, router]);
  
  return { hasPermission, loading, error, permissionData };
}

// Reexportando a função checkPermission para manter compatibilidade
export { checkPermission };

/**
 * Componente de guarda para controle de acesso baseado em permissões
 */
export function PermissionGuard({
  children,
  permission,
  fallback = null
}: {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}) {
  const { hasPermission, loading } = usePermission(permission);
  
  if (loading) {
    return <div className="p-4 text-center">Carregando...</div>;
  }
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * HOC para proteger componentes com base em permissões
 */
export function withPermission<T extends object>(
  Component: React.ComponentType<T>,
  permission: string,
  fallback?: React.ReactNode
) {
  return function PermissionWrapper(props: T) {
    return (
      <PermissionGuard permission={permission} fallback={fallback}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
} 
/**
 * Verificar se o usuário tem uma permissão específica
 * Esta função pode ser usada tanto no lado do cliente quanto no servidor
 */
export function checkPermission(permissions: Record<string, any> | null, permissionKey: string): boolean {
  if (!permissions) return false;
  
  const keys = permissionKey.split('.');
  let current = permissions;
  
  for (const key of keys) {
    if (current[key] === undefined) {
      return false;
    }
    
    if (typeof current[key] === 'boolean') {
      return current[key];
    }
    
    current = current[key];
  }
  
  return false;
} 
import { headers } from 'next/headers';

export async function getWorkspaceFromContext() {
  const headersList = await headers();
  const workspaceId = headersList.get('x-workspace-id');
  const userId = headersList.get('x-user-id');

  if (!workspaceId) {
    throw new Error('Workspace não encontrado no contexto');
  }

  return {
    workspaceId,
    userId
  };
}

// Versão para ser usada quando necessário em contextos específicos
// Observação: Como headers() retorna uma Promise no Next.js 14,
// esta função também precisa ser assíncrona
export async function getWorkspaceFromContextSync() {
  try {
    const headersList = await headers();
    const workspaceId = headersList.get('x-workspace-id');
    const userId = headersList.get('x-user-id');

    if (!workspaceId) {
      console.error('Workspace não encontrado no contexto');
      return { workspaceId: null, userId: null };
    }

    return {
      workspaceId,
      userId
    };
  } catch (error) {
    console.error('Erro ao obter workspace do contexto:', error);
    return { workspaceId: null, userId: null };
  }
} 
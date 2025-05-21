import { prisma } from '@/lib/prisma';

/**
 * Verifica se um usuário tem acesso a um recurso específico do plano
 * @param userId ID do usuário
 * @param featureKey Chave do recurso a verificar
 * @param minimumValue Valor mínimo necessário (se numérico) ou valor esperado (se booleano/string)
 */
export async function canUserAccessFeature(
  userId: string, 
  featureKey: string, 
  minimumValue: string | number | boolean = true
): Promise<boolean> {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { 
        plan: { 
          include: { 
            planFeatures: {
              where: { featureKey }
            } 
          } 
        } 
      }
    });
    
    // Se o usuário não existir ou não tiver plano, não tem acesso
    if (!user?.plan) return false;
    
    const feature = user.plan.planFeatures[0];
    if (!feature) return false;
    
    // Converter para o tipo apropriado com base no tipo do valor mínimo
    if (typeof minimumValue === 'number') {
      return Number(feature.featureValue) >= minimumValue;
    }
    
    if (typeof minimumValue === 'boolean') {
      return feature.featureValue === 'true';
    }
    
    // Comparação direta para strings
    return feature.featureValue === minimumValue;
  } catch (error) {
    console.error('Erro ao verificar acesso a recurso:', error);
    return false;
  }
}

/**
 * Verifica se o usuário pode criar mais agentes com base no plano
 */
export async function canUserCreateMoreAgents(userId: string): Promise<boolean> {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { 
        plan: { 
          include: { 
            planFeatures: {
              where: { featureKey: 'maxAgents' }
            } 
          } 
        } 
      }
    });
    
    if (!user || !user.plan) return false;
    
    const feature = user.plan.planFeatures[0];
    if (!feature) return false;
    
    const maxAgents = Number(feature.featureValue);
    return user.agentCount < maxAgents;
  } catch (error) {
    console.error('Erro ao verificar limite de agentes:', error);
    return false;
  }
}

/**
 * Funções de conveniência para verificações comuns
 */
export const PlanChecks = {
  canAccessChat: (userId: string) => canUserAccessFeature(userId, 'canAccessChat'),
  canAccessCRM: (userId: string) => canUserAccessFeature(userId, 'canAccessCRM'),
  canCreateConnections: (userId: string) => canUserAccessFeature(userId, 'canCreateConnections'),
  canAccessAIFiles: (userId: string) => canUserAccessFeature(userId, 'canAccessAIFiles'),
  canAccessVectorStore: (userId: string) => canUserAccessFeature(userId, 'canAccessVectorStore'),
  canAccessContent: (userId: string) => canUserAccessFeature(userId, 'canAccessContent')
}; 
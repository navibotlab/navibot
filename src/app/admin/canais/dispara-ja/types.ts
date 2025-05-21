import { Agent } from '@/types/agent';

/**
 * Status possíveis para uma conexão do DisparaJá
 */
export type DisparaJaConnectionStatus = 'ativo' | 'inativo' | 'pendente' | 'error';

/**
 * Interface base para uma conexão do DisparaJá
 * Esta interface reflete exatamente o schema do Prisma
 */
export interface DisparaJaConnection {
  id: string;
  agentId: string;
  provider: string;
  secret: string;
  sid: string;
  token: string | null;
  phoneNumber: string;
  unique: string;
  webhookUrl: string;
  status: DisparaJaConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
  workspaceId: string;
  agent?: Agent;
}

/**
 * Interface para criação de uma nova conexão
 * Omite campos que são gerados automaticamente
 */
export type CreateDisparaJaConnectionInput = Omit<
  DisparaJaConnection,
  'id' | 'createdAt' | 'updatedAt' | 'provider' | 'agent'
>;

/**
 * Interface para atualização de uma conexão existente
 * Torna todos os campos opcionais, exceto o ID
 */
export type UpdateDisparaJaConnectionInput = Partial<
  Omit<DisparaJaConnection, 'id' | 'createdAt' | 'updatedAt' | 'provider' | 'agent'>
>;

/**
 * Interface para o retorno da verificação de status
 */
export interface DisparaJaConnectionStatusResponse {
  success: boolean;
  status: DisparaJaConnectionStatus;
  phoneNumber?: string;
} 
/**
 * Utilitários para verificar o status das conexões com Dispara Já
 */
import { DisparaJaConnection, DisparaJaConnectionStatus, DisparaJaConnectionStatusResponse } from "../types";
import { maskSensitiveData } from '@/lib/utils/security';

// Função auxiliar para logs seguros com mascaramento de dados sensíveis
const logSafe = (message: string, data: object = {}) => {
  console.log(message, maskSensitiveData(data));
};

// Função auxiliar para logs de erro seguros
const logError = (message: string, error: any, additionalData: object = {}) => {
  console.error(
    message, 
    error instanceof Error ? error.message : error,
    Object.keys(additionalData).length > 0 ? maskSensitiveData(additionalData) : ''
  );
};

/**
 * Verifica o status de uma conexão específica do Dispara Já
 * @param connection Dados da conexão
 * @returns Objeto com o status atualizado da conexão
 */
export async function verifyConnectionStatus(
  connection: DisparaJaConnection
): Promise<DisparaJaConnectionStatusResponse> {
  try {
    // Verificação usando token (obtido na conexão inicial)
    if (connection.token) {
      const infoUrl = `https://disparaja.com/api/get/wa.info?token=${encodeURIComponent(connection.token)}`;
      
      const infoResponse = await fetch(infoUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!infoResponse.ok) {
        logError('Falha ao verificar info da conexão', await infoResponse.text(), { connectionId: connection.id });
        return {
          success: false,
          status: 'error',
        };
      }

      const infoData = await infoResponse.json();
      
      // Verifica se está conectado com base no status 200
      const isConnected = infoData.status === 200;

      // Extrair número de telefone se disponível
      let phoneNumber = undefined;
      if (infoData.data) {
        phoneNumber = infoData.data.phone || infoData.data.number;
      }

      return {
        success: true,
        status: isConnected ? 'ativo' : 'inativo',
        phoneNumber,
      };
    }
    // Caso de fallback se não tiver token, tentar usando secret e sid
    else if (connection.secret && connection.sid) {
      logSafe('Token não encontrado, usando fallback', { connectionId: connection.id });
      
      const statusUrl = `https://disparaja.com/api/get/wa.status?secret=${encodeURIComponent(connection.secret)}&sid=${encodeURIComponent(connection.sid)}`;
      
      const statusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!statusResponse.ok) {
        logError('Falha ao verificar status da conexão', await statusResponse.text(), { connectionId: connection.id });
        return {
          success: false,
          status: 'error',
        };
      }

      const statusData = await statusResponse.json();
      
      // Verifica se está conectado
      const isConnected = statusData.status === 200 || 
                          (statusData.data && statusData.data.connected) ||
                          (statusData.data && statusData.data.status === 'connected');

      // Extrair número de telefone se disponível
      let phoneNumber = undefined;
      if (statusData.data && statusData.data.number) {
        phoneNumber = statusData.data.number;
      }

      return {
        success: true,
        status: isConnected ? 'ativo' : 'inativo',
        phoneNumber,
      };
    } else {
      logError('Informações insuficientes para verificar conexão', null, { connectionId: connection.id });
      return {
        success: false,
        status: 'error',
      };
    }
  } catch (error) {
    logError('Erro ao verificar status da conexão', error, { connectionId: connection.id });
    return {
      success: false,
      status: 'error',
    };
  }
}

/**
 * Verifica o status de todas as conexões
 * @param connections Lista de conexões
 * @returns Lista atualizada com status atual
 */
export async function verifyAllConnections(
  connections: DisparaJaConnection[]
): Promise<DisparaJaConnection[]> {
  const updatedConnections = [...connections];
  
  await Promise.all(
    updatedConnections.map(async (connection, index) => {
      const statusResult = await verifyConnectionStatus(connection);
      
      if (statusResult.success) {
        updatedConnections[index] = {
          ...connection,
          status: statusResult.status,
          ...(statusResult.phoneNumber && { phoneNumber: statusResult.phoneNumber }),
          updatedAt: new Date(),
        };
      }
    })
  );
  
  return updatedConnections;
}

export function formatConnectionStatus(status: string): string {
  // Padroniza o status para minúsculas
  const normalizedStatus = status.toLowerCase();
  
  // Mapeia os valores para exibição em português
  switch (normalizedStatus) {
    case 'ativo':
    case 'active':
    case 'connected':
      return 'Ativo';
    
    case 'pendente':
    case 'pending':
    case 'connecting':
      return 'Pendente';
      
    case 'inativo':
    case 'inactive':
    case 'disconnected':
      return 'Inativo';
      
    case 'erro':
    case 'error':
      return 'Erro';
      
    default:
      return status;
  }
} 
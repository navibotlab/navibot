/**
 * Utility para mascarar dados sensíveis no sistema
 */

type SensitiveFields = 'accessToken' | 'token' | 'password' | 'secret' | 'key' | string;

/**
 * Mascara dados sensíveis para logs e depuração
 * @param data Objeto ou array contendo dados potencialmente sensíveis
 * @param sensitiveFields Lista de campos a serem mascarados, se não fornecido usa defaults
 * @param seenObjects Set para detectar referências circulares
 * @returns Uma cópia dos dados com campos sensíveis mascarados
 */
export function maskSensitiveData<T>(
  data: T, 
  sensitiveFields: SensitiveFields[] = [
    'accessToken', 
    'token', 
    'password', 
    'secret', 
    'key', 
    'apiKey', 
    'phoneNumber', 
    'phone', 
    'verifyToken', 
    'unique', 
    'sid'
  ],
  seenObjects = new Set<object>()
): T {
  if (!data) return data;
  
  // Verificar tipos primitivos
  if (typeof data !== 'object' || data === null) return data;
  
  // Detectar referências circulares
  if (isObject(data)) {
    if (seenObjects.has(data as object)) {
      return "[Referência Circular]" as unknown as T;
    }
    
    // Adiciona o objeto atual ao conjunto de objetos já vistos
    seenObjects.add(data as object);
  }
  
  // Cria uma cópia para não modificar o objeto original
  const maskedData = Array.isArray(data) ? [...data] as unknown as T : {...data};
  
  if (Array.isArray(maskedData)) {
    return maskedData.map(item => maskSensitiveData(item, sensitiveFields, seenObjects)) as unknown as T;
  } else if (typeof maskedData === 'object' && maskedData !== null) {
    try {
      // Percorre cada chave do objeto
      Object.keys(maskedData || {}).forEach(key => {
        // Se for um campo sensível
        if (sensitiveFields.includes(key)) {
          const value = (maskedData as any)[key];
          if (typeof value === 'string' && value.length > 0) {
            // Mascara o valor, mantendo apenas os primeiros e últimos caracteres
            const visibleLength = Math.min(4, Math.floor(value.length / 4));
            if (value.length <= 8) {
              (maskedData as any)[key] = value.substring(0, 2) + '***';
            } else {
              (maskedData as any)[key] = value.substring(0, visibleLength) + 
                '****' + 
                value.substring(value.length - visibleLength);
            }
          }
        } else if (typeof (maskedData as any)[key] === 'string') {
          // Verificar se o valor parece um número de telefone, independente do nome do campo
          const value = (maskedData as any)[key];
          if (isPhoneNumber(value)) {
            // Mascara números de telefone, mantendo o código de país e alguns dígitos iniciais
            const visibleLength = Math.min(5, Math.floor(value.length / 3));
            (maskedData as any)[key] = value.substring(0, visibleLength) + 
              '****' + 
              (value.length > 8 ? value.substring(value.length - 2) : '');
          }
        } else if (typeof (maskedData as any)[key] === 'object' && (maskedData as any)[key] !== null) {
          // Recursivamente processa objetos aninhados
          (maskedData as any)[key] = maskSensitiveData((maskedData as any)[key], sensitiveFields, seenObjects);
        }
      });
    } catch (error) {
      return "[Objeto não processável]" as unknown as T;
    }
    
    return maskedData;
  }
  
  return maskedData;
}

/**
 * Verifica se uma string parece ser um número de telefone
 * Detecta formatos comuns como +55479610... ou 55479610... ou (55)47961...
 */
function isPhoneNumber(value: string): boolean {
  if (typeof value !== 'string') return false;
  
  // Remove espaços, traços, parênteses e outros caracteres não numéricos para análise
  const cleanValue = value.replace(/[\s\-\(\)\+\.]/g, '');
  
  // Verifica padrões de números de telefone
  const phoneNumberPattern = /^(\+?[0-9]{1,3})?[0-9]{8,15}$/;
  
  // Números de telefone geralmente começam com + ou números, e têm entre 8 e 15 dígitos no total
  return phoneNumberPattern.test(cleanValue) && cleanValue.length >= 8 && cleanValue.length <= 15;
}

/**
 * Verifica se um valor é um objeto "puro" (não nulo e não array)
 */
function isObject(value: any): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Função para verificar se um objeto pode conter referências circulares
 * @param obj Objeto a ser verificado
 * @returns true se encontrar referências circulares
 */
export function hasCircularReferences(obj: any): boolean {
  const seen = new Set<object>();
  
  function detect(obj: any): boolean {
    // Tipos primitivos não podem ter referências circulares
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return false;
    }
    
    if (seen.has(obj)) {
      return true; // Referência circular encontrada
    }
    
    seen.add(obj);
    
    // Verifica arrays
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (detect(item)) {
          return true;
        }
      }
      return false;
    }
    
    // Verifica objetos
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (detect(obj[key])) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  return detect(obj);
}

/**
 * Função de conveniência para logs seguros
 * Registra no console com dados sensíveis mascarados
 */
export function safeLog(message: string, data: any, sensitiveFields?: SensitiveFields[]): void {
  console.log(message, maskSensitiveData(data, sensitiveFields));
}

/**
 * Função de conveniência para logs de erro seguros
 * Registra erros no console com dados sensíveis mascarados
 */
export function safeErrorLog(message: string, error: any, additionalData?: any, sensitiveFields?: SensitiveFields[]): void {
  console.error(
    message, 
    error instanceof Error ? error.message : error,
    additionalData ? maskSensitiveData(additionalData, sensitiveFields) : ''
  );
} 
/**
 * Utilitários para validação de dados
 */

/**
 * Verifica se uma string é um UUID válido
 * @param str String a ser validada
 * @returns true se for um UUID válido
 */
export function isUUID(str: string): boolean {
  if (!str) return false;
  
  // Regex para validar UUID padrão (8-4-4-4-12)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  return uuidRegex.test(str);
}

/**
 * Verifica se uma string é um UUID válido ou um formato alternativo aceito
 * Útil para ambientes de desenvolvimento onde IDs simplificados são usados
 * @param str String a ser validada
 * @returns true se for um UUID válido ou formato aceito
 */
export function isValidId(str: string): boolean {
  if (!str) return false;
  
  // UUID padrão
  if (isUUID(str)) return true;
  
  // Formatos alternativos aceitos em desenvolvimento
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    // IDs numéricos (para testes)
    if (/^\d+$/.test(str)) return true;
    
    // IDs de stage (stage/123)
    if (/^stage\/\w+$/.test(str)) return true;
    
    // IDs de origem (origin/123)
    if (/^origin\/\w+$/.test(str)) return true;
    
    // nanoid - strings alfanuméricas curtas usadas em dev
    if (/^[a-zA-Z0-9_-]{5,21}$/.test(str)) return true;
  }
  
  return false;
}

/**
 * Gera um UUID v4 aleatório
 * @returns String com UUID v4
 */
export function generateUUID(): string {
  // Implementação baseada na RFC4122 v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Verifica se um valor é numérico
 * @param value Valor a ser verificado
 * @returns true se for numérico
 */
export function isNumeric(value: any): boolean {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Verifica se uma string é um e-mail válido
 * @param email String a ser validada
 * @returns true se for um e-mail válido
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  
  // Regex para validação básica de e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(email);
}

/**
 * Verifica se uma string é um número de telefone válido
 * @param phone String a ser validada
 * @returns true se for um telefone válido
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Verifica se tem entre 8 e 15 dígitos (padrão internacional)
  return cleanPhone.length >= 8 && cleanPhone.length <= 15;
} 
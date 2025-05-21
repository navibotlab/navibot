/**
 * Arquivo central de utilitários do sistema
 */

// Re-exportar funções de validação
export * from './validation';

/**
 * Formata um valor numérico como moeda brasileira (R$)
 * @param value Valor a ser formatado
 * @returns String formatada como moeda (ex: R$ 1.234,56)
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata uma data em formato amigável
 * @param date Data a ser formatada
 * @returns String formatada (ex: 01/01/2023)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
}

/**
 * Remove acentos e caracteres especiais de uma string
 * @param str String a ser normalizada
 * @returns String sem acentos e caracteres especiais
 */
export function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Trunca uma string para o tamanho máximo especificado
 * @param str String a ser truncada
 * @param maxLength Tamanho máximo da string
 * @param addEllipsis Se deve adicionar reticências no final
 * @returns String truncada
 */
export function truncateString(str: string, maxLength: number, addEllipsis = true): string {
  if (!str || str.length <= maxLength) return str;
  
  return str.slice(0, maxLength) + (addEllipsis ? '...' : '');
}

/**
 * Atrasa a execução por um tempo determinado
 * @param ms Tempo em milissegundos
 * @returns Promise que resolve após o tempo especificado
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 
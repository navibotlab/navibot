/**
 * Utilitário para auditar logs e verificar vazamento de dados sensíveis
 * 
 * Este utilitário pode ser usado durante o desenvolvimento para verificar 
 * se logs estão sendo gerados corretamente e sem vazamento de dados sensíveis.
 */

import { maskSensitiveData } from './security';

// Importação condicional do fs (apenas para o servidor)
let fs: any;
if (typeof window === 'undefined') {
  // Estamos no servidor, podemos importar o módulo fs
  fs = require('fs');
}

// Palavras-chave que indicam dados potencialmente sensíveis
const SENSITIVE_PATTERNS = [
  /usr_[a-f0-9-]{8,}/i,           // IDs de usuário
  /ws_[a-f0-9-]{8,}/i,            // IDs de workspace
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i, // Emails
  /token\s*[:=]\s*["']?[a-zA-Z0-9_.-]{10,}["']?/i,   // Tokens
  /password\s*[:=]\s*["']?[^\s"']{3,}["']?/i,        // Senhas
  /key\s*[:=]\s*["']?[a-zA-Z0-9_.-]{10,}["']?/i      // Chaves de API
];

// Função para verificar se uma string contém dados sensíveis
export function containsSensitiveData(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(str)) {
      return true;
    }
  }
  
  return false;
}

// Função para monitorar logs no console durante o desenvolvimento
export function setupLogMonitor(env: 'development' | 'test' = 'development') {
  // Garantir que só é executado no navegador
  if (typeof window === 'undefined') {
    console.log('Monitor de logs não iniciado: ambiente de servidor');
    return;
  }
  
  if (env !== 'development') {
    console.log('Monitor de logs não iniciado: ambiente não é desenvolvimento');
    return;
  }
  
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Função para verificar o log
  const checkLog = (...args: any[]) => {
    for (const arg of args) {
      if (typeof arg === 'string' && containsSensitiveData(arg)) {
        console.warn(`⚠️ ALERTA DE SEGURANÇA: Possível vazamento de dados sensíveis no log:`, 
          maskSensitiveData({ data: arg }));
        console.trace('Origem do log potencialmente inseguro:');
      }
      else if (typeof arg === 'object' && arg !== null) {
        const json = JSON.stringify(arg);
        if (containsSensitiveData(json)) {
          console.warn(`⚠️ ALERTA DE SEGURANÇA: Possível vazamento de dados sensíveis no log:`, 
            maskSensitiveData({ data: arg }));
          console.trace('Origem do log potencialmente inseguro:');
        }
      }
    }
  };
  
  // Sobrescrever console.log
  console.log = function(...args) {
    checkLog(...args);
    originalConsoleLog.apply(console, args);
  };
  
  // Sobrescrever console.error
  console.error = function(...args) {
    checkLog(...args);
    originalConsoleError.apply(console, args);
  };
  
  // Sobrescrever console.warn
  console.warn = function(...args) {
    checkLog(...args);
    originalConsoleWarn.apply(console, args);
  };
  
  originalConsoleLog('🔍 Monitor de logs ativado - verificando vazamento de dados sensíveis');
}

/**
 * Função para análise retrospectiva de logs em um arquivo
 * Útil para analisar logs salvos em arquivos
 * IMPORTANTE: Esta função só funciona no ambiente do servidor (Node.js)
 */
export async function auditLogFile(filePath: string): Promise<{
  totalLines: number,
  suspiciousLines: number,
  suspiciousContent: Array<{line: number, content: string}>
}> {
  // Verificar se estamos no ambiente de servidor
  if (typeof window !== 'undefined') {
    throw new Error('auditLogFile só pode ser executado no servidor (Node.js)');
  }
  
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const suspicious: Array<{line: number, content: string}> = [];
    
    lines.forEach((line: string, index: number) => {
      if (containsSensitiveData(line)) {
        suspicious.push({
          line: index + 1,
          content: line
        });
      }
    });
    
    return {
      totalLines: lines.length,
      suspiciousLines: suspicious.length,
      suspiciousContent: suspicious
    };
  }
  catch (error) {
    console.error('Erro ao auditar arquivo de log:', error);
    throw error;
  }
} 
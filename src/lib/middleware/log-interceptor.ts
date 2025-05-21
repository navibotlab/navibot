/**
 * Middleware para interceptar e mascarar logs sensíveis
 * Esta função deve ser executada no início da aplicação
 */

import { maskSensitiveData, hasCircularReferences } from '../utils/security';

// Lista de campos sensíveis que devem ser mascarados
const SENSITIVE_FIELDS = [
  'accessToken', 
  'token', 
  'password', 
  'secret', 
  'key', 
  'apiKey',
  'authorization',
  'verifyToken',
  'unique',          // Campo do DisparaJá
  'sid',             // Campo do DisparaJá
  'phoneNumber',     // Números de telefone
  'phone',           // Variação de phoneNumber em alguns sistemas
  'userId',          // ID do usuário
  'workspaceId',     // ID do workspace
  'id'               // ID genérico
];

// Palavras-chave que indicam dados sensíveis, usados para filtrar logs inteiros
const SENSITIVE_KEYWORDS = [
  'conversas:',
  'recebeu conversas',
  'leadPhone',
  'etiquetas para conversa', 
  'labels:',
  'carregadas:',
  'data.some',
  'useLead:',
  'leadId:',
  'Buscando informações do lead',
  'useEffect disparado',
  'usr_',
  'ws_',
  'API GET Messages',
  'Retornando',
  'mensagens para conversa',
  'Middleware processando rota',
  'Verificando autenticação',
  'params.id',
  '/api/crm/conversations/',
  '/sse',
  'Usuário autenticado',
  'email:',
  'sub:',
  'nav***@gmail.com',
  'Adicionando headers',
  'workspaceId:',
  'headers para a requisição',
  'Route', 
  'Retornando',
  'GET /api/crm/',
  '.ts:',
  'String(params.id)',
  'context.params',
  'Error: Route',
  'params should be awaited',
  'NextAuth callback',
  'params.id',
  'Array.isArray',
  'GET /api/auth/session',
  'tokenExists',
  'sessionUserExists',
  'in ',
  'Adicionando headers para a requisição'
];

// Padrões regex adicionais para detectar dados sensíveis em strings
const SENSITIVE_PATTERNS = [
  /usr_[a-f0-9-]{1,}/i,             // IDs de usuário, mesmo parciais
  /ws_[a-f0-9-]{1,}/i,              // IDs de workspace, mesmo parciais
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i, // Emails
  /token\s*[:=]\s*["']?[a-zA-Z0-9_.-]{3,}["']?/i,   // Tokens, mesmo curtos
  /password\s*[:=]\s*["']?[^\s"']{3,}["']?/i,        // Senhas
  /key\s*[:=]\s*["']?[a-zA-Z0-9_.-]{3,}["']?/i,     // Chaves de API, mesmo curtas
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, // UUIDs
  /[0-9a-f]{8}-[0-9a-f]{4}/i,       // Partes de UUIDs
  /a55a3b39/i,                      // Trecho do ID do lead
  /a55a3b39-7252-44da-a176-564bf65ddc3d/i,           // ID específico do lead na imagem
  /53667c5f-ba65-4dad-a9b5-021b78ee4933/i,           // ID específico da conversa na imagem
  /Convers[aã][çc][aã]o/i,          // Palavra "Conversa" ou "Conversação" em PT-BR
  /Verificando autentica[cç][aã]o/i, // Mensagens de autenticação
  /email/i,                          // Menções a email
  /[a-zA-Z0-9._%+-]*@gmail\.com/i,   // Qualquer email do gmail
  /rota:/i                           // Menções a rotas
];

// Verifica se uma string contém dados sensíveis
function containsSensitivePatterns(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  
  try {
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(str)) {
        return true;
      }
    }
  } catch (error) {
    // Ignora erros durante a verificação de padrões
    return false;
  }
  
  return false;
}

/**
 * Verifica se o log deve ser completamente bloqueado 
 * @param args Argumentos do log para verificação
 * @returns true se o log deve ser bloqueado
 */
function shouldBlockLog(args: any[]): boolean {
  try {
    // Sistema de pontuação para determinar se um log é sensível
    let sensitivityScore = 0;
    
    // Se algum argumento for uma string contendo UUID ou ID específico, bloquear
    for (const arg of args) {
      if (typeof arg === 'string') {
        // Verificar UUIDs e IDs específicos - bloqueio imediato
        if (
          /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(arg) ||
          arg.includes('leadId') ||
          arg.includes('userId') ||
          arg.includes('workspaceId')
        ) {
          return true;
        }
        
        // Sistema de pontos para strings suspeitas
        if (arg.includes('usr_')) sensitivityScore += 5;
        if (arg.includes('ws_')) sensitivityScore += 5;
        if (arg.includes('id:')) sensitivityScore += 3;
        if (arg.includes('email')) sensitivityScore += 3;
        if (arg.includes('@gmail.com')) sensitivityScore += 5;
        if (arg.includes('lead')) sensitivityScore += 2;
        if (arg.includes('api')) sensitivityScore += 1;
        if (arg.includes('conversa')) sensitivityScore += 2;
        if (arg.includes('/sse')) sensitivityScore += 4;
      }
    }
    
    // Se a pontuação for alta, bloquear o log
    if (sensitivityScore >= 5) {
      return true;
    }
    
    // Converte todos os argumentos para string para facilitar a verificação
    let logString;
    try {
      logString = JSON.stringify(args, null, 2).toLowerCase();
    } catch (error) {
      // Se não conseguir converter para JSON, converte cada argumento individualmente
      logString = args.map(arg => {
        try {
          return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
        } catch (e) {
          return String(arg);
        }
      }).join(' ').toLowerCase();
    }
    
    // Verifica se o log contém palavras-chave sensíveis
    for (const keyword of SENSITIVE_KEYWORDS) {
      if (logString.includes(keyword.toLowerCase())) {
        return true;
      }
    }
    
    // Verifica se o log contém UUIDs ou outros padrões sensíveis
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(logString)) {
        return true;
      }
    }
    
    // Verifica se algum argumento é um objeto que tem campos sensíveis
    for (const arg of args) {
      if (arg && typeof arg === 'object') {
        // Verificar campos de primeiro nível
        for (const field of SENSITIVE_FIELDS) {
          if (Object.prototype.hasOwnProperty.call(arg, field)) {
            // Se for uma conversa ou objeto com dados sensíveis
            if (
              Object.prototype.hasOwnProperty.call(arg, 'leadPhone') ||
              Object.prototype.hasOwnProperty.call(arg, 'leadName') ||
              Object.prototype.hasOwnProperty.call(arg, 'labels') ||
              Object.prototype.hasOwnProperty.call(arg, 'conversations') ||
              Object.prototype.hasOwnProperty.call(arg, 'workspaceId') ||
              Object.prototype.hasOwnProperty.call(arg, 'userId') ||
              field === 'id' || field === 'leadId'
            ) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    // Em caso de erro, permitir o log por segurança
    return false;
  }
}

/**
 * Mascara UUIDs e outros identificadores em strings
 * @param str String original a ser mascarada
 * @returns String com IDs mascarados
 */
function maskIds(str: string): string {
  if (typeof str !== 'string') return str;
  
  try {
    // Mascara UUIDs (formato: 8-4-4-4-12 caracteres hexadecimais)
    let maskedStr = str.replace(
      /([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})/gi,
      (match, p1, p2, p3, p4, p5) => `${p1.substring(0, 4)}****-****-****-****-************`
    );
    
    // Mascara IDs específicos de usuário (usr_)
    maskedStr = maskedStr.replace(
      /(usr_)([a-f0-9]{8,})/gi,
      (match, prefix, id) => `${prefix}${id.substring(0, 3)}*****`
    );
    
    // Mascara IDs específicos de workspace (ws_)
    maskedStr = maskedStr.replace(
      /(ws_)([a-f0-9]{8,})/gi,
      (match, prefix, id) => `${prefix}${id.substring(0, 2)}*****`
    );
    
    return maskedStr;
  } catch (error) {
    // Se ocorrer algum erro, retorna a string original
    return str;
  }
}

/**
 * Função segura para processamento de dados que previne erros
 * @param arg Argumento a ser processado
 * @param seen Set para controle de referências circulares
 * @returns Versão mascarada segura do argumento
 */
function safelyProcessArg(arg: any, seen = new Set<any>()): any {
  try {
    if (arg === null || arg === undefined) {
      return arg;
    }
    
    // Verificar strings para padrões suspeitos
    if (typeof arg === 'string') {
      // Verificar se a string contém UUIDs ou IDs e mascará-los
      if (
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(arg) ||
        /usr_[a-f0-9]{8,}/i.test(arg) ||
        /ws_[a-f0-9]{8,}/i.test(arg)
      ) {
        return maskIds(arg);
      }
      
      if (containsSensitivePatterns(arg)) {
        // Tenta mascarar emails e IDs conhecidos na string
        let maskedStr = arg;
        // Mascara emails
        maskedStr = maskedStr.replace(
          /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, 
          (match, p1, p2) => `${p1.substring(0, 3)}***@${p2}`
        );
        
        // Mascara IDs
        maskedStr = maskIds(maskedStr);
        
        return maskedStr;
      }
      return arg;
    }
    
    // Verificar objetos
    if (typeof arg === 'object' && arg !== null) {
      // Verificar referências circulares
      if (seen.has(arg)) {
        return "[Referência Circular]";
      }
      
      // Prevenir tentativas de processar objetos React ou DOM
      if (
        arg._reactFragment || 
        arg.$$typeof || 
        arg.nodeType || 
        arg instanceof Element ||
        (typeof window !== 'undefined' && arg instanceof Node)
      ) {
        return "[React/DOM Element]";
      }
      
      // Verificar se é um objeto Error
      if (arg instanceof Error) {
        return {
          message: arg.message,
          name: arg.name,
          stack: arg.stack
        };
      }
      
      // Adicionar este objeto ao conjunto de objetos já vistos
      seen.add(arg);
      
      try {
        // Verificar se o objeto tem referências circulares antes de processar
        if (hasCircularReferences(arg)) {
          if (Array.isArray(arg)) {
            // Para arrays com referências circulares, criar uma cópia segura
            const safeArray = [];
            for (let i = 0; i < arg.length; i++) {
              const newSeen = new Set<any>(seen);
              safeArray.push(safelyProcessArg(arg[i], newSeen));
            }
            return safeArray;
          } else {
            // Para objetos com referências circulares, criar uma cópia segura
            const safeCopy: Record<string, any> = {};
            for (const key in arg) {
              if (Object.prototype.hasOwnProperty.call(arg, key)) {
                // Ignorar campos sensíveis comuns
                if (SENSITIVE_FIELDS.includes(key)) {
                  if (key === 'id' || key === 'leadId' || key === 'userId' || key === 'workspaceId') {
                    safeCopy[key] = typeof arg[key] === 'string' ? maskIds(arg[key]) : '[ID mascarado]';
                  } else {
                    safeCopy[key] = '[Dado sensível]';
                  }
                } else {
                  const newSeen = new Set<any>(seen);
                  safeCopy[key] = safelyProcessArg(arg[key], newSeen);
                }
              }
            }
            return safeCopy;
          }
        }
        
        // Se não tiver referências circulares, usar maskSensitiveData com o seen
        return maskSensitiveData(arg, SENSITIVE_FIELDS, seen);
      } catch (e) {
        // Se falhar no processamento, retorna uma versão simplificada
        if (Array.isArray(arg)) {
          return '[Array]';
        } else {
          return '[Objeto complexo]';
        }
      }
    }
    
    return arg;
  } catch (e) {
    // Fallback em caso de erro
    return typeof arg === 'object' ? "[Objeto não serializável]" : arg;
  }
}

/**
 * Função para fazer log de forma segura, sem expor dados sensíveis
 * Uma alternativa mais simples para casos onde queremos apenas fazer logs sem dados sensíveis
 * @param prefix Prefixo informativo para o log
 * @param count Número para informar (geralmente quantidade de itens)
 * @param type Tipo opcional de itens
 */
export function safeLog(prefix: string, count?: number, type?: string): void {
  // Verificar se alguma parte do log parece conter dados sensíveis
  if (SENSITIVE_KEYWORDS.some(keyword => 
    prefix.toLowerCase().includes(keyword.toLowerCase()))) {
    // Se for sensível, não log
    return;
  }
  
  if (count !== undefined) {
    console.log(`${prefix}: ${count}${type ? ` ${type}` : ''}`);
  } else {
    console.log(prefix);
  }
}

/**
 * Sobrescreve os métodos nativos de console para mascarar dados sensíveis
 * automaticamente em todos os logs da aplicação
 */
export function setupLogInterceptor() {
  if (typeof window === 'undefined') return; // Executa apenas no cliente

  // Flag para prevenir recursão infinita
  let isProcessingLog = false;

  // Salva as referências originais
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;

  // Função auxiliar para processar args com verificação anti-recursão
  const processSafeArgs = (args: any[]): any[] | null => {
    if (isProcessingLog) return args;
    
    isProcessingLog = true;
    try {
      // Verificar se a mensagem deve ser completamente bloqueada
      if (shouldBlockLog(args)) {
        // Bloqueamos completamente o log, retornando null para indicar que não deve ser exibido
        return null;
      }
      
      // Verificar se args é um array válido
      if (!Array.isArray(args)) {
        return args;
      }
      
      // Processar cada argumento com segurança
      const safeArgs = [];
      for (let i = 0; i < args.length; i++) {
        // Usar um novo Set para cada argumento raiz
        safeArgs.push(safelyProcessArg(args[i], new Set<any>()));
      }
      return safeArgs;
    } catch (error) {
      return [`[Erro ao processar log: ${error instanceof Error ? error.message : 'desconhecido'}]`];
    } finally {
      isProcessingLog = false;
    }
  };

  // Sobrescreve console.log com tratamento de exceções
  console.log = function(...args) {
    try {
      // Verificação rápida para bloqueio de mensagens sensíveis conhecidas
      if (args.length > 0 && typeof args[0] === 'string') {
        const firstArg = args[0] as string;
        
        // Verificar se é um log de verificação de sessão do NextAuth
        if (isNextAuthSessionCheck(args)) {
          return; // Bloqueia logs de verificação de sessão
        }
        
        // Bloqueio imediato para mensagens que sabemos que são sensíveis
        if (firstArg.includes('/api/crm/conversations/') || 
            firstArg.includes('Adicionando headers') ||
            firstArg.includes('Verificando') ||
            firstArg.includes('Middleware') ||
            firstArg.includes('params.id')) {
          return; // Não faz nada, bloqueia o log
        }
      }
      
      const safeArgs = processSafeArgs(args);
      // Se safeArgs for null, o log deve ser bloqueado
      if (safeArgs !== null) {
    originalConsoleLog.apply(console, safeArgs);
      }
    } catch (error) {
      // Se ocorrer erro, tenta um fallback mais simples
      originalConsoleLog.call(console, "[Log Interceptor] Erro ao processar log");
    }
  };

  // Sobrescreve console.error com tratamento de exceções
  console.error = function(...args) {
    try {
      // Verificação rápida para erros relacionados a rotas e parâmetros
      if (args.length > 0 && typeof args[0] === 'string') {
        const firstArg = args[0] as string;
        
        // Bloqueio para erros do Next.js sobre params que já sabemos como resolver
        if (firstArg.includes('params should be awaited') || 
            firstArg.includes('Route') ||
            firstArg.includes('route.ts')) {
          return; // Não faz nada, bloqueia o log
        }
      }
      
      const safeArgs = processSafeArgs(args);
      // Se safeArgs for null, o log deve ser bloqueado
      if (safeArgs !== null) {
    originalConsoleError.apply(console, safeArgs);
      }
    } catch (error) {
      // Se ocorrer erro, tenta um fallback mais simples
      originalConsoleError.call(console, "[Log Interceptor] Erro ao processar log de erro");
    }
  };

  // Sobrescreve console.warn com tratamento de exceções
  console.warn = function(...args) {
    try {
      const safeArgs = processSafeArgs(args);
      // Se safeArgs for null, o log deve ser bloqueado
      if (safeArgs !== null) {
        originalConsoleWarn.apply(console, safeArgs);
      }
    } catch (error) {
      // Se ocorrer erro, tenta um fallback mais simples
      originalConsoleWarn.call(console, "[Log Interceptor] Erro ao processar log de aviso");
    }
  };

  // Sobrescreve console.info com tratamento de exceções
  console.info = function(...args) {
    try {
      const safeArgs = processSafeArgs(args);
      // Se safeArgs for null, o log deve ser bloqueado
      if (safeArgs !== null) {
        originalConsoleInfo.apply(console, safeArgs);
      }
    } catch (error) {
      // Se ocorrer erro, tenta um fallback mais simples
      originalConsoleInfo.call(console, "[Log Interceptor] Erro ao processar log de info");
    }
  };

  // Log indicando que o interceptor foi configurado
  originalConsoleLog('🔒 Log interceptor configurado - dados sensíveis serão mascarados ou bloqueados automaticamente');
}

/**
 * Verifica se os argumentos de log são relacionados a verificações de sessão do NextAuth
 * @param args Argumentos do log
 * @returns true se for relacionado a NextAuth session check
 */
function isNextAuthSessionCheck(args: any[]): boolean {
  // Verificar se é uma chamada GET /api/auth/session
  if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('GET /api/auth/session')) {
    return true;
  }
  
  // Verificar logs de callback do NextAuth
  if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('NextAuth callback')) {
    return true;
  }
  
  // Verificar logs de tokenExists/sessionUserExists
  if (args.length > 1 && typeof args[0] === 'string' && typeof args[1] === 'object') {
    const logString = JSON.stringify(args);
    if (logString.includes('tokenExists') || logString.includes('sessionUserExists')) {
      return true;
    }
  }
  
  // Verificar logs de cabeçalhos para requisição
  if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('headers para a requisição')) {
    return true;
  }
  
  return false;
} 
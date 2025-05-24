'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, useSession } from 'next-auth/react'

// Componente simplificado de login
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [environment, setEnvironment] = useState('');
  const router = useRouter();
  const { status } = useSession(); // Adicionando useSession para verificar status da autenticação

  // Detectar ambiente ao carregar o componente
  useEffect(() => {
    const host = window.location.host;
    const isProduction = host.includes('app.navibot.com.br');
    const isDevelopment = host.includes('localhost') || host.includes('127.0.0.1');
    setEnvironment(isProduction ? 'Produção' : (isDevelopment ? 'Desenvolvimento' : 'Desconhecido'));
    
    // Função para obter valor de cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    
    // Função para remover cookie
    const deleteCookie = (name: string) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    };
    
    // Verificar se há credenciais nos cookies (vindas do middleware)
    const tempEmail = getCookie('temp_email');
    const tempPassword = getCookie('temp_password');
    const autoLogin = getCookie('auto_login');
    
    if (tempEmail && tempPassword && autoLogin === 'true') {
      console.log('Credenciais encontradas nos cookies, fazendo login automático');
      
      const decodedEmail = decodeURIComponent(tempEmail);
      const decodedPassword = decodeURIComponent(tempPassword);
      
      setEmail(decodedEmail);
      setPassword(decodedPassword);
      
      // Limpar cookies
      deleteCookie('temp_email');
      deleteCookie('temp_password');
      deleteCookie('auto_login');
      
      // Fazer login automático imediatamente
      handleAutoLogin(decodedEmail, decodedPassword);
    }
    
    // Se já estiver autenticado, redirecionar para o dashboard
    if (status === 'authenticated') {
      console.log('Usuário já autenticado, redirecionando para dashboard');
      router.replace('/admin/dashboard');
    }
  }, [status, router]);

  // Função para login automático
  const handleAutoLogin = async (emailParam: string, passwordParam: string) => {
    try {
      setIsLoading(true);
      setDebugInfo('Fazendo login automático...');
      
      const result = await signIn('credentials', {
        redirect: false,
        email: emailParam,
        password: passwordParam,
        callbackUrl: '/admin/dashboard'
      });
      
      if (result?.error) {
        setError('Erro no login automático: ' + result.error);
        setIsLoading(false);
      } else if (result?.ok) {
        setDebugInfo('Login automático bem-sucedido! Redirecionando...');
        router.push('/admin/dashboard');
      }
    } catch (err) {
      setError('Erro no login automático');
      setIsLoading(false);
    }
  };

  // Função para debug de login
  const handleDebugLogin = async () => {
    if (!email || !password) {
      setError('Email e senha necessários para debug');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setDebugInfo('Iniciando debug de login...');
      
      // Log detalhado para debug
      const environment = window.location.host.includes('app.navibot.com.br') ? 'produção' : 'desenvolvimento';
      console.warn(`🔬 DEBUG: Iniciando debug em ${environment}`);
      console.warn(`🔬 DEBUG: URL da API: ${window.location.origin}/api/debug-login`);
      
      const response = await fetch('/api/debug-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      console.warn(`🔬 DEBUG: Response status: ${response.status}`);
      console.warn(`🔬 DEBUG: Response ok: ${response.ok}`);
      
      if (!response.ok) {
        console.error(`🔬 DEBUG: Response não ok. Status: ${response.status}`);
        const errorText = await response.text();
        console.error(`🔬 DEBUG: Error response text:`, errorText);
        
        setError(`Erro na API de debug: ${response.status} - ${errorText}`);
        setDebugInfo(`Debug falhou: HTTP ${response.status}`);
        return;
      }
      
      const debugData = await response.json();
      
      console.warn(`🔬 DEBUG: Response data:`, debugData);
      
      const debugElement = document.getElementById('debug-output');
      if (debugElement) {
        debugElement.innerHTML = `
          <div class="text-xs space-y-1">
            <div><strong>Ambiente:</strong> ${debugData.environment || 'undefined'}</div>
            <div><strong>Vercel Env:</strong> ${debugData.vercel_env || 'undefined'}</div>
            <div><strong>Timestamp:</strong> ${debugData.timestamp || 'undefined'}</div>
            <div><strong>Passo:</strong> ${debugData.step || 'undefined'}</div>
            <div><strong>Sucesso:</strong> ${debugData.success ? '✅' : '❌'}</div>
            <div><strong>Conexão BD:</strong> ${debugData.dbConnection ? '✅' : '❌'}</div>
            <div><strong>Usuário Encontrado:</strong> ${debugData.userFound ? '✅' : '❌'}</div>
            <div><strong>Usuário Ativo:</strong> ${debugData.userActive ? '✅' : '❌'}</div>
            <div><strong>Senha Válida:</strong> ${debugData.passwordValid ? '✅' : '❌'}</div>
            <div><strong>NEXTAUTH_URL:</strong> ${debugData.env_vars?.nextauth_url || 'não definida'}</div>
            <div><strong>DATABASE_URL:</strong> ${debugData.env_vars?.database_url_preview || 'não definida'}</div>
            ${debugData.error ? `<div class="text-red-400"><strong>Erro:</strong> ${debugData.error}</div>` : ''}
            ${debugData.user ? `<div class="text-green-400"><strong>Usuário:</strong> ${debugData.user.email} (${debugData.user.role})</div>` : ''}
          </div>
        `;
        debugElement.className = debugData.success 
          ? 'text-xs p-2 bg-gray-900 text-green-400 rounded' 
          : 'text-xs p-2 bg-gray-900 text-red-400 rounded';
      }
      
      setDebugInfo(`Debug concluído: ${debugData.success ? 'SUCESSO' : 'FALHA'} - Passo: ${debugData.step || 'undefined'}`);
      
    } catch (error) {
      console.error(`🔬 DEBUG: Exceção capturada:`, error);
      setError(`Erro no debug: ${error}`);
      setDebugInfo(`Erro no debug: ${error}`);
      
      // Mostrar erro detalhado no debug output
      const debugElement = document.getElementById('debug-output');
      if (debugElement) {
        debugElement.innerHTML = `
          <div class="text-xs space-y-1 text-red-400">
            <div><strong>Erro de Rede/Fetch:</strong></div>
            <div>${error}</div>
            <div><strong>Ambiente:</strong> ${environment}</div>
            <div><strong>Timestamp:</strong> ${new Date().toISOString()}</div>
            <div><strong>URL Base:</strong> ${window.location.origin}</div>
          </div>
        `;
        debugElement.className = 'text-xs p-2 bg-gray-900 text-red-400 rounded';
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Função simplificada para login
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
    }
    
    try {
      setIsLoading(true);
      setError('');
      const envInfo = `Ambiente: ${environment}`;
      setDebugInfo(`Iniciando login... ${envInfo}`);
      
      // Verificação básica
      if (!email || !password) {
        setError('Email e senha são obrigatórios');
        setIsLoading(false);
        return;
      }
      
      // Log diretamente no DOM para diagnóstico
      const debugElement = document.getElementById('debug-output');
      if (debugElement) {
        debugElement.innerText = `Tentando autenticar... ${envInfo}`;
        debugElement.className = 'text-xs p-2 bg-gray-900 text-green-400 rounded';
      }
      
      // NOVA ABORDAGEM: Usar signIn com método POST adequado
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false, // Não redirecionar automaticamente
        callbackUrl: '/admin/dashboard'
      });
      
      // Atualizar informações de debug
      const responseInfo = `Resposta: ${JSON.stringify({
        ok: result?.ok,
        error: result?.error,
        status: result?.status,
        url: result?.url
      })}`;
      setDebugInfo(`${envInfo}. ${responseInfo}`);
      if (debugElement) {
        debugElement.innerText += `\n${responseInfo}`;
      }
      
      // Verificar resultado
      if (!result) {
        setError('Erro de autenticação: resposta vazia');
        setIsLoading(false);
        return;
      }
      
      if (result.error) {
        setError(result.error === 'CredentialsSignin' 
          ? 'Email ou senha incorretos' 
          : `Erro: ${result.error}`);
        setIsLoading(false);
        return;
      }
      
      // Sucesso - forçar navegação para dashboard
      setDebugInfo(`${envInfo}. Login bem-sucedido! Redirecionando...`);
      if (debugElement) {
        debugElement.innerText += '\nLogin bem-sucedido! Redirecionando...';
        debugElement.className = 'text-xs p-2 bg-gray-900 text-green-400 rounded';
      }
      
      // Usar window.location.href para redirecionamento mais confiável
      window.location.href = '/admin/dashboard';
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Falha no login: ${message}`);
      setDebugInfo(`Ambiente: ${environment}. Exceção: ${message}`);
      setIsLoading(false);
      
      const debugElement = document.getElementById('debug-output');
      if (debugElement) {
        debugElement.innerText += `\nExceção: ${message}`;
        debugElement.className = 'text-xs p-2 bg-gray-900 text-red-400 rounded';
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
      <div className="max-w-md w-full space-y-8 p-8 bg-[#1A1D24] rounded-lg shadow-lg border border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white text-center">
            Painel Administrativo
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Faça login para acessar
          </p>
          {environment && (
            <p className="text-center text-xs text-blue-400 mt-1">
              Ambiente: {environment}
            </p>
          )}
        </div>

        {/* Usando uma abordagem direta com um formulário tradicional */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded-md border border-red-900/50">
              {error}
            </div>
          )}

          {debugInfo && (
            <div className="text-yellow-500 text-xs text-center bg-yellow-900/20 p-2 rounded-md border border-yellow-900/50 break-words">
              <strong>Debug:</strong> {debugInfo}
            </div>
          )}

          {/* Área de debug para diagnóstico - visível agora */}
          <div id="debug-output" className="text-xs p-2 bg-gray-900 text-green-400 rounded"></div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </div>

          <div className="text-center mt-4">
            <Link 
              href="/esqueci-senha" 
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Esqueci minha senha
            </Link>
          </div>
        </form>

        {/* Botões alternativos e de diagnóstico */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={handleDebugLogin}
            disabled={isLoading}
            className="text-xs text-center w-full text-orange-400 hover:text-orange-300 bg-orange-900/20 p-2 rounded border border-orange-900/50 disabled:opacity-50"
          >
            🔬 Debug Completo de Login
          </button>
          
          <button
            type="button"
            onClick={async () => {
              console.warn('🧪 Testando API simples...');
              try {
                const response = await fetch('/api/debug-simple', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                console.warn('🧪 API simples response:', data);
                
                const debugElement = document.getElementById('debug-output');
                if (debugElement) {
                  debugElement.innerHTML = `
                    <div class="text-xs space-y-1 text-blue-400">
                      <div><strong>API Simples Teste:</strong></div>
                      <div>Status: ${response.status}</div>
                      <div>Funcionando: ${data.api_working ? '✅' : '❌'}</div>
                      <div>Ambiente: ${data.environment}</div>
                      <div>Vercel: ${data.vercel_env}</div>
                      <div>DATABASE_URL: ${data.env_vars?.database_url_exists ? '✅' : '❌'}</div>
                    </div>
                  `;
                  debugElement.className = 'text-xs p-2 bg-gray-900 text-blue-400 rounded';
                }
                setDebugInfo(`API Simples: ${data.api_working ? 'FUNCIONANDO' : 'FALHOU'}`);
              } catch (error) {
                console.error('🧪 Erro na API simples:', error);
                setError(`Erro na API simples: ${error}`);
              }
            }}
            disabled={isLoading}
            className="text-xs text-center w-full text-blue-400 hover:text-blue-300 bg-blue-900/20 p-2 rounded border border-blue-900/50 disabled:opacity-50"
          >
            🧪 Testar API Simples
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            className="text-xs text-center w-full text-gray-400 hover:text-gray-300"
          >
            Tentar Método Alternativo
          </button>
          
          <Link
            href="/diagnostico-publico"
            className="block text-xs text-center w-full text-yellow-400 hover:text-yellow-300 mt-2"
          >
            Diagnosticar Problemas de Login
          </Link>
        </div>
      </div>
    </div>
  );
} 
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

// Componente simplificado de login
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [environment, setEnvironment] = useState('');
  const router = useRouter();

  // Detectar ambiente ao carregar o componente
  useEffect(() => {
    const host = window.location.host;
    const isProduction = host.includes('app.navibot.com.br');
    const isDevelopment = host.includes('localhost') || host.includes('127.0.0.1');
    setEnvironment(isProduction ? 'Produção' : (isDevelopment ? 'Desenvolvimento' : 'Desconhecido'));
  }, []);

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
      
      // Tentar fazer login
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl: '/admin' // Define o redirecionamento após o login bem-sucedido
      });
      
      // Atualizar informações de debug
      const responseInfo = `Resposta: ${JSON.stringify(result)}`;
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
      
      // Sucesso - redirecionar
      setDebugInfo(`${envInfo}. Login bem-sucedido! Redirecionando...`);
      if (debugElement) {
        debugElement.innerText += '\nLogin bem-sucedido! Redirecionando...';
      }
      
      // Redirecionar diretamente usando router.push para evitar parâmetros na URL
      router.push('/admin');
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Falha no login: ${message}`);
      setDebugInfo(`Ambiente: ${environment}. Exceção: ${message}`);
      setIsLoading(false);
      
      const debugElement = document.getElementById('debug-output');
      if (debugElement) {
        debugElement.innerText += `\nExceção: ${message}`;
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
'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { safeLog } from '@/lib/utils/security'

// Componente principal com Suspense
export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-white">Carregando...</span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

// Componente com o formulário e lógica
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Verificar se estamos em produção ou desenvolvimento
  useEffect(() => {
    const host = window.location.host;
    const isProd = host.includes('app.navibot.com.br');
    console.log(`Ambiente: ${isProd ? 'Produção' : 'Desenvolvimento'}`);
  }, []);

  // Função de login com melhor tratamento de erros
  const handleLogin = async () => {
    try {
      // Validação básica
      if (!email || !password) {
        setError('Email e senha são obrigatórios');
        return;
      }

      setError('');
      setDebugInfo('');
      setIsLoading(true);

      console.log('1. Iniciando tentativa de login');
      
      // Registrar informação de debug no cliente
      setDebugInfo(prev => prev + '1. Tentando login... ');

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      console.log('2. Resposta do signIn:', result);
      setDebugInfo(prev => prev + `2. Resposta: ${JSON.stringify(result)} `);
      
      if (!result) {
        console.error('Resultado do signIn é nulo ou indefinido');
        setError('Erro de autenticação: resposta vazia do servidor');
        setDebugInfo(prev => prev + '3. Erro: Resposta vazia ');
        setIsLoading(false);
        return;
      }

      if (result.error) {
        console.error('Erro ao fazer login:', result.error);
        
        if (result.error === 'CredentialsSignin') {
          setError('Email ou senha incorretos');
        } else {
          setError(`Erro de autenticação: ${result.error}`);
        }
        
        setDebugInfo(prev => prev + `3. Erro: ${result.error} `);
        setIsLoading(false);
        return;
      }

      console.log('3. Login bem-sucedido, redirecionando...');
      setDebugInfo(prev => prev + '3. Sucesso! Redirecionando... ');
      
      // Adicionar um pequeno atraso antes do redirecionamento
      setTimeout(() => {
        router.replace('/admin');
      }, 500);
      
    } catch (error) {
      // Capturar e registrar qualquer erro durante o processo
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('4. Exceção durante autenticação:', error);
      setError(`Ocorreu um erro ao fazer login: ${errorMessage}`);
      setDebugInfo(prev => prev + `4. Exceção: ${errorMessage} `);
      setIsLoading(false);
    }
  };

  // Manipulador para o evento onKeyDown para detectar Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevenir qualquer comportamento padrão
      if (email && password) {
        handleLogin();
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
        </div>

        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
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

          <div>
            <button
              type="button" 
              onClick={handleLogin}
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
        </div>

        <div className="text-center mt-4">
          <Link 
            href="/esqueci-senha" 
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Esqueci minha senha
          </Link>
        </div>
      </div>
    </div>
  );
} 
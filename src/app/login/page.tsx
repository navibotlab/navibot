'use client'

import { useState, Suspense } from 'react'
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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      safeLog('Login - Tentando autenticar com:', { email }, ['email']);
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });
      
      safeLog('Login - Resultado da autenticação:', result);

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError('Email ou senha incorretos');
        } else {
          setError('Erro de autenticação: ' + result.error);
        }
        setIsLoading(false);
        return;
      }

      safeLog('Login bem-sucedido, redirecionando...', { email }, ['email']);
      router.replace('/admin');
    } catch (error) {
      console.error('Login - Erro durante autenticação:', error);
      setError('Ocorreu um erro ao fazer login. Tente novamente mais tarde.');
      setIsLoading(false);
    }
  }

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

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
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
        </form>

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
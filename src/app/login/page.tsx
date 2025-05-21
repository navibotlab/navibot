'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { safeLog } from '@/lib/utils/security'

// Componentes personalizados para substituir o framer-motion
const FadeIn = ({ children, className = "", delay = 0 }: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`}
    >
      {children}
    </div>
  );
};

const SlideUp = ({ children, className = "", delay = 0 }: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const SlideDown = ({ children, className = "", delay = 0 }: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const AnimatedButton = ({ children, className = "", disabled = false, ...props }: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}) => {
  return (
    <button 
      className={`transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] ${className}`} 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const AnimatedLink = ({ children, className = "", href = "#", ...props }: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  [key: string]: any;
}) => {
  return (
    <a 
      href={href}
      className={`transition-transform duration-150 inline-block hover:scale-[1.05] active:scale-[0.95] ${className}`} 
      {...props}
    >
      {children}
    </a>
  );
};

const Switch = ({ checked, onChange, className = "" }: {
  checked: boolean;
  onChange: () => void;
  className?: string;
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-green-500' : 'bg-gray-500'
      } ${className}`}
    >
      <span 
        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200`}
        style={{ transform: `translateX(${checked ? '16px' : '4px'})` }}
      />
    </button>
  );
};

// Spinner animado sem usar framer-motion
const Spinner = () => (
  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

interface FormEvent extends React.FormEvent<HTMLFormElement> {
  preventDefault: () => void;
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  // Debug: mostrar status da sessão
  useEffect(() => {
    safeLog('Login page - Session status:', { status, session });
    if (session) {
      safeLog('Login page - User is authenticated, redirecting to admin', {
        user: session.user
      }, ['email']);
      router.replace('/admin');
    }
  }, [session, status, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      safeLog('Login - Tentando autenticar com:', { email }, ['email']);
      
      // Usar o Next Auth diretamente, que está configurado para usar a tabela users
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false // Desabilitar redirecionamento automático para tratarmos erros
      });
      
      safeLog('Login - Resultado da autenticação:', result);

      if (result?.error) {
        // Tratar diferentes tipos de erros
        if (result.error === 'CredentialsSignin') {
          setError('Email ou senha incorretos');
        } else {
          setError('Erro de autenticação: ' + result.error);
        }
        setIsLoading(false);
        return;
      }

      // Se chegou aqui, autenticação foi bem-sucedida
      safeLog('Login bem-sucedido, redirecionando...', { email }, ['email']);
      router.replace('/admin');
    } catch (error) {
      console.error('Login - Erro durante autenticação:', error);
      setError('Ocorreu um erro ao fazer login. Tente novamente mais tarde.');
      setIsLoading(false);
    }
  }

  return (
    <FadeIn className="min-h-screen flex items-center justify-center bg-[#0F1115]">
      <SlideUp 
        className="max-w-md w-full space-y-8 p-8 bg-[#1A1D24] rounded-lg shadow-lg border border-gray-800"
        delay={200}
      >
        <div>
          <SlideDown className="text-2xl font-bold text-white text-center">
            Painel Administrativo
          </SlideDown>
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
            <FadeIn className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded-md border border-red-900/50">
              {error}
            </FadeIn>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <span className="text-xs text-gray-400">Lembrar login</span>
            </div>

            <AnimatedLink
              href="/esqueci-senha"
              className="text-xs text-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
            >
              Esqueci minha senha
            </AnimatedLink>
          </div>

          <AnimatedButton
            type="submit"
            disabled={isLoading}
            className={`relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
              isLoading ? 'bg-blue-600/70 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200`}
          >
            {isLoading ? <Spinner /> : 'Entrar'}
          </AnimatedButton>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              Ainda não tem uma conta?{' '}
              <Link 
                href="/criar-conta"
                replace={true}
                className="text-blue-500 hover:text-blue-400 transition-colors font-medium"
              >
                Criar Conta Gratuita
              </Link>
            </p>
          </div>
        </form>
      </SlideUp>
    </FadeIn>
  )
} 
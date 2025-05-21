'use client'

import * as React from 'react'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Componente que acessa useSearchParams dentro de Suspense
function VerificarEmailWithParams() {
  const searchParams = useSearchParams()
  return <VerificarEmailContent searchParams={searchParams} />
}

// Componente principal com Suspense boundary
export default function VerificarEmail() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#0F1115]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-white">Carregando...</span>
      </div>
    }>
      <VerificarEmailWithParams />
    </Suspense>
  )
}

// Componentes personalizados para substituir o framer-motion
// Componente FadeIn
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

// Componente SlideUp
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

// Componente SlideDown
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

// Componente AnimatedButton 
const AnimatedButton = ({ 
  children, 
  className = "", 
  disabled = false, 
  type = "button",
  onClick,
  ...props 
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  [key: string]: any;
}) => {
  return (
    <button 
      type={type}
      className={`transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] ${className}`} 
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Componente principal agora recebe searchParams como props
const VerificarEmailContent = ({ searchParams }: { searchParams: ReturnType<typeof useSearchParams> }) => {
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Obter o email da URL se estiver presente
    const emailFromUrl = searchParams.get('email')
    if (emailFromUrl) {
      setEmail(emailFromUrl)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!token || !email) {
      setError('Email e token são obrigatórios')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/verificar-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar o email')
      }

      // Verificação bem-sucedida
      setIsSuccess(true)
      setTimeout(() => {
        router.push('/login?verified=true')
      }, 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao verificar o email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError('Email é obrigatório para reenviar o código')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reenviar-verificacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao reenviar o código de verificação')
      }

      // Mostrar mensagem de sucesso
      setError('') // Limpa qualquer erro anterior
      alert('Um novo código de verificação foi enviado para seu email')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao reenviar o código de verificação')
    } finally {
      setIsLoading(false)
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
            Verificar Email
          </SlideDown>
          <p className="mt-2 text-center text-sm text-gray-400">
            Digite o código de verificação enviado para seu email
          </p>
        </div>

        {isSuccess ? (
          <FadeIn
            className="text-green-500 bg-green-900/20 p-4 rounded-md border border-green-800 text-center"
          >
            <p className="font-medium">Email verificado com sucesso!</p>
            <p className="text-sm mt-1">Você será redirecionado para a página de login.</p>
          </FadeIn>
        ) : (
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
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || !!searchParams.get('email')}
                />
              </div>

              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-400 mb-1">
                  Código de Verificação
                </label>
                <input
                  id="token"
                  name="token"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder="Digite o código recebido por email"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <FadeIn
                className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded-md border border-red-900/50"
              >
                {error}
              </FadeIn>
            )}

            <div className="flex flex-col space-y-4">
              <AnimatedButton
                type="submit"
                disabled={isLoading}
                className={`relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  isLoading ? 'bg-blue-600/70 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Verificar Email'
                )}
              </AnimatedButton>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isLoading || !email}
                  className="text-blue-500 hover:text-blue-400 transition-colors disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  Não recebeu o código? Reenviar
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Voltar para{' '}
                  <Link href="/login" className="text-blue-500 hover:text-blue-400 transition-colors">
                    Login
                  </Link>
                </p>
              </div>
            </div>
          </form>
        )}
      </SlideUp>
    </FadeIn>
  );
}; 
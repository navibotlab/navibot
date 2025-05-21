'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

// Spinner animado sem usar framer-motion
const Spinner = () => (
  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/esqueci-senha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar a solicitação')
      }

      setSuccess(true)
    } catch (error) {
      setError('Não foi possível processar sua solicitação. Tente novamente.')
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
            Esqueci minha senha
          </SlideDown>
          <p className="mt-2 text-center text-sm text-gray-400">
            Digite seu email para receber as instruções
          </p>
        </div>

        {success ? (
          <FadeIn className="bg-green-900/20 border border-green-900/50 rounded-md p-4">
            <p className="text-green-500 text-center font-medium">Email enviado com sucesso!</p>
            <p className="text-green-400 text-sm text-center mt-2">
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </p>
            <div className="mt-4 flex justify-center">
              <AnimatedButton
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm"
              >
                Voltar para o login
              </AnimatedButton>
            </div>
          </FadeIn>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="seu@email.com"
                disabled={isLoading}
              />
            </div>

              {error && (
              <FadeIn className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded-md border border-red-900/50">
                  {error}
              </FadeIn>
              )}

            <div className="flex flex-col space-y-3">
              <AnimatedButton
                type="submit"
                disabled={isLoading}
                className={`relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  isLoading ? 'bg-blue-600/70 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200`}
              >
                {isLoading ? <Spinner /> : 'Enviar instruções'}
              </AnimatedButton>

              <div className="text-center mt-4">
                <a
                  href="/login"
                  className="text-sm text-blue-500 hover:text-blue-400 transition-colors"
              >
                Voltar para o login
                </a>
              </div>
            </div>
          </form>
        )}
      </SlideUp>
    </FadeIn>
  )
} 
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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

// Componente AnimatedPresence para gerenciar componentes que entram e saem
const AnimatedPresence = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Componente ErrorMessage animado
const AnimatedErrorMessage = ({ message, show }: { message: string; show: boolean }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show]);
  
  if (!show) return null;
  
  return (
    <div
      className={`text-red-500 text-xs mt-1 transition-all duration-300 ease-in-out overflow-hidden ${
        isVisible ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0'
      }`}
    >
      {message}
    </div>
  );
};

interface ValidationErrors {
  password?: string;
  confirmPassword?: string;
}

const RecuperarSenhaContent = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      router.push('/login')
    }
  }, [token, router])

  // Validação em tempo real
  useEffect(() => {
    const errors: ValidationErrors = {}
    
    if (password && password.length < 6) {
      errors.password = 'A senha deve ter pelo menos 6 caracteres'
    }
    
    if (confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem'
    }
    
    setValidationErrors(errors)
  }, [password, confirmPassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (Object.keys(validationErrors).length > 0) {
      return
    }
    
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/recuperar-senha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar a solicitação')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      setError('Não foi possível redefinir sua senha. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return null
  }

  return (
    <FadeIn className="min-h-screen flex items-center justify-center bg-[#0F1115]">
      <SlideUp
        className="max-w-md w-full space-y-8 p-8 bg-[#1A1D24] rounded-lg shadow-lg border border-gray-800"
        delay={200}
      >
        <div>
          <h1 className="text-2xl font-bold text-white text-center">
            Recuperar Senha
          </h1>
          <p className="mt-2 text-center text-sm text-gray-400">
            Digite sua nova senha
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
                  Nova Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    validationErrors.password ? 'border-red-500' : 'border-gray-700'
                  } rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors`}
                  placeholder="Digite sua nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <AnimatedPresence>
                  <AnimatedErrorMessage 
                    message={validationErrors.password || ''} 
                    show={!!validationErrors.password}
                  />
                </AnimatedPresence>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-1">
                  Confirme a Nova Senha
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-700'
                  } rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors`}
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                <AnimatedPresence>
                  <AnimatedErrorMessage 
                    message={validationErrors.confirmPassword || ''} 
                    show={!!validationErrors.confirmPassword}
                  />
                </AnimatedPresence>
              </div>
            </div>

            <AnimatedPresence>
              {error && (
                <FadeIn className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded-md border border-red-900/50">
                  {error}
                </FadeIn>
              )}
            </AnimatedPresence>

            <AnimatedButton
              type="submit"
              disabled={isLoading || Object.keys(validationErrors).length > 0}
              className={`relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading || Object.keys(validationErrors).length > 0
                  ? 'bg-blue-600/70 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Redefinir Senha'
              )}
            </AnimatedButton>
          </form>
        ) : (
          <FadeIn className="text-center space-y-6">
            <div className="rounded-full bg-green-500/20 p-4 mx-auto w-16 h-16 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white">Senha alterada!</h3>
              <p className="text-sm text-gray-400">
                Sua senha foi alterada com sucesso. Você será redirecionado para a página de login.
              </p>
            </div>
          </FadeIn>
        )}
      </SlideUp>
    </FadeIn>
  )
}

export default function RecuperarSenha() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#0F1115]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-white">Carregando...</span>
      </div>
    }>
      <RecuperarSenhaContent />
    </Suspense>
  )
} 
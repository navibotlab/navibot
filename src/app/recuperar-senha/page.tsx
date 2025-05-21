'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ValidationErrors {
  password?: string;
  confirmPassword?: string;
}

// Componente principal sem nenhum uso de hooks de roteamento
export default function RecuperarSenha() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-white">Carregando...</span>
      </div>
    }>
      <RecuperarSenhaForm />
    </Suspense>
  )
}

// Este componente é carregado com Suspense e é onde usamos useSearchParams
function RecuperarSenhaForm() {
  // Este componente importa useSearchParams somente quando realmente necessário
  // Isso ajuda a evitar os problemas de CSR bailout
  const { useSearchParams } = require('next/navigation')
  const searchParams = useSearchParams()
  const token = searchParams ? searchParams.get('token') : null
  
  // Se não tivermos token, apenas mostramos uma mensagem e um link para voltar
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
        <div className="max-w-md w-full space-y-8 p-8 bg-[#1A1D24] rounded-lg shadow-lg border border-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-white text-center">
              Token Inválido
            </h1>
            <p className="mt-2 text-center text-sm text-gray-400">
              O link de recuperação de senha é inválido ou expirou.
            </p>
          </div>
          
          <div className="text-center mt-4">
            <Link 
              href="/esqueci-senha"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md inline-block"
            >
              Solicitar novo link
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  // Se temos token, mostrar o formulário de redefinição
  return <RecuperarSenhaContent token={token} />
}

// Componente com a lógica do formulário - não usa useSearchParams diretamente
function RecuperarSenhaContent({ token }: { token: string }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const router = useRouter()

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
      <div className="max-w-md w-full space-y-8 p-8 bg-[#1A1D24] rounded-lg shadow-lg border border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-white text-center">
            Recuperar Senha
          </h1>
          <p className="mt-2 text-center text-sm text-gray-400">
            Digite sua nova senha
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6" method="post">
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
                {validationErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
                )}
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
                {validationErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
                )}
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
                disabled={isLoading || Object.keys(validationErrors).length > 0}
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
                  'Redefinir senha'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-green-900/20 border border-green-900/50 rounded-md p-4">
            <p className="text-green-500 text-center font-medium">Senha atualizada com sucesso!</p>
            <p className="text-green-400 text-sm text-center mt-2">
              Você será redirecionado para a página de login em instantes.
            </p>
          </div>
        )}

        <div className="text-center mt-4">
          <Link 
            href="/login"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  )
} 
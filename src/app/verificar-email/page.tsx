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
    const emailFromUrl = searchParams ? searchParams.get('email') : null
    if (emailFromUrl) {
      setEmail(emailFromUrl)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
      <div className="max-w-md w-full space-y-8 p-8 bg-[#1A1D24] rounded-lg shadow-lg border border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white text-center">
            Verificar Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Digite o código de verificação enviado para seu email
          </p>
        </div>

        {isSuccess ? (
          <div className="bg-green-900/20 border border-green-900/50 rounded-md p-4">
            <p className="text-green-500 text-center font-medium">Email verificado com sucesso!</p>
            <p className="text-green-400 text-sm text-center mt-2">
              Você será redirecionado para a página de login em instantes.
            </p>
          </div>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder="seu@email.com"
                  disabled={isLoading}
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
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder="Digite o código recebido por email"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded-md border border-red-900/50">
                {error}
              </div>
            )}

            <div className="flex flex-col space-y-3">
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
                  'Verificar Email'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="text-sm text-blue-400 hover:text-blue-300"
                  disabled={isLoading}
                >
                  Reenviar código de verificação
                </button>
              </div>

              <div className="text-center mt-4">
                <Link href="/login" className="text-sm text-blue-400 hover:text-blue-300">
                  Voltar para o login
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
} 
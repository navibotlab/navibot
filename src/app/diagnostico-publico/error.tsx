'use client'

import { useEffect } from 'react'

export default function DiagnosticoError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log do erro para console
    console.error('Erro na página de diagnóstico:', error)
  }, [error])

  // Função para limpar cookies
  const limparCookies = () => {
    const allCookies = document.cookie.split(';')
    allCookies.forEach(cookie => {
      const cookieName = cookie.split('=')[0].trim()
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
    })
    
    // Recarregar após limpar cookies
    setTimeout(() => {
      window.location.href = '/login'
    }, 1000)
  }

  // Acesso direto ao login
  const acessarLogin = () => {
    window.location.href = '/login'
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Erro no Diagnóstico</h1>
      
      <div className="bg-red-900/20 border border-red-600 p-4 rounded-md mb-6">
        <h2 className="text-lg font-semibold text-red-400">Ocorreu um erro</h2>
        <p className="text-red-300 mb-4">{error.message || 'Erro ao carregar a página de diagnóstico'}</p>
        
        <button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md mr-4"
        >
          Tentar Novamente
        </button>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-md mb-6">
        <h2 className="text-xl font-semibold mb-2">Ações Recomendadas</h2>
        <div className="space-y-4">
          <button 
            onClick={limparCookies}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md mr-4"
          >
            Limpar Cookies e ir para Login
          </button>
          
          <button 
            onClick={acessarLogin}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md"
          >
            Ir para Login
          </button>
        </div>
      </div>
      
      <div className="bg-gray-800/50 p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Informações Técnicas</h2>
        <p className="text-gray-400 mb-2">Erro: {error.name}</p>
        {error.digest && <p className="text-gray-400">Digest: {error.digest}</p>}
        <p className="text-gray-400 mt-4">URL: {typeof window !== 'undefined' ? window.location.href : ''}</p>
      </div>
    </div>
  )
} 
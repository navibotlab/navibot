'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'

// Declaração de tipos corrigida
declare global {
  interface Window {
    __NEXT_CHUNK_LOADED?: { [key: string]: boolean };
  }
}

export default function PaginaSegura() {
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Simular carregamento
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Função de incremento
  const increment = () => setCount(prev => prev + 1)
  // Função de decremento
  const decrement = () => setCount(prev => prev - 1)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-8">Página Segura de Teste</h1>
      
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Carregando...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-8">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl mb-4">Contador Seguro</h2>
            <div className="text-4xl font-bold mb-4">{count}</div>
            <div className="flex space-x-4">
              <button
                onClick={decrement}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Diminuir
              </button>
              <button
                onClick={increment}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Aumentar
              </button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center"
            >
              Voltar para Login
            </Link>
            <Link
              href="/conversas"
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-center"
            >
              Ir para Conversas
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
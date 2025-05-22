'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function IndexPage() {
  const router = useRouter()
  const { status } = useSession()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Adicionar proteção para evitar loops de redirecionamento
    // Verificar se existe um contador de redirecionamentos na sessão
    const redirectCount = parseInt(sessionStorage.getItem('redirectCount') || '0')
    
    // Se já redirecionou mais de 5 vezes (aumentado de 3 para 5), enviar para diagnóstico
    if (redirectCount > 5) {
      console.log('Muitos redirecionamentos detectados, enviando para diagnóstico')
      sessionStorage.removeItem('redirectCount')
      router.replace('/admin/dashboard')
      return
    }
    
    // Incrementar contador de redirecionamentos
    sessionStorage.setItem('redirectCount', (redirectCount + 1).toString())
    
    if (status === 'authenticated') {
      console.log('Usuário autenticado, redirecionando para admin')
      router.replace('/admin/dashboard')
    } else if (status === 'unauthenticated') {
      console.log('Usuário não autenticado, redirecionando para login')
      router.replace('/login')
    }
    
    // Se o status ainda for loading, não faz nada e continua mostrando o spinner
    
    // Limpar contador após 5 segundos para evitar falsos positivos
    const timer = setTimeout(() => {
      sessionStorage.removeItem('redirectCount')
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [status, router])

  // Mostra um spinner enquanto carrega
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
} 
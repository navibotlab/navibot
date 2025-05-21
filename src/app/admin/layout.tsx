'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Layout } from '@/components/Layout'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { data: session, status } = useSession()

  // Verificar status da sessão e agir de acordo
  useEffect(() => {
    console.log('AdminLayout - Status da sessão:', status)
    
    if (status === 'unauthenticated') {
      console.log('AdminLayout - Usuário não autenticado, redirecionando para login')
      router.replace('/login')
    }
    
    // Não fazer nada se status for 'loading' ou 'authenticated'
  }, [status, router])

  // Mostrar loading enquanto verifica a sessão
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
        {/* Anti-cache meta tags */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Se o status for 'unauthenticated', não renderizar nada para evitar flash de conteúdo
  if (status === 'unauthenticated') {
    return null
  }

  // Se chegou até aqui, o usuário está autenticado
  console.log('AdminLayout - Usuário autenticado, renderizando conteúdo')
  return <Layout>{children}</Layout>
} 
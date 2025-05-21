'use client'

import { SessionProvider } from 'next-auth/react'

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      // Configurar o intervalo de atualização da sessão para 15 minutos (900 segundos)
      // O padrão é 5 segundos, o que causa muitas requisições
      refetchInterval={900}
      
      // Desabilitar refetch da sessão em foco da janela
      // Isso evita verificações adicionais quando o usuário muda de aba e volta
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  )
} 
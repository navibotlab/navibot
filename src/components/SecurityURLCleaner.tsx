'use client'

import { useEffect } from 'react'

export default function SecurityURLCleaner() {
  useEffect(() => {
    // Função para limpar URLs com credenciais
    const cleanURL = () => {
      if (typeof window === 'undefined') return
      
      const currentURL = window.location.href
      const url = new URL(currentURL)
      
      // Verificar se há parâmetros sensíveis
      const sensitiveParams = ['email', 'password', 'token', 'key', 'secret']
      let hasCredentials = false
      
      sensitiveParams.forEach(param => {
        if (url.searchParams.has(param)) {
          hasCredentials = true
          url.searchParams.delete(param)
        }
      })
      
      // Se encontrou credenciais, limpar a URL
      if (hasCredentials) {
        const cleanURL = url.origin + url.pathname
        window.history.replaceState({}, document.title, cleanURL)
        console.warn('🛡️ Credenciais removidas da URL por segurança')
      }
    }
    
    // Executar limpeza imediatamente
    cleanURL()
    
    // Monitorar mudanças na URL
    const handleURLChange = () => {
      setTimeout(cleanURL, 100) // Pequeno delay para garantir que a URL foi atualizada
    }
    
    // Listeners para mudanças de URL
    window.addEventListener('popstate', handleURLChange)
    window.addEventListener('pushstate', handleURLChange)
    window.addEventListener('replacestate', handleURLChange)
    
    // Cleanup
    return () => {
      window.removeEventListener('popstate', handleURLChange)
      window.removeEventListener('pushstate', handleURLChange)
      window.removeEventListener('replacestate', handleURLChange)
    }
  }, [])
  
  return null // Componente invisível
} 
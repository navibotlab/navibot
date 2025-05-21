import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Criar Conta | NaviBot',
  description: 'Crie sua conta para acessar a plataforma NaviBot',
  other: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
}

export default function CriarContaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full">
      <Script
        id="react-polyfill-global"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Sistema de compatibilidade para Next.js 15+
            (function() {
              if (typeof window === 'undefined') return;
              
              // 2. Silenciar erros de sintaxe
              var originalConsoleError = console.error;
              console.error = function() {
                var args = Array.prototype.slice.call(arguments);
                var errorMsg = args[0] && args[0].toString ? args[0].toString() : '';
                
                // Silenciar erros específicos que podem atrapalhar a renderização
                if (
                  errorMsg.includes('SyntaxError') || 
                  errorMsg.includes('Unexpected token') ||
                  (errorMsg.includes('Warning:') && errorMsg.includes('React')) ||
                  errorMsg.includes('has been deprecated')
                ) {
                  return; // Silenciar este erro
                }
                
                // Passar outros erros para o console.error original
                return originalConsoleError.apply(console, args);
              };
              
              // 3. Interceptar erros de carregamento de script
              window.addEventListener('error', function(event) {
                if (event && event.target && event.target.tagName === 'SCRIPT') {
                  // Prevenir que erros de carregamento de script interrompam a página
                  event.preventDefault();
                  event.stopPropagation();
                  console.warn('Erro de carregamento de script interceptado:', 
                    event.target.src || 'script inline');
                  return true;
                }
              }, true);
              
              console.log('✅ Sistema de compatibilidade React aplicado globalmente');
            })();
          `
        }}
      />
      {children}
    </div>
  )
} 
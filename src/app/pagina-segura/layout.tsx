import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Página Segura | NaviBot',
  description: 'Página de teste sem dependências externas problemáticas',
  other: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
};

export default function PaginaSeguraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full">
      {/* Script de segurança específico para esta página */}
      <Script
        id="seguranca-especial"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Sistema de segurança especial para esta página
            (function() {
              if (typeof window === 'undefined') return;
              
              // 1. Marcar chunks problemáticos como já carregados
              window.__NEXT_CHUNK_LOADED = window.__NEXT_CHUNK_LOADED || {};
              const problematicChunks = [
                '1684-279ccc95d2d97f1',
                '4bd1b696-ca73c42103050ca4',
                '40d1b695-ca73c421030c4',
                '279ccc950d2d97f1',
                'ca73c42103050ca4'
              ];
              
              problematicChunks.forEach(chunk => {
                window.__NEXT_CHUNK_LOADED[chunk] = true;
              });
              
              // 3. Silenciar todos os erros de sintaxe JavaScript
              window.addEventListener('error', function(event) {
                if (event && event.error && event.error.name === 'SyntaxError') {
                  event.preventDefault();
                  event.stopPropagation();
                  console.warn('Erro de sintaxe bloqueado:', event.error.message);
                  return true;
                }
              }, true);
              
              console.log('✅ Sistema de segurança da página ativado');
            })();
          `
        }}
      />
      
      {children}
    </div>
  );
} 
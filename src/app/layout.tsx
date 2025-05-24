import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LoadingProgress } from '@/components/LoadingProgress';
import { NextAuthProvider } from '@/providers/NextAuthProvider';
import { LogInterceptorLoader } from '@/components/LogInterceptorLoader';
import Script from 'next/script';
import SecurityURLCleaner from '@/components/SecurityURLCleaner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NaviBot',
  description: 'Sistema automatizado de atendimento com inteligência artificial',
  icons: {
    icon: '/images/favicon-navibot-escura.png',
    shortcut: '/images/favicon-navibot-escura.png',
    apple: '/images/favicon-navibot-escura.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        {/* Script de proteção contra chunks problemáticos - posição crítica */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Sistema de bloqueio de chunks incompatíveis
              (function() {
                if (typeof window === 'undefined') return;
                
                // Lista de chunks problemáticos
                const problematicChunks = [
                  '1684-279ccc95d2d97f1',
                  '4bd1b696-ca73c42103050ca4',
                  '40d1b695-ca73c421030c4',
                  '279ccc950d2d97f1',
                  'ca73c42103050ca4'
                ];
                
                // Prevenir carregamento dos chunks problemáticos
                const originalCreateElement = document.createElement;
                document.createElement = function(tagName) {
                  const element = originalCreateElement.apply(document, arguments);
                  
                  // Interceptar apenas elementos <script>
                  if (tagName.toLowerCase() === 'script') {
                    const originalSetAttribute = element.setAttribute;
                    element.setAttribute = function(name, value) {
                      if (name === 'src' && typeof value === 'string') {
                        // Verificar se é um chunk problemático
                        const isProblematic = problematicChunks.some(chunk => 
                          value.includes(chunk)
                        );
                        
                        if (isProblematic) {
                          console.warn('🛡️ Bloqueando carregamento de chunk problemático:', value);
                          // Substituir por um script vazio
                          return originalSetAttribute.call(this, 'src', 'data:text/javascript,console.log("Chunk problemático ignorado")');
                        }
                      }
                      return originalSetAttribute.apply(this, arguments);
                    };
                  }
                  
                  return element;
                };

                // Marcar chunks como já carregados
                window.__NEXT_CHUNK_LOADED = window.__NEXT_CHUNK_LOADED || {};
                for (const chunk of problematicChunks) {
                  window.__NEXT_CHUNK_LOADED[chunk] = true;
                }
              })();
            `
          }}
          id="chunk-protection"
        />
        
        {/* Meta tags para prevenção de cache */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={inter.className}>
        <NextAuthProvider>
          <LoadingProgress />
          <LogInterceptorLoader />
          <SecurityURLCleaner />
          {children}
        </NextAuthProvider>
        
        {/* Script de compatibilidade para chunks problemáticos */}
        <Script
          id="next15-compatibility"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Sistema de monitoramento de chunks no Next.js 15+
              (function() {
                const PROBLEM_CHUNKS = [
                  '1684-279ccc95d2d97f1.js', 
                  '40d1b695-ca73c421030c4.js',
                  '40d1b695-ca73c421030c4',
                  '1684-279ccc95d2d97f1',
                  '4bd1b696-ca73c42103050ca4'
                ];
                
                // 1. Monitorar erros de sintaxe JS
                window.addEventListener('error', function(e) {
                  if (e && e.message && e.message.includes('Unexpected token')) {
                    console.warn('Erro de sintaxe interceptado:', e.message);
                    e.preventDefault();
                    e.stopPropagation();
                    return true;
                  }
                });
                
                // 2. Monitorar erros de carregamento de script
                window.addEventListener('error', function(e) {
                  if (e && e.target && e.target.tagName === 'SCRIPT' && e.target.src) {
                    for (const chunk of PROBLEM_CHUNKS) {
                      if (e.target.src.includes(chunk)) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.warn('Erro de carregamento de chunk interceptado:', chunk);
                        return true;
                      }
                    }
                  }
                }, true);
                
                console.log('✅ Sistema de monitoramento de chunks ativado');
              })();
            `
          }}
        />
      
        {/* Desativar completamente verificações de versão em produção */}
        <script dangerouslySetInnerHTML={{ __html: `
          // Desativar verificação de versão em produção para evitar problemas
          (function() {
            if (window.location.host.includes('app.navibot.com.br')) {
              // Substituir a função por uma versão vazia em produção
              window.safeVersionCheck = function() {
                console.log('Verificação de versão desativada em ambiente de produção');
              };
            }
          })();
        `}} />
        
        {/* Script para detectar atualizações da aplicação - versão mais robusta */}
        <script dangerouslySetInnerHTML={{ __html: `
          // Função para carregar de forma segura, sem quebrar a página
          function safeVersionCheck() {
            try {
              // NOVA SOLUÇÃO: Desativar completamente em produção
              if (window.location.host.includes('app.navibot.com.br')) {
                console.log('Verificação de versão desativada em produção');
                return;
              }
            
              // Desativar em páginas com potenciais problemas
              if (window.location.pathname.includes('/login') || 
                  window.location.pathname.includes('/esqueci-senha') || 
                  window.location.pathname.includes('/criar-conta') ||
                  window.location.pathname.includes('/recuperar-senha') ||
                  window.location.pathname.includes('/diagnostico') ||  // Desativa em qualquer página de diagnóstico
                  window.location.pathname.includes('/diagnostico-publico') ||
                  window.location.pathname.includes('/diagnostico-standalone')) {
                console.log('Verificação de versão desativada nesta página');
                return;
              }

              // Verificar menos frequentemente (30 minutos) para reduzir carga
              setInterval(function checkForUpdates() {
                // Tentar carregar usando fetch com validação
                fetch('/api/version/index.json?nocache=' + new Date().getTime(), {
                  headers: { 'Accept': 'application/json' },
                  cache: 'no-store'
                })
                .then(response => {
                  // Verificar se a resposta é JSON válido antes de processar
                  const contentType = response.headers.get('content-type');
                  if (!response.ok || !contentType || !contentType.includes('application/json')) {
                    throw new Error('Resposta inválida');
                  }
                  return response.json();
                })
                .then(data => {
                  // Função para processar os dados de versão
                  function handleVersionData(data) {
                    // Armazenar a versão atual na primeira vez
                    if (!localStorage.getItem('appVersion')) {
                      localStorage.setItem('appVersion', data.version);
                      return;
                    }
                    
                    // Comparar com a versão armazenada
                    const currentVersion = localStorage.getItem('appVersion');
                    if (data.version && data.version !== currentVersion) {
                      console.log('Nova versão disponível:', data.version);
                      localStorage.setItem('appVersion', data.version);
                      
                      // Perguntar ao usuário se deseja atualizar
                      if (confirm('Uma nova versão da aplicação está disponível. Deseja atualizar agora?')) {
                        localStorage.setItem('forceReload', 'true');
                        window.location.reload(true);
                      }
                    }
                  }
                  
                  if (data && data.version) {
                    handleVersionData(data);
                  }
                })
                .catch(err => {
                  console.log('Erro de verificação ignorado:', err.message);
                  // Não fazer nada em caso de erro - continue funcionando
                });
                
                return checkForUpdates;
              }(), 1800000); // 30 minutos
            } catch (e) {
              console.log('Erro no sistema de verificação de versão - sistema continuará funcionando');
            }
          }
          
          // SOLUÇÃO: Verificar se é uma página de diagnóstico antes de iniciar
          if (window.location.pathname.includes('/diagnostico') ||
              window.location.pathname.includes('/login?') ||
              window.location.pathname.includes('?email=')) {
            console.log('Página de diagnóstico/login com parâmetros detectada, pulando verificação de versão');
          } else {
            // Inicializar verificação de versão após carregamento completo da página
            if (document.readyState === 'complete') {
              safeVersionCheck();
            } else {
              window.addEventListener('load', safeVersionCheck);
            }
          }
          
          // Forçar limpeza de cache se necessário
          if (localStorage.getItem('forceReload') === 'true') {
            localStorage.removeItem('forceReload');
            console.log('Limpando cache e recarregando aplicação...');
            
            // Limpar caches do navegador
            if ('caches' in window) {
              caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                  caches.delete(cacheName);
                });
              });
            }
          }
        `}} />
      </body>
    </html>
  );
}
'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DiagnosticoPublicoPage() {
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [actionCompleted, setActionCompleted] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    // Capturar URL atual
    setCurrentUrl(window.location.href);

    // Definir um timeout para tratar caso a API não responda
    const timeoutId = setTimeout(() => {
      setLoadingTimeout(true);
    }, 5000); // 5 segundos

    async function fetchDiagnostico() {
      try {
        const response = await fetch('/api/diagnostico-publico');
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setDiagnostico(data);
      } catch (err: any) {
        console.error('Erro ao buscar diagnóstico:', err);
        setError(err.message || 'Erro ao carregar diagnóstico');
        // Se falhar, criar objeto de diagnóstico com informações básicas
        setDiagnostico({
          ambiente: 'produção (estimado)',
          nextauth_url: 'não disponível',
          url_base: window.location.origin,
          timestamp: new Date().toISOString(),
          headers: {
            host: window.location.host,
            referer: document.referrer || 'não disponível',
            'user-agent': navigator.userAgent
          },
          url: window.location.href
        });
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    }
    
    fetchDiagnostico();

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Função para limpar cookies de forma agressiva
  const limparCookies = () => {
    // Lista de cookies conhecidos
    const cookiesParaExcluir = [
      'next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.callback-url',
      '__Secure-next-auth.csrf-token',
      'auth',
      // Inclua todos os possíveis cookies que possam estar causando o problema
    ];
    
    // Excluir todos os cookies para garantir uma limpeza completa
    const allCookies = document.cookie.split(';');
    
    // Primeiro tenta remover os cookies específicos do NextAuth
    cookiesParaExcluir.forEach(cookie => {
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      // Tenta também com secure e domain
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure;`;
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`;
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}; secure;`;
    });
    
    // Em seguida, tenta limpar TODOS os cookies encontrados
    allCookies.forEach(cookie => {
      const cookieName = cookie.split('=')[0].trim();
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure;`;
    });
    
    setActionCompleted(true);
    // Atrasa a atualização para mostrar a mensagem de sucesso
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  };

  // Acesso direto ao login (URL limpa)
  const acessoDireto = () => {
    window.location.href = '/login';
  };

  // Se demorar muito para carregar, mostrar opções para continuar mesmo assim
  if (loading && loadingTimeout) {
    return (
      <div className="p-6 bg-gray-900 text-white min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Diagnóstico do Sistema</h1>
        
        <div className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold text-yellow-400">⚠️ Carregamento lento</h2>
          <p className="text-yellow-300 mb-4">Estamos tendo dificuldades para carregar os dados de diagnóstico. Você pode:</p>
          
          <div className="space-y-4">
            <button 
              onClick={limparCookies}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md mr-4"
            >
              Limpar Todos os Cookies
            </button>
            
            <button 
              onClick={acessoDireto}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md"
            >
              Acessar Login Diretamente
            </button>
          </div>
        </div>
        
        <div className="bg-gray-800/50 p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-2">URL Atual</h2>
          <p className="text-red-300 overflow-auto break-all bg-gray-900 p-3 rounded-md">
            {currentUrl}
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-6 bg-gray-900 text-white min-h-screen">Carregando dados de diagnóstico...</div>;
  
  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Diagnóstico do Sistema</h1>
      
      {actionCompleted && (
        <div className="bg-green-900/20 border border-green-600 p-4 rounded-md mb-4">
          <h2 className="text-lg font-semibold text-green-400">Ação completada!</h2>
          <p className="text-green-300">Cookies foram limpos. Redirecionando para a página de login...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/20 border border-red-600 p-4 rounded-md mb-4">
          <h2 className="text-lg font-semibold text-red-400">Erro ao carregar dados:</h2>
          <p className="text-red-300">{error}</p>
          <p className="text-white mt-2">Este erro não impede o uso das ferramentas de diagnóstico.</p>
        </div>
      )}
      
      <div className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-md mb-4">
        <h2 className="text-lg font-semibold text-yellow-400">⚠️ Alerta de Segurança</h2>
        <p className="text-yellow-300 mb-2">Detectamos credenciais sendo expostas na URL. Isso representa um risco de segurança.</p>
        <p className="text-white">Não use URLs que contenham seu email ou senha para acessar o sistema.</p>
      </div>
      
      {diagnostico && (
        <div className="bg-gray-800 p-4 rounded-md mb-6">
          <h2 className="text-xl font-semibold mb-2">Informações do Ambiente</h2>
          <pre className="bg-gray-900 p-3 rounded-md overflow-auto text-green-400 text-sm">
            {JSON.stringify(diagnostico, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="bg-gray-800 p-4 rounded-md mb-6">
        <h2 className="text-xl font-semibold mb-2">URL Atual</h2>
        <p className="text-red-300 overflow-auto break-all bg-gray-900 p-3 rounded-md">
          {currentUrl}
        </p>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-md mb-6">
        <h2 className="text-xl font-semibold mb-2">Ações Corretivas</h2>
        <div className="space-y-4">
          <button 
            onClick={limparCookies}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md mr-4"
          >
            Limpar Todos os Cookies
          </button>
          
          <button 
            onClick={acessoDireto}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md"
          >
            Acessar Login Diretamente
          </button>
        </div>
      </div>
      
      <div className="bg-gray-800/50 p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Instruções para Resolver</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Clique em <strong>"Limpar Todos os Cookies"</strong> para remover os cookies que podem estar causando o loop</li>
          <li>Em seguida, clique em <strong>"Acessar Login Diretamente"</strong> para ir à página de login limpa</li>
          <li>Digite suas credenciais normalmente no formulário - <strong>NÃO use URLs que contenham credenciais</strong></li>
          <li>Se continuar tendo problemas, entre em contato com o suporte técnico</li>
        </ol>
      </div>
    </div>
  );
} 
'use client'

import { useState, useEffect } from 'react';

export default function DiagnosticoStandalonePage() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [actionCompleted, setActionCompleted] = useState(false);
  const [clientInfo, setClientInfo] = useState<any>(null);

  useEffect(() => {
    // Capturar informações do cliente sem chamar APIs
    try {
      setCurrentUrl(window.location.href);
      
      // Coletar informações básicas do navegador
      const info = {
        url: window.location.href,
        host: window.location.host,
        pathname: window.location.pathname,
        userAgent: navigator.userAgent,
        cookiesEnabled: navigator.cookieEnabled,
        platform: navigator.platform,
        language: navigator.language,
        screenSize: {
          width: window.screen.width,
          height: window.screen.height
        },
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: new Date().toISOString(),
        referrer: document.referrer,
        cookies: document.cookie.split(';').map(c => c.trim()).filter(c => c),
        localStorage: Object.keys(localStorage)
      };
      
      setClientInfo(info);
    } catch (err) {
      console.error('Erro ao coletar informações:', err);
    }
  }, []);

  // Função para limpar cookies de forma agressiva
  const limparCookies = () => {
    try {
      // Excluir todos os cookies para garantir uma limpeza completa
      const allCookies = document.cookie.split(';');
      allCookies.forEach(cookie => {
        const cookieName = cookie.split('=')[0].trim();
        if (cookieName) {
          // Tentar vários domínios e caminhos para garantir
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname};`;
        }
      });
      
      // Limpar localStorage também
      localStorage.clear();
      
      setActionCompleted(true);
      // Atualizar lista de cookies após limpeza
      if (clientInfo) {
        setClientInfo({
          ...clientInfo,
          cookies: document.cookie.split(';').map(c => c.trim()).filter(c => c),
          localStorage: Object.keys(localStorage)
        });
      }
      
      // Atrasa o redirecionamento para mostrar a mensagem de sucesso
      setTimeout(() => {
        const loginUrl = '/login';
        window.location.href = loginUrl;
      }, 2000);
    } catch (err) {
      console.error('Erro ao limpar cookies:', err);
      // Mesmo com erro, tenta redirecionar
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
  };

  // Acesso direto ao login (URL limpa)
  const acessoDireto = () => {
    try {
      window.location.href = '/login';
    } catch (err) {
      console.error('Erro ao redirecionar:', err);
      // Tentar uma forma alternativa
      document.location.href = '/login';
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Diagnóstico Standalone</h1>
      
      {actionCompleted && (
        <div className="bg-green-900/20 border border-green-600 p-4 rounded-md mb-4">
          <h2 className="text-lg font-semibold text-green-400">Ação completada!</h2>
          <p className="text-green-300">Cookies e localStorage foram limpos. Redirecionando para a página de login...</p>
        </div>
      )}
      
      <div className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-md mb-4">
        <h2 className="text-lg font-semibold text-yellow-400">⚠️ Alerta de Segurança</h2>
        <p className="text-yellow-300 mb-2">Detectamos credenciais sendo expostas na URL. Isso representa um risco de segurança.</p>
        <p className="text-white">Não use URLs que contenham seu email ou senha para acessar o sistema.</p>
      </div>
      
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
            Limpar Cookies e LocalStorage
          </button>
          
          <button 
            onClick={acessoDireto}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md"
          >
            Acessar Login Diretamente
          </button>
        </div>
      </div>
      
      {clientInfo && (
        <div className="bg-gray-800 p-4 rounded-md mb-6">
          <h2 className="text-xl font-semibold mb-2">Informações do Cliente</h2>
          <div className="bg-gray-900 p-3 rounded-md overflow-auto">
            <pre className="text-green-400 text-sm">
              {JSON.stringify(clientInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      <div className="bg-gray-800/50 p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Instruções para Resolver</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Clique em <strong>"Limpar Cookies e LocalStorage"</strong> para remover os dados que podem estar causando o loop</li>
          <li>Em seguida, clique em <strong>"Acessar Login Diretamente"</strong> para ir à página de login limpa</li>
          <li>Digite suas credenciais normalmente no formulário - <strong>NÃO use URLs que contenham credenciais</strong></li>
          <li>Se continuar tendo problemas, você pode tentar:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Usar modo de navegação anônima</li>
              <li>Limpar o cache do navegador manualmente</li>
              <li>Usar outro navegador</li>
            </ul>
          </li>
        </ol>
      </div>
    </div>
  );
} 
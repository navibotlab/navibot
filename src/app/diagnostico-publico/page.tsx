'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DiagnosticoPublicoPage() {
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDiagnostico() {
      try {
        const response = await fetch('/api/diagnostico-publico');
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setDiagnostico(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar diagnóstico');
      } finally {
        setLoading(false);
      }
    }
    
    fetchDiagnostico();
  }, []);

  // Função para limpar cookies
  const limparCookies = () => {
    // Lista de cookies conhecidos do NextAuth
    const cookiesParaExcluir = [
      'next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.callback-url',
      '__Secure-next-auth.csrf-token',
      'auth'
    ];
    
    // Excluir cada cookie
    cookiesParaExcluir.forEach(cookie => {
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    });
    
    // Atualizar a página
    window.location.reload();
  };

  if (loading) return <div className="p-6">Carregando dados de diagnóstico...</div>;
  
  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Diagnóstico Público do Sistema</h1>
      
      {error && (
        <div className="bg-red-900/20 border border-red-600 p-4 rounded-md mb-4">
          <h2 className="text-lg font-semibold text-red-400">Erro ao carregar dados:</h2>
          <p className="text-red-300">{error}</p>
        </div>
      )}
      
      {diagnostico && (
        <div className="bg-gray-800 p-4 rounded-md mb-6">
          <h2 className="text-xl font-semibold mb-2">Informações do Ambiente</h2>
          <pre className="bg-gray-900 p-3 rounded-md overflow-auto text-green-400 text-sm">
            {JSON.stringify(diagnostico, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-2">Configuração NextAuth</h2>
          <p><strong>URL:</strong> {diagnostico?.nextauth_url}</p>
          <p><strong>Ambiente:</strong> {diagnostico?.ambiente}</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-2">Problemas Detectados</h2>
          <ul className="list-disc pl-5">
            <li className="text-yellow-400">
              Loop de redirecionamento detectado
            </li>
            <li className="text-yellow-400">
              Credenciais expostas na URL
            </li>
          </ul>
        </div>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-md mb-6">
        <h2 className="text-xl font-semibold mb-2">Ações de Diagnóstico</h2>
        <div className="space-y-4">
          <button 
            onClick={limparCookies}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md mr-4"
          >
            Limpar Cookies de Autenticação
          </button>
          
          <Link 
            href="/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
          >
            Voltar para Login
          </Link>
        </div>
      </div>
      
      <div className="bg-gray-800/50 p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Instruções</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Clique em "Limpar Cookies de Autenticação" para remover os cookies de sessão</li>
          <li>Volte para a página de login e tente novamente, sem copiar e colar a URL</li>
          <li>Se o problema persistir, entre em contato com o suporte técnico</li>
        </ol>
      </div>
    </div>
  );
} 
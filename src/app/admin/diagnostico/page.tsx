'use client'

import { useState, useEffect } from 'react';

export default function DiagnosticoPage() {
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDiagnostico() {
      try {
        const response = await fetch('/api/diagnostico');
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

  if (loading) return <div>Carregando dados de diagnóstico...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Diagnóstico do Sistema</h1>
      
      <div className="bg-gray-800 p-4 rounded mb-6">
        <h2 className="text-xl font-semibold mb-2">Informações do Ambiente</h2>
        <pre className="bg-gray-900 p-3 rounded overflow-auto">
          {JSON.stringify(diagnostico, null, 2)}
        </pre>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Configuração NextAuth</h2>
          <p>URL: {diagnostico?.nextauth_url}</p>
          <p>Sessão Ativa: {diagnostico?.session_exists ? 'Sim' : 'Não'}</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Status do Servidor</h2>
          <p>Ambiente: {diagnostico?.ambiente}</p>
          <p>Data/Hora: {new Date(diagnostico?.timestamp).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
} 
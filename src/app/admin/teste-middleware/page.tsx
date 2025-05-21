'use client'

import { useState } from 'react';

export default function TesteMiddlewarePage() {
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testarMiddleware = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/middleware-test');
      const data = await response.json();
      
      setResultado(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao testar middleware');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teste de Middleware</h1>
      
      <button
        onClick={testarMiddleware}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {loading ? 'Testando...' : 'Testar Middleware'}
      </button>
      
      {error && (
        <div className="bg-red-600/20 border border-red-600/50 text-red-300 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {resultado && (
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Resultado do Teste</h2>
          <pre className="bg-gray-900 p-3 rounded overflow-auto">
            {JSON.stringify(resultado, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-6 bg-gray-800/50 p-4 rounded">
        <h3 className="font-semibold mb-2">Como interpretar os resultados:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Se você viu o resultado acima, o middleware está permitindo o acesso ao endpoint protegido.</li>
          <li>Se viu um erro de "não autorizado", o middleware está funcionando mas você não está autenticado.</li>
          <li>Se viu outro tipo de erro, pode haver um problema na configuração.</li>
        </ul>
      </div>
    </div>
  );
} 
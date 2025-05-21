'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function DocumentationViewer() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocumentation() {
      try {
        setLoading(true);
        const response = await fetch('/api/docs');
        
        if (!response.ok) {
          throw new Error(`Erro ao carregar a documentação: ${response.status}`);
        }
        
        const html = await response.text();
        setContent(html);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar a documentação:', err);
        setError('Não foi possível carregar a documentação. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    }

    fetchDocumentation();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-gray-600">Carregando documentação...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl">
          <h2 className="text-red-800 text-xl font-semibold mb-2">Erro</h2>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="documentation-container"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
} 
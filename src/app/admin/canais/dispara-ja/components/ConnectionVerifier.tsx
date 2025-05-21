import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ConnectionVerifierProps {
  infoLink: string;
  secret: string;
  sid: string;
  agentId: string;
  onSuccess: (connectionId: string, phoneNumber: string) => void;
  onError: (error: string) => void;
}

export function ConnectionVerifier({
  infoLink,
  secret,
  sid,
  agentId,
  onSuccess,
  onError
}: ConnectionVerifierProps) {
  const [status, setStatus] = useState<'waiting' | 'success' | 'error'>('waiting');
  const [message, setMessage] = useState<string>('Aguardando...');
  const verificationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 30; // Número máximo de tentativas
  const retryDelayMs = 2000; // Intervalo entre tentativas (2 segundos)
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();

  // Função para verificar o status da conexão
  const checkConnection = async () => {
    try {
      const url = `/api/dispara-ja/verify-connection?infoLink=${encodeURIComponent(infoLink)}&secret=${encodeURIComponent(secret)}&sid=${sid}&agentId=${agentId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Erro na resposta: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Conexão bem sucedida
        clearInterval(verificationIntervalRef.current!);
        setStatus('success');
        setMessage('WhatsApp conectado com sucesso!');
        onSuccess(data.connectionId, data.phoneNumber);
        // Atualizar a página após 2 segundos
        setTimeout(() => {
          router.refresh();
        }, 2000);
        return true;
      }

      // Atualizar mensagem de status
      setMessage(data.message || 'Aguardando...');

      // Se houver erro, parar a verificação
      if (data.status === 'error') {
        clearInterval(verificationIntervalRef.current!);
        setStatus('error');
        onError(data.message);
        return true;
      }

      // Incrementar tentativas
      setAttempts(prev => {
        if (prev >= maxRetries) {
          clearInterval(verificationIntervalRef.current!);
          setStatus('error');
          onError('Tempo esgotado para a verificação.');
          return prev;
        }
        return prev + 1;
      });

      return false;
    } catch (error) {
      clearInterval(verificationIntervalRef.current!);
      const errorMessage = error instanceof Error ? error.message : 'Erro na verificação';
      setStatus('error');
      onError(errorMessage);
      return true;
    }
  };

  useEffect(() => {
    // Primeira verificação
    checkConnection();

    // Configurar intervalo para verificações subsequentes
    verificationIntervalRef.current = setInterval(checkConnection, retryDelayMs);

    return () => {
      if (verificationIntervalRef.current) {
        clearInterval(verificationIntervalRef.current);
      }
    };
  }, [infoLink]);

  return (
    <div className="flex items-center justify-center p-2">
      <div className="flex items-center space-x-2">
        {status === 'waiting' && <Loader2 className="h-4 w-4 animate-spin" />}
        <span className={`text-sm ${status === 'success' ? 'text-green-600 font-medium' : status === 'error' ? 'text-red-600' : ''}`}>
          {message}
        </span>
      </div>
    </div>
  );
} 
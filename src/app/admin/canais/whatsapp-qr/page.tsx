'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Agent } from '@/types/agent';
import { QrCode, Loader2, CheckCircle2 } from 'lucide-react';

export default function WhatsappQRPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [error, setError] = useState<string>('');

  // Buscar lista de agentes
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/agents');
        if (!response.ok) throw new Error('Falha ao carregar agentes');
        const data = await response.json();
        setAgents(data);
      } catch (error) {
        setError('Erro ao carregar lista de agentes');
      }
    };

    fetchAgents();
  }, []);

  // Verificar status da conexão
  useEffect(() => {
    if (!selectedAgent || status === 'disconnected') return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/whatsapp/connect?agentId=${selectedAgent}`);
        if (!response.ok) throw new Error('Falha ao verificar status');
        
        const data = await response.json();
        if (data.status === 'connected') {
          setStatus('connected');
          setQrCode('');
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    };

    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [selectedAgent, status]);

  // Iniciar conexão com WhatsApp
  const handleConnect = async () => {
    if (!selectedAgent) {
      setError('Selecione um agente primeiro');
      return;
    }

    setStatus('connecting');
    setError('');

    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId: selectedAgent }),
      });

      if (!response.ok) throw new Error('Falha ao iniciar conexão');

      const data = await response.json();
      
      if (data.status === 'connected') {
        setStatus('connected');
        setQrCode('');
      } else if (data.status === 'qr') {
        setQrCode(data.qr);
      }
    } catch (error) {
      setError('Erro ao iniciar conexão com WhatsApp');
      setStatus('disconnected');
    }
  };

  // Desconectar WhatsApp
  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId: selectedAgent }),
      });

      if (!response.ok) throw new Error('Falha ao desconectar');

      setStatus('disconnected');
      setQrCode('');
    } catch (error) {
      setError('Erro ao desconectar WhatsApp');
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Conectar WhatsApp</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seleção de Agente */}
          <Card className="bg-[#1A1D24] border-gray-800 text-white">
            <CardHeader>
              <CardTitle>1. Selecione o Agente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="w-full bg-[#0F1115] border-gray-800">
                    <SelectValue placeholder="Selecione um agente" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1D24] border-gray-800 text-white">
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {status === 'connected' ? (
                  <Button
                    onClick={handleDisconnect}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    Desconectar WhatsApp
                  </Button>
                ) : (
                  <Button
                    onClick={handleConnect}
                    disabled={!selectedAgent || status === 'connecting'}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {status === 'connecting' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-4 w-4" />
                        Gerar QR Code
                      </>
                    )}
                  </Button>
                )}

                {error && (
                  <p className="text-sm text-red-500 mt-2">{error}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card className="bg-[#1A1D24] border-gray-800 text-white">
            <CardHeader>
              <CardTitle>2. Escaneie o QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center min-h-[300px]">
                {status === 'connecting' && !qrCode && (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-gray-400">Aguardando conexão...</p>
                  </div>
                )}

                {status === 'connected' && (
                  <div className="flex flex-col items-center gap-4 text-green-500">
                    <CheckCircle2 className="h-16 w-16" />
                    <p>WhatsApp conectado com sucesso!</p>
                  </div>
                )}

                {qrCode && (
                  <div className="bg-white p-4 rounded-lg">
                    <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                  </div>
                )}

                {status === 'disconnected' && !qrCode && (
                  <div className="flex flex-col items-center gap-4 text-gray-400">
                    <QrCode className="h-16 w-16" />
                    <p>Selecione um agente e clique em "Gerar QR Code"</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instruções */}
        <Card className="mt-6 bg-[#1A1D24] border-gray-800 text-white">
          <CardHeader>
            <CardTitle>Como conectar</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-gray-400">
              <li>Selecione o agente que você deseja conectar ao WhatsApp</li>
              <li>Clique no botão "Gerar QR Code"</li>
              <li>Abra o WhatsApp no seu celular</li>
              <li>Toque em Menu (⋮) ou Configurações e selecione "WhatsApp Web"</li>
              <li>Aponte a câmera do seu celular para o QR Code</li>
              <li>Aguarde a conexão ser estabelecida</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
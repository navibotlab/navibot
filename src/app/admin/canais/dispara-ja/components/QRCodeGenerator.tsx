import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, QrCode, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ConnectionVerifier } from './ConnectionVerifier';
import { Copy, Check, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogClose, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface QRCodeGeneratorProps {
  secret: string;
  agentId: string;
  onSuccess: (connectionId: string, phoneNumber: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function QRCodeGenerator({ secret, agentId, onSuccess, onClose, isOpen }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [infoLink, setInfoLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [connectionData, setConnectionData] = useState<{
    connectionId: string;
    phoneNumber: string;
    webhookUrl?: string;
  } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);
  const { toast } = useToast();

  // Função para lidar com erros
  const handleError = (errorMessage: string) => {
    console.error('Erro na verificação:', errorMessage);
    setError(errorMessage);
  };

  // Função para lidar com o sucesso da conexão
  const handleSuccess = (connectionId: string, phoneNumber: string) => {
    console.log('Conexão bem sucedida:', { connectionId, phoneNumber });
    setConnected(true);
    setConnectionData({
      connectionId,
      phoneNumber
    });
    onSuccess(connectionId, phoneNumber);
  };

  // Função para copiar a URL do webhook para a área de transferência
  const copyWebhookUrl = () => {
    if (connectionData?.webhookUrl) {
      navigator.clipboard.writeText(connectionData.webhookUrl)
        .then(() => {
          setCopiedWebhook(true);
          toast({
            title: "URL copiada!",
            description: "URL do webhook copiada para a área de transferência.",
          });
          
          // Resetar o estado após 3 segundos
          setTimeout(() => {
            setCopiedWebhook(false);
          }, 3000);
        })
        .catch(err => {
          console.error('Erro ao copiar URL:', err);
          toast({
            title: "Erro",
            description: "Não foi possível copiar a URL.",
            variant: "destructive",
          });
        });
    }
  };

  // Função para tentar novamente
  const retryGeneration = () => {
    setIsGenerating(true);
    setError(null);
    const timer = setTimeout(() => {
      generateQRCode();
    }, 1000);
    
    return () => clearTimeout(timer);
  };

  // Limpar estado quando o componente é fechado
  useEffect(() => {
    if (!isOpen) {
      setQrCodeUrl(null);
      setInfoLink(null);
      setIsGenerating(true);
      setError(null);
      setConnected(false);
      setConnectionData(null);
      setCopiedWebhook(false);
    }
  }, [isOpen]);

  // Gerar o QR Code quando o componente for montado
  useEffect(() => {
    if (isOpen && secret) {
      generateQRCode();
    }
  }, [secret, isOpen]);

  // Função para gerar o QR Code
  const generateQRCode = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      console.log('Gerando QR Code...');
      
      try {
        const response = await fetch('/api/dispara-ja/qrcode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ secret })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Erro na resposta:', response.status, errorData);
          throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Resposta do servidor:', data);
        
        // Salvar QR code e infolink
        setQrCodeUrl(data.data.qrimagelink);
        setInfoLink(data.data.infolink);
      } catch (fetchError: any) {
        console.error('Erro de fetch:', fetchError);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('A requisição demorou muito tempo para responder. Por favor, tente novamente.');
        } else if (fetchError.message === 'Failed to fetch') {
          throw new Error('Erro de conexão com o servidor. Verifique sua conexão com a internet ou tente novamente mais tarde.');
        } else {
          throw fetchError;
        }
      }
    } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsGenerating(false);
    }
  };

  // Renderizar o modal com o QR Code
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="p-0 bg-transparent border-0 max-w-[350px]">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
          <DialogDescription className="sr-only">
            Escaneie o QR Code com seu WhatsApp para conectar sua conta
          </DialogDescription>
        </DialogHeader>
        <Card className="w-full bg-card shadow-xl border-0">
          <div className="absolute right-4 top-4 z-50">
            <DialogClose asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-8 w-8 hover:bg-gray-800"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="w-5 h-5 mr-2" aria-hidden="true" />
              Conectar WhatsApp
            </CardTitle>
            <CardDescription>
              {qrCodeUrl ? 'Escaneie o QR Code para conectar' : 'Gerando QR Code para conexão...'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isGenerating && (
              <div className="flex flex-col items-center justify-center p-6" role="status">
                <Loader2 className="h-8 w-8 animate-spin mb-4" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
              </div>
            )}
            
            {error && (
              <div className="flex flex-col items-center justify-center p-6 text-center" role="alert">
                <X className="h-8 w-8 text-destructive mb-4" aria-hidden="true" />
                <p className="text-sm text-destructive">{error}</p>
                <div className="flex gap-2 mt-4">
                  <DialogClose asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                    >
                      Fechar
                    </Button>
                  </DialogClose>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={retryGeneration}
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            )}
            
            {qrCodeUrl && !error && !connected && (
              <div className="flex flex-col items-center justify-center">
                <div className="relative h-[250px] w-[250px] mb-4 border bg-white p-2 rounded-md">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code do WhatsApp"
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {infoLink && (
                  <ConnectionVerifier
                    infoLink={infoLink}
                    secret={secret}
                    sid="3"
                    agentId={agentId}
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                )}
              </div>
            )}
            
            {connected && connectionData && (
              <div className="text-center">
                <div className="mb-6 p-4 bg-green-900/30 border border-green-800 rounded-md text-green-300" role="status">
                  <Check className="h-8 w-8 mx-auto mb-2 text-green-500" aria-hidden="true" />
                  <p>Conexão estabelecida com sucesso!</p>
                  <p className="text-green-400 font-semibold mt-2">
                    Número: {connectionData.phoneNumber}
                  </p>
                </div>
                
                {connectionData.webhookUrl && (
                  <div className="mb-6">
                    <p className="text-gray-300 mb-2">URL do Webhook:</p>
                    <div className="bg-gray-900 rounded p-3 mb-2 border border-gray-700">
                      <p className="text-xs text-blue-400 font-mono break-all mb-2">
                        {connectionData.webhookUrl}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyWebhookUrl}
                        className="w-full flex items-center justify-center gap-2 bg-gray-800 border-gray-700 hover:bg-gray-700"
                        aria-label={copiedWebhook ? "URL copiada" : "Copiar URL do Webhook"}
                      >
                        {copiedWebhook ? (
                          <>
                            <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" aria-hidden="true" />
                            <span>Copiar URL do Webhook</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-amber-400 text-sm">
                      Configure esta URL como webhook no painel do Dispara Já para receber mensagens em tempo real.
                    </p>
                  </div>
                )}
                
                <DialogClose asChild>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 mx-auto"
                  >
                    Concluir
                  </Button>
                </DialogClose>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center border-t pt-4">
            <div className="text-xs text-muted-foreground text-center">
              Após escanear o QR Code, seu WhatsApp será conectado automaticamente
            </div>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
} 
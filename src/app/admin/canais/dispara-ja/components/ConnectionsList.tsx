import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, RefreshCw, PhoneOutgoing, Copy, Link } from 'lucide-react';
import { DisparaJaConnection } from '../types';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from '@/components/ui/spinner';
import { formatConnectionStatus } from '../utils/connection-status';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConnectionsListProps {
  connections: DisparaJaConnection[];
  onEdit: (connection: DisparaJaConnection) => void;
  onRefresh: () => Promise<void>;
}

export default function ConnectionsList({ connections, onEdit, onRefresh }: ConnectionsListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<DisparaJaConnection | null>(null);
  const { toast } = useToast();
  const [isGeneratingWebhook, setIsGeneratingWebhook] = useState<Record<string, boolean>>({});
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, string>>({});

  // Verificar status das conexões usando o endpoint de accounts
  const verifyConnectionsStatus = async () => {
    try {
      // Verificar cada conexão individualmente
      const statusMap: Record<string, string> = {};
      
      for (const connection of connections) {
        if (!connection.secret) continue;

        // Fazer a requisição para o endpoint de accounts com o secret
        const response = await fetch(`https://disparaja.com/api/get/wa.accounts?secret=${encodeURIComponent(connection.secret)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          console.error('Erro ao verificar status da conta:', await response.text());
          continue;
        }

        const data = await response.json();
        console.log('Resposta accounts:', data);
        
        if (data.status === 200 && Array.isArray(data.data)) {
          // Procurar a conta que corresponde ao unique da conexão
          const account = data.data.find((acc: any) => acc.unique === connection.unique);
          if (account) {
            statusMap[connection.unique] = account.status === 'connected' ? 'ativo' : 'inativo';
          }
        }
      }
      
      setConnectionStatuses(statusMap);
    } catch (error) {
      console.error('Erro ao verificar status das contas:', error);
    }
  };

  // Chamar a verificação quando o componente montar ou quando as conexões mudarem
  useEffect(() => {
    verifyConnectionsStatus();
  }, [connections]);

  // Função para obter o status visual da conexão
  const getConnectionVisualStatus = (connection: DisparaJaConnection) => {
    // Se temos um status verificado do endpoint de accounts, usar ele
    if (connection.unique && connectionStatuses[connection.unique]) {
      return connectionStatuses[connection.unique];
    }
    // Se a conexão tem status 200 e message WhatsApp Information, está ativa
    if (connection.status === 'ativo') {
      return 'ativo';
    }
    // Caso contrário, está inativa
    return 'inativo';
  };

  // Formatar a data para exibição
  const formatDate = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Formatar o status da conexão
  const formatConnectionStatus = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo';
      case 'pendente':
        return 'Pendente';
      case 'inativo':
        return 'Inativo';
      default:
        return status;
    }
  };

  // Método para gerar a URL do webhook
  const getWebhookUrl = (connectionId: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_BASE_URL não está configurada no ambiente');
    }
    return `${baseUrl}/api/dispara-ja/webhook/${connectionId}`;
  };

  // Método para copiar o webhook para o clipboard
  const copyWebhookToClipboard = (connectionId: string) => {
    const webhookUrl = getWebhookUrl(connectionId);
    navigator.clipboard.writeText(webhookUrl)
      .then(() => {
        setCopiedWebhook(connectionId);
        toast({
          title: "URL copiada!",
          description: "URL do webhook copiada para a área de transferência.",
        });
        
        // Limpar status após 3 segundos
        setTimeout(() => {
          setCopiedWebhook(null);
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
  };

  // Método para salvar a URL de webhook na conexão
  const saveWebhookUrl = async (connectionId: string) => {
    try {
      setIsGeneratingWebhook(prev => ({ ...prev, [connectionId]: true }));
      
      let webhookUrl;
      try {
        webhookUrl = getWebhookUrl(connectionId);
      } catch (error) {
        toast({
          title: "Erro de Configuração",
          description: "A URL base (NEXT_PUBLIC_BASE_URL) não está configurada. Configure o ngrok e atualize o arquivo .env",
          variant: "destructive",
        });
        return;
      }
      
      console.log("[DisparaJá UI] Configurando webhook:", webhookUrl);
      
      const response = await fetch(`/api/dispara-ja/connections/${connectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhookUrl }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar URL de webhook');
      }
      
      const data = await response.json();
      console.log("[DisparaJá UI] Resposta da API:", data);
      
      // Copiar o webhook automaticamente para a área de transferência
      navigator.clipboard.writeText(webhookUrl)
        .then(() => {
          console.log("[DisparaJá UI] URL do webhook copiada para a área de transferência");
          setCopiedWebhook(connectionId);
          setTimeout(() => setCopiedWebhook(null), 3000);
        })
        .catch(clipboardErr => console.error('[DisparaJá UI] Erro ao copiar webhook:', clipboardErr));
      
      // Mostrar toast com instruções
      toast({
        title: "Webhook configurado",
        description: "URL de webhook salva com sucesso e copiada para a área de transferência."
      });
      
      // Atualizar a lista de conexões para exibir o webhook
      await onRefresh();
      
    } catch (error) {
      console.error('[DisparaJá UI] Erro ao salvar webhook:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível salvar a URL de webhook.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingWebhook(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  const handleOpenDeleteDialog = (connection: DisparaJaConnection) => {
    setConnectionToDelete(connection);
    setConfirmDelete(true);
  };

  const handleDeleteConnection = async () => {
    if (!connectionToDelete) return;
    
    setIsDeleting(connectionToDelete.id);
    try {
      const response = await fetch(`/api/dispara-ja/connections/${connectionToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir conexão');
      }
      
      await onRefresh();
      
      toast({
        title: "Conexão excluída",
        description: "A conexão foi excluída com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir conexão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conexão",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
      setConfirmDelete(false);
      setConnectionToDelete(null);
    }
  };

  const handleVerifyConnection = async (connection: DisparaJaConnection) => {
    setRefreshingId(connection.id);
    try {
      console.log("[DisparaJá UI] Verificando conexão:", connection.id);
      console.log("[DisparaJá UI] Dados da conexão antes da atualização:", connection);
      
      await onRefresh();
      
      // Log para verificar se o webhook está presente após a atualização
      const updatedConnections = await fetch('/api/dispara-ja/connections');
      const connectionsData = await updatedConnections.json();
      const updatedConnection = connectionsData.find((c: DisparaJaConnection) => c.id === connection.id);
      console.log("[DisparaJá UI] Dados da conexão após atualização:", updatedConnection);
      
    } catch (error) {
      console.error('[DisparaJá UI] Erro ao verificar conexão:', error);
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div>
      {connections.length === 0 ? (
        <Card className="bg-[#1A1D24] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Sem conexões</CardTitle>
            <CardDescription className="text-gray-400">
              Nenhuma conexão do Dispara Já foi encontrada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">
              Clique no botão "Nova Conexão" para adicionar uma conexão do Dispara Já.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {connections.map((connection) => (
            <Card key={connection.id} className="bg-[#1A1D24] border-gray-800 overflow-hidden">
              <div className={`h-2 w-full ${getConnectionVisualStatus(connection) === 'ativo' ? 'bg-green-600' : getConnectionVisualStatus(connection) === 'pendente' ? 'bg-yellow-600' : 'bg-red-600'}`} />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white flex items-center">
                      <PhoneOutgoing className="h-4 w-4 mr-2 text-gray-400" />
                      {connection.phoneNumber || 'Sem número'}
                    </CardTitle>
                  </div>
                  <Badge className={`
                    ${getConnectionVisualStatus(connection) === 'ativo' ? 'bg-green-600 hover:bg-green-700' : 
                      getConnectionVisualStatus(connection) === 'pendente' ? 'bg-yellow-600 hover:bg-yellow-700' : 
                      'bg-red-600 hover:bg-red-700'}
                  `}>
                    {formatConnectionStatus(getConnectionVisualStatus(connection))}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                  <div>
                    <p className="text-gray-500">Criado em:</p>
                    <p>{formatDate(connection.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Atualizado em:</p>
                    <p>{formatDate(connection.updatedAt)}</p>
                  </div>
                </div>
                
                {/* Seção de Webhook */}
                <div className="mt-4 border-t border-gray-700 pt-4">
                  <p className="text-gray-500 mb-2">Webhook:</p>
                  {connection.webhookUrl ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-gray-900 rounded p-2 border border-gray-700">
                        <div className="text-xs text-blue-400 truncate mr-2 font-mono">
                          {connection.webhookUrl}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyWebhookToClipboard(connection.id)}
                          className="h-8 min-w-[80px] border-gray-700 bg-gray-800"
                        >
                          {copiedWebhook === connection.id ? (
                            <span className="flex items-center"><Copy className="h-3 w-3 mr-1 text-green-500" /> Copiado</span>
                          ) : (
                            <span className="flex items-center"><Copy className="h-3 w-3 mr-1" /> Copiar</span>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-amber-500">
                        Configure esta URL como webhook no painel do Dispara Já
                      </p>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-400 hover:text-gray-300"
                          onClick={() => console.log("[DisparaJá UI] Dados da conexão:", connection)}
                        >
                          Debug
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveWebhookUrl(connection.id)}
                        disabled={isGeneratingWebhook[connection.id]}
                        className="text-xs border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        {isGeneratingWebhook[connection.id] ? (
                          <Spinner className="h-3 w-3 mr-1" />
                        ) : (
                          <Link className="h-3 w-3 mr-1" />
                        )}
                        Configurar Webhook
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-gray-300 ml-2"
                        onClick={() => console.log("[DisparaJá UI] Dados da conexão:", connection)}
                      >
                        Debug
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between bg-[#12141A] border-t border-gray-800 py-3 px-6">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    onClick={() => handleVerifyConnection(connection)}
                    disabled={!!refreshingId}
                  >
                    {refreshingId === connection.id ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      onClick={() => onEdit(connection)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-800 text-red-500 hover:bg-red-950 hover:text-red-400"
                  onClick={() => handleOpenDeleteDialog(connection)}
                  disabled={!!isDeleting}
                >
                  {isDeleting === connection.id ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="bg-gray-800 text-white border border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Tem certeza que deseja excluir esta conexão com o número {connectionToDelete?.phoneNumber}?
              <br />
              Esta ação não pode ser desfeita e a conta será excluída do Dispara Já.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConnection}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={!!isDeleting}
            >
              {!!isDeleting ? <Spinner className="h-4 w-4 mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 
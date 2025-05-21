'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Link, Copy, Check, Power, Loader2, Key } from "lucide-react";
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { DeleteWhatsAppConnectionModal } from "./DeleteWhatsAppConnectionModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WhatsAppConnection {
  id: string;
  phoneNumberId: string;
  businessId?: string;
  status: 'active' | 'inactive' | 'error';
  webhookUrl?: string;
  verifyToken?: string;
  createdAt: string;
  updatedAt: string;
}

interface WhatsAppCloudConnectionsListProps {
  connections: WhatsAppConnection[];
  onRefresh: () => void;
}

export function WhatsAppCloudConnectionsList({ connections, onRefresh }: WhatsAppCloudConnectionsListProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      const response = await fetch(`/api/whatsapp-cloud/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir conexão');
      }

      toast({
        title: "Conexão excluída",
        description: "A conexão foi removida com sucesso.",
      });

      onRefresh();
    } catch (error) {
      console.error('Erro ao excluir conexão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conexão. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
      setDeleteModalOpen(false);
      setConnectionToDelete(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      setIsUpdating(id);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      const response = await fetch(`/api/whatsapp-cloud/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar status');
      }

      toast({
        title: "Status atualizado",
        description: `A conexão foi ${newStatus === 'active' ? 'ativada' : 'desativada'} com sucesso.`,
      });

      onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o status. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const copyWebhookUrl = useCallback(async (id: string, webhookUrl: string) => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(id);
    setTimeout(() => setCopiedWebhook(null), 2000);
    
    toast({
      title: "URL copiada",
      description: "URL do webhook copiada para a área de transferência.",
    });
  }, [toast]);

  const copyVerifyToken = useCallback(async (id: string, verifyToken: string) => {
    await navigator.clipboard.writeText(verifyToken);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
    
    toast({
      title: "Token copiado",
      description: "Token de verificação copiado para a área de transferência.",
    });
  }, [toast]);

  const getStatusColor = (status: WhatsAppConnection['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500';
      case 'inactive':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'error':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const openDeleteModal = (id: string) => {
    setConnectionToDelete(id);
    setDeleteModalOpen(true);
  };

  return (
    <>
      <div className="grid gap-4">
        {connections.map((connection) => (
          <Card key={connection.id} className="bg-[#1A1D24] border-gray-800 hover:border-gray-700 transition-colors">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">
                      {connection.phoneNumberId}
                    </span>
                    <span className="text-sm text-gray-400 font-mono">
                      ID: {connection.id.slice(0, 8)}
                    </span>
                  </div>
                  <Badge className={`${getStatusColor(connection.status)} px-2 py-0.5`}>
                    {connection.status === 'active' ? 'Ativo' : 
                     connection.status === 'inactive' ? 'Inativo' : 'Erro'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`group ${
                            connection.status === 'active'
                              ? 'hover:bg-green-950 hover:text-green-400'
                              : 'hover:bg-yellow-950 hover:text-yellow-400'
                          }`}
                          onClick={() => handleToggleStatus(connection.id, connection.status)}
                          disabled={isUpdating === connection.id}
                        >
                          {isUpdating === connection.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Power className={`h-4 w-4 ${
                              connection.status === 'active'
                                ? 'text-green-500'
                                : 'text-yellow-500'
                            }`} />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{connection.status === 'active' ? 'Desativar' : 'Ativar'} conexão</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-red-950 group"
                          onClick={() => openDeleteModal(connection.id)}
                          disabled={isDeleting === connection.id}
                        >
                          <Trash2 className="h-4 w-4 text-red-500 group-hover:text-red-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Excluir conexão</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {connection.webhookUrl && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-300 font-mono truncate">
                        {connection.webhookUrl}
                      </span>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-gray-800 group h-8 w-8"
                            onClick={() => copyWebhookUrl(connection.id, connection.webhookUrl!)}
                          >
                            {copiedWebhook === connection.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copiar URL do webhook</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {connection.verifyToken && (
                    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-300 font-mono truncate">
                          {connection.verifyToken}
                        </span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-gray-800 group h-8 w-8"
                              onClick={() => copyVerifyToken(connection.id, connection.verifyToken!)}
                            >
                              {copiedToken === connection.id ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copiar token de verificação</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <DeleteWhatsAppConnectionModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setConnectionToDelete(null);
        }}
        onConfirm={() => connectionToDelete && handleDelete(connectionToDelete)}
        connectionId={connectionToDelete || ''}
      />
    </>
  );
} 
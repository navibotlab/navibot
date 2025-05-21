import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { QrCode } from 'lucide-react';
import { Agent } from '@/types/agent';
import { DisparaJaConnection } from '../types'; // Importar do arquivo de types

interface ConnectionFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  agents: Agent[];
  onSuccess: () => Promise<void>;
  isEditing: boolean;
  editingConnection: DisparaJaConnection | null;
}

export default function ConnectionForm({ 
  isOpen, 
  onOpenChange, 
  agents, 
  onSuccess, 
  isEditing,
  editingConnection
}: ConnectionFormProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [secret, setSecret] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Carregar dados da conexão para edição
  useEffect(() => {
    if (isEditing && editingConnection) {
      setSelectedAgent(editingConnection.agentId);
      setSecret(editingConnection.secret);
    } else {
      resetForm();
    }
  }, [isEditing, editingConnection]);

  // Função para resetar o formulário
  const resetForm = () => {
    setSelectedAgent('');
    setSecret('');
  };

  // Função para atualizar a conexão (apenas na edição)
  const handleSaveConnection = async () => {
    if (!selectedAgent || !secret) {
      toast({
        title: 'Erro',
        description: 'Selecione um agente e forneça o secret.',
        variant: 'destructive',
      });
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch('/api/dispara-ja/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: selectedAgent,
          secret,
          sid: "3" // Valor fixo
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Falha ao atualizar conexão');
      }

      toast({
        title: 'Sucesso',
        description: 'Conexão atualizada com sucesso!',
      });
      
      // Atualizar lista de conexões e fechar modal
      await onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar conexão:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível salvar a conexão.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Função para gerar QR code e conectar
  const handleGenerateQRCode = () => {
    if (!selectedAgent || !secret) {
      toast({
        title: 'Erro',
        description: 'Selecione um agente e forneça o secret.',
        variant: 'destructive',
      });
      return;
    }
    
    // Emitir evento para o componente pai exibir o QR code
    window.dispatchEvent(new CustomEvent('disparaja:showqrcode', {
      detail: {
        secret,
        sid: "3", // Valor fixo
        agentId: selectedAgent
      }
    }));
    
    // Fechar este modal (o QR code será exibido em outro modal)
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1D24] border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Editar Conexão' : 'Nova Conexão'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure a conexão com o Dispara Já
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent" className="text-white">Agente</Label>
            <Select
              value={selectedAgent}
              onValueChange={setSelectedAgent}
              required
            >
              <SelectTrigger className="bg-[#2A2D35] border-gray-700 text-white">
                <SelectValue placeholder="Selecione um agente" />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2D35] border-gray-700">
                {agents.map((agent) => (
                  <SelectItem
                    key={agent.id}
                    value={agent.id}
                    className="text-white hover:bg-gray-700"
                  >
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secret" className="text-white">
              Secret <span className="text-red-500">*</span>
            </Label>
            <Input
              id="secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="bg-[#2A2D35] border-gray-700 text-white"
              required
              placeholder="Seu secret do Dispara Já"
            />
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 text-white hover:bg-gray-800"
          >
            Cancelar
          </Button>
          {isEditing ? (
            <Button
              type="button"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={isConnecting}
              onClick={handleSaveConnection}
            >
              {isConnecting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Atualizando...
                </>
              ) : (
                'Atualizar'
              )}
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleGenerateQRCode}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Conectar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
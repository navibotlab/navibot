'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { InfoIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Agent } from "@/types/agent";
import { safeLog } from "@/lib/utils/security";
import { FaWhatsapp } from 'react-icons/fa';

interface WhatsAppCloudConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function WhatsAppCloudConfigModal({ isOpen, onClose, onSuccess }: WhatsAppCloudConfigModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [formData, setFormData] = useState({
    phoneNumberId: '',
    accessToken: '',
    agentId: '',
  });
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({});

  // Carregar lista de agentes quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      const fetchAgents = async () => {
        try {
          const response = await fetch('/api/agents');
          if (!response.ok) throw new Error('Falha ao carregar agentes');
          const data = await response.json();
          setAgents(data);
        } catch (error) {
          console.error('Erro ao carregar agentes:', error);
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar a lista de agentes.',
            variant: 'destructive',
          });
        }
      };

      fetchAgents();
    }
  }, [isOpen]); // Apenas recarrega quando o modal abrir/fechar

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAgentChange = (value: string) => {
    setFormData(prev => ({ ...prev, agentId: value }));
  };

  // Validação em tempo real
  const validate = () => {
    const errors: { [k: string]: string } = {};
    if (!formData.agentId) errors.agentId = 'Selecione um agente';
    if (!formData.phoneNumberId || !/^\d+$/.test(formData.phoneNumberId)) errors.phoneNumberId = 'ID do número inválido';
    if (!formData.accessToken) errors.accessToken = 'Token obrigatório';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);

    try {
      // Log seguro sem expor dados sensíveis
      safeLog('Enviando requisição para criar conexão WhatsApp Cloud', { 
        phoneNumberId: formData.phoneNumberId,
        agentId: formData.agentId 
      });

      const response = await fetch('/api/whatsapp-cloud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Status da resposta:', response.status);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao criar conexão');
      }

      toast({
        title: "Conexão criada",
        description: "A conexão com o WhatsApp foi configurada com sucesso.",
      });

      setFormData({
        phoneNumberId: '',
        accessToken: '',
        agentId: '',
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro detalhado ao criar conexão:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível criar a conexão. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FaWhatsapp className="text-green-500 text-2xl" />
            <DialogTitle>Nova Conexão WhatsApp Cloud API</DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="agent" className="flex items-center gap-2 mb-1.5">
                Agente <InfoIcon className="h-4 w-4 text-gray-400" />
              </Label>
              <Select
                value={formData.agentId}
                onValueChange={handleAgentChange}
                disabled={isLoading || !agents.length}
              >
                <SelectTrigger className="w-full border border-solid border-white bg-transparent" id="agent" aria-invalid={!!formErrors.agentId} aria-describedby="agent-error">
                  <SelectValue placeholder={isLoading ? 'Carregando agentes...' : 'Selecione um agente'} />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id} >
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.agentId && <span id="agent-error" className="text-red-500 text-xs">{formErrors.agentId}</span>}
              <p className="text-sm text-gray-400 mt-1">Selecione o agente que irá gerenciar esta conexão</p>
            </div>

            <div>
              <Label htmlFor="phoneNumberId" className="flex items-center gap-2 mb-1">
                Número de identificação do telefone <InfoIcon className="h-4 w-4 text-gray-400" />
              </Label>
              <Input
                id="phoneNumberId"
                name="phoneNumberId"
                value={formData.phoneNumberId}
                onChange={handleChange}
                placeholder="Exemplo: 108367493483810"
                required
                aria-invalid={!!formErrors.phoneNumberId}
                aria-describedby="phoneNumberId-error"
                className="border border-solid border-white bg-transparent"
              />
              {formErrors.phoneNumberId && <span id="phoneNumberId-error" className="text-red-500 text-xs">{formErrors.phoneNumberId}</span>}
              <p className="text-sm text-gray-400 mt-1">ID do número verificado no WhatsApp Business</p>
            </div>

            <div>
              <Label htmlFor="accessToken" className="flex items-center gap-2 mb-1">
                Token Permanente <InfoIcon className="h-4 w-4 text-gray-400" />
              </Label>
              <Input
                id="accessToken"
                name="accessToken"
                type="password"
                value={formData.accessToken}
                onChange={handleChange}
                placeholder="Cole aqui o token do Meta for Developers"
                required
                aria-invalid={!!formErrors.accessToken}
                aria-describedby="accessToken-error"
                className="border border-solid border-white bg-transparent"
              />
              {formErrors.accessToken && <span id="accessToken-error" className="text-red-500 text-xs">{formErrors.accessToken}</span>}
              <p className="text-sm text-gray-400 mt-1">Token de acesso permanente gerado no Meta for Developers</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} aria-busy={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
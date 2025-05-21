'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { FaWhatsapp } from 'react-icons/fa';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function WhatsAppCloudConfig({ agents = [] }: { agents?: { id: string, name: string }[] }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    agentId: '',
    phoneNumberId: '',
    accessToken: '',
    businessId: '',
  });
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({});

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
      const response = await fetch('/api/whatsapp-cloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar configuração');
      toast({ title: 'Conexão criada com sucesso!', description: 'A conexão com o WhatsApp Cloud foi salva.' });
      setFormData({ agentId: '', phoneNumberId: '', accessToken: '', businessId: '' });
      setFormErrors({});
    } catch (error) {
      toast({ title: 'Erro', description: error instanceof Error ? error.message : 'Não foi possível salvar.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={e => { if (e.target === e.currentTarget) {/* fechar modal */} }}>
      <Card className="w-full max-w-md mx-auto animate-fade-in rounded-xl shadow-2xl">
        <CardHeader className="flex flex-row items-center gap-2">
          <FaWhatsapp className="text-green-500 text-2xl" />
          <div>
            <CardTitle>Nova Conexão WhatsApp Cloud API</CardTitle>
            <CardDescription>Configure a integração oficial do WhatsApp Business Cloud</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="agent">Agente *</Label>
              <Select value={formData.agentId} onValueChange={v => setFormData(f => ({ ...f, agentId: v }))} disabled={isLoading || !agents.length}>
                <SelectTrigger id="agent" aria-invalid={!!formErrors.agentId} aria-describedby="agent-error">
                  <SelectValue placeholder={isLoading ? 'Carregando agentes...' : 'Selecione um agente'} />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.agentId && <span id="agent-error" className="text-red-500 text-xs">{formErrors.agentId}</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumberId">ID do número verificado *</Label>
              <Input
                id="phoneNumberId"
                value={formData.phoneNumberId}
                onChange={e => setFormData(f => ({ ...f, phoneNumberId: e.target.value }))}
                placeholder="Ex: 1234567890"
                required
                aria-invalid={!!formErrors.phoneNumberId}
                aria-describedby="phoneNumberId-error"
              />
              {formErrors.phoneNumberId && <span id="phoneNumberId-error" className="text-red-500 text-xs">{formErrors.phoneNumberId}</span>}
              <p className="text-sm text-gray-500">ID do número verificado no WhatsApp Business</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessToken">Token Permanente *</Label>
              <Input
                id="accessToken"
                type="password"
                value={formData.accessToken}
                onChange={e => setFormData(f => ({ ...f, accessToken: e.target.value }))}
                placeholder="Cole aqui o token do Meta for Developers"
                required
                aria-invalid={!!formErrors.accessToken}
                aria-describedby="accessToken-error"
              />
              {formErrors.accessToken && <span id="accessToken-error" className="text-red-500 text-xs">{formErrors.accessToken}</span>}
              <p className="text-sm text-gray-500">Token de acesso permanente gerado no Meta for Developers</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessId">Business ID</Label>
              <Input
                id="businessId"
                value={formData.businessId}
                onChange={e => setFormData(f => ({ ...f, businessId: e.target.value }))}
                placeholder="Digite o ID do seu negócio (opcional)"
              />
              <p className="text-sm text-gray-500">ID do seu negócio no Meta Business Manager (opcional)</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => {/* fechar modal */}} disabled={isLoading}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={isLoading} aria-busy={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
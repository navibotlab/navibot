'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus } from 'lucide-react';

interface OriginGroup {
  id: string;
  name: string;
}

interface AddOriginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOriginAdded: () => void;
  selectedGroupId?: string;
}

export function AddOriginModal({ isOpen, onClose, onOriginAdded, selectedGroupId }: AddOriginModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originGroups, setOriginGroups] = useState<OriginGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  
  // Dados do formulário
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [originGroupId, setOriginGroupId] = useState(selectedGroupId || '');
  const [active, setActive] = useState(true);
  const [createDefaultStages, setCreateDefaultStages] = useState(true);

  // Log para depuração
  useEffect(() => {
    console.log("Modal status mudou:", { isOpen, selectedGroupId });
  }, [isOpen, selectedGroupId]);

  // Carregar grupos de origem ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      console.log("Modal aberta, carregando dados...");
      fetchOriginGroups();
      
      // Reinicializar formulário
      setName('');
      setDescription('');
      setOriginGroupId(selectedGroupId || '');
      setActive(true);
      setCreateDefaultStages(true);
    }
  }, [isOpen, selectedGroupId]);

  const fetchOriginGroups = async () => {
    try {
      setIsLoadingGroups(true);
      const response = await fetch('/api/crm/origin-groups');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar grupos de origem');
      }
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        setOriginGroups(data.data);
        
        // Se não houver grupo selecionado e houver grupos disponíveis, selecione o primeiro
        if (!selectedGroupId && data.data.length > 0 && !originGroupId) {
          setOriginGroupId(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar grupos de origem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os grupos de origem",
        variant: "destructive",
      });
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da origem é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    if (!originGroupId) {
      toast({
        title: "Erro",
        description: "Selecione um grupo de origem",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      console.log('Enviando solicitação para criar origem com as seguintes configurações:', {
        name,
        description,
        originGroupId,
        active,
        createDefaultStages
      });
      
      const response = await fetch('/api/crm/origins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          originGroupId,
          active,
          createDefaultStages,
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Falha ao criar origem');
      }
      
      console.log('Origem criada com sucesso:', responseData);
      
      // Verificar se houve erro na criação dos estágios
      const stagesError = responseData.stages && !responseData.stages.success && !responseData.stages.skipped;
      
      toast({
        title: stagesError ? "Atenção" : "Sucesso",
        description: responseData.stages?.success 
          ? "Origem e estágios padrão criados com sucesso!" 
          : (responseData.stages?.skipped 
            ? "Origem criada com sucesso. Estágios padrão não foram criados conforme solicitado."
            : stagesError
              ? `Origem criada, mas houve um erro ao criar os estágios padrão: ${responseData.stages?.message || 'Erro desconhecido'}`
              : "Origem criada com sucesso!"),
        variant: stagesError ? "destructive" : "default",
      });
      
      // Notificar que uma origem foi adicionada
      onOriginAdded();
      
      // Fechar o modal
      onClose();
    } catch (error) {
      console.error('Erro ao criar origem:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao criar origem",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se o modal não estiver aberto, não renderizar nada
  if (!isOpen) return null;

  return (
    <Dialog open={true} onOpenChange={(open) => {
      console.log("Dialog onOpenChange:", open);
      if (!open) onClose();
    }}>
      <DialogContent className="bg-[#1A1D24] border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Origem</DialogTitle>
          <DialogDescription className="text-gray-400">
            Crie uma nova origem para receber leads no CRM.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da origem*</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Site institucional, WhatsApp, Facebook..."
              className="bg-[#0F1115] border-gray-800 focus:border-blue-600"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva brevemente esta origem de leads"
              className="bg-[#0F1115] border-gray-800 focus:border-blue-600 min-h-[80px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="originGroup">Grupo de origem*</Label>
            <Select 
              value={originGroupId} 
              onValueChange={setOriginGroupId}
              disabled={isLoadingGroups || isSubmitting}
            >
              <SelectTrigger 
                id="originGroup"
                className="bg-[#0F1115] border-gray-800 focus:border-blue-600"
              >
                <SelectValue placeholder="Selecione um grupo">
                  {isLoadingGroups ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>Carregando...</span>
                    </div>
                  ) : (
                    originGroups.find(g => g.id === originGroupId)?.name || "Selecione um grupo"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#1A1D24] border-gray-800 text-white">
                {originGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
                {!isLoadingGroups && originGroups.length === 0 && (
                  <div className="p-2 text-sm text-gray-400">
                    Nenhum grupo encontrado
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="active" 
              checked={active}
              onCheckedChange={setActive}
              disabled={isSubmitting}
              className={active ? "data-[state=checked]:bg-green-500" : ""}
            />
            <Label htmlFor="active" className="cursor-pointer">Ativo</Label>
          </div>
          
          <div className="flex items-center space-x-2 border-t border-gray-800 pt-4 mt-4">
            <div className="flex items-start gap-2">
              <Switch 
                id="createDefaultStages" 
                checked={createDefaultStages}
                onCheckedChange={setCreateDefaultStages}
                disabled={isSubmitting}
                className={`mt-0.5 ${createDefaultStages ? "data-[state=checked]:bg-green-500" : ""}`}
              />
              <div className="flex flex-col">
                <Label htmlFor="createDefaultStages" className="cursor-pointer font-medium">Criar estágios padrão</Label>
                <p className="text-xs text-gray-400 mt-1">
                  Cria automaticamente estágios de pipeline padrão para esta origem (Qualificação, Proposta, Negociação, etc.)
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
              className="bg-transparent border-gray-700 text-white hover:bg-[#2A2D34] hover:text-white"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || !name || !originGroupId}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Criando...</span>
                </>
              ) : (
                <span>Criar origem</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
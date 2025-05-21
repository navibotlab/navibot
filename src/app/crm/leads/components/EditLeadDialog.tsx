import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Upload } from "lucide-react";
import Image from "next/image";
import { SimpleDialog } from "@/components/SimpleDialog";
import { SimpleDialogFooter } from "@/components/SimpleDialogFooter";
import { LabelSelector } from './LabelSelector';
import { Label as LabelType } from '@/app/admin/conteudos/configuracoes-contato/etiquetas/components/LabelsList';

interface Lead {
  id: string;
  name: string | null;
  phone: string;
  photo: string | null;
  createdAt: string;
  updatedAt: string;
  labels: LabelType[];
}

interface EditLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated: () => void;
  leadId: string | null;
}

export function EditLeadDialog({
  open,
  onOpenChange,
  onLeadUpdated,
  leadId
}: EditLeadDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLead, setIsLoadingLead] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
  });
  const [selectedLabels, setSelectedLabels] = useState<LabelType[]>([]);
  const [lead, setLead] = useState<Lead | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Referência para controlar quando a requisição já foi feita
  const leadRequestMade = useRef(false);

  // Carregar dados do lead quando o modal abrir
  useEffect(() => {
    // Verificar se o leadId existe, o modal está aberto e ainda não tentamos carregar este lead
    if (!leadId || !open || leadRequestMade.current) return;
    
    console.log('EditLeadDialog: Iniciando carregamento do lead:', leadId);
    
    // Marcamos que já tentamos carregar este lead
    leadRequestMade.current = true;
    
    const fetchLead = async () => {
      setIsLoadingLead(true);
      try {
        const response = await fetch(`/api/crm/leads/${leadId}`);
        if (!response.ok) {
          throw new Error('Erro ao buscar dados do contato');
        }
        
        const leadData = await response.json();
        console.log('EditLeadDialog: Dados do lead carregados:', leadData);
        setLead(leadData);
        setFormData({
          name: leadData.name || '',
        });
        
        // Carregar etiquetas do lead
        if (leadData.labels && Array.isArray(leadData.labels)) {
          console.log('EditLeadDialog: Etiquetas do lead:', leadData.labels);
          setSelectedLabels(leadData.labels);
        } else {
          console.log('EditLeadDialog: Lead sem etiquetas ou formato inválido');
          setSelectedLabels([]);
        }
        
        // Carregar foto se existir
        if (leadData.photo) {
          setPhotoPreview(`/api/crm/leads/${leadId}/photo?t=${Date.now()}`);
        } else {
          setPhotoPreview(null);
        }
      } catch (error) {
        console.error('EditLeadDialog: Erro ao carregar dados do contato:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do contato",
          variant: "destructive",
        });
      } finally {
        setIsLoadingLead(false);
        console.log('EditLeadDialog: Carregamento concluído');
      }
    };
    
    fetchLead();
  }, [leadId, open, toast]);

  // Resetar o estado quando o modal é fechado
  useEffect(() => {
    if (!open) {
      // Resetar flag para permitir nova requisição quando o modal abrir novamente
      leadRequestMade.current = false;
      console.log('EditLeadDialog: Modal fechado, resetando estado');
    }
  }, [open]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast({
          title: "Erro",
          description: "A foto deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leadId) return;
    
    setIsLoading(true);
    console.log('EditLeadDialog: Iniciando atualização do lead', leadId);
    console.log('EditLeadDialog: Dados a serem enviados:', {
      name: formData.name,
      labels: selectedLabels.map(label => label.id)
    });

    try {
      // Atualizar dados do lead
      const leadResponse = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          labels: Array.isArray(selectedLabels) 
            ? selectedLabels
                .filter(label => label && label.id)
                .map(label => ({ id: label.id }))
            : []
        }),
      });

      console.log('EditLeadDialog: Status da resposta:', leadResponse.status);
      
      // Precisamos clonar a resposta antes de ler o corpo
      const responseClone = leadResponse.clone();
      
      if (!leadResponse.ok) {
        const errorData = await leadResponse.json().catch(e => ({ error: "Erro ao processar resposta" }));
        console.error('EditLeadDialog: Erro retornado pela API:', errorData);
        throw new Error(errorData.error || 'Erro ao atualizar contato');
      }

      try {
        const updatedLeadData = await responseClone.json();
        console.log('EditLeadDialog: Lead atualizado com sucesso:', updatedLeadData);
      } catch (err) {
        console.log('EditLeadDialog: Aviso - Não foi possível ler os dados da resposta JSON, mas a atualização foi bem-sucedida');
      }

      // Se o photoPreview for diferente da URL da foto atual do lead e não for null
      // isso significa que uma nova foto foi selecionada
      const isPhotoChanged = photoPreview && 
        !photoPreview.startsWith(`/api/crm/leads/${leadId}/photo`);
      
      // Se tiver uma nova foto, faz o upload
      if (isPhotoChanged) {
        console.log('EditLeadDialog: Detectada nova foto, iniciando upload');
        try {
          // Converter base64 para blob
          const photoBlob = await fetch(photoPreview).then(r => r.blob());
          
          // Criar um arquivo a partir do blob
          const fileName = `lead-photo-${Date.now()}.jpg`;
          const file = new File([photoBlob], fileName, { type: 'image/jpeg' });
          
          // Criar FormData para envio
          const photoFormData = new FormData();
          photoFormData.append('photo', file);

          // Enviar para o endpoint de upload
          const photoResponse = await fetch(`/api/crm/leads/${leadId}/photo`, {
            method: 'POST',
            body: photoFormData,
          });

          if (!photoResponse.ok) {
            const errorData = await photoResponse.json().catch(() => ({ error: 'Erro desconhecido' }));
            console.error('EditLeadDialog: Erro ao fazer upload da foto:', errorData);
            throw new Error(errorData.error || 'Erro ao fazer upload da foto');
          }
          
          const photoResult = await photoResponse.json();
          console.log('EditLeadDialog: Foto atualizada com sucesso:', photoResult);
        } catch (photoError) {
          console.error('EditLeadDialog: Exceção durante upload da foto:', photoError);
          // Mostramos o erro, mas não interrompemos o fluxo, já que os dados do lead foram atualizados
          toast({
            title: "Aviso",
            description: "Os dados foram atualizados, mas houve um problema ao atualizar a foto.",
            variant: "destructive",
          });
        }
      }

      // Após a atualização bem-sucedida
      toast({
        title: "Sucesso",
        description: "Dados do contato atualizados com sucesso",
      });

      // Fechar modal e atualizar a lista
      onOpenChange(false);
      onLeadUpdated();
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o contato",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleCloseWithConfirmation = () => {
    // Fechar diretamente sem confirmação
    onOpenChange(false);
  };

  // Função para manipular mudanças nas etiquetas
  const handleLabelsChange = (labels: LabelType[]) => {
    console.log('EditLeadDialog: Atualizando etiquetas:', labels);
    setSelectedLabels([...labels]);
  };

  if (isLoadingLead) {
    return (
      <SimpleDialog 
        open={open}
        onClose={handleCloseWithConfirmation}
        title="Editar Contato"
        description="Carregando dados do contato..."
        maxWidth="max-w-[500px]"
        className="bg-[#1A1D24] text-white border-gray-800"
      >
        <div className="flex justify-center items-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      </SimpleDialog>
    );
  }

  // Se não tiver lead, não renderiza o conteúdo principal
  if (!lead && !isLoadingLead) {
    console.log('EditLeadDialog: lead não encontrado e não está em carregamento');
    return null;
  }

  return (
    <SimpleDialog 
      open={open}
      onClose={handleCloseWithConfirmation}
      title="Editar Contato"
      description="Edite as informações do contato abaixo."
      maxWidth="max-w-[500px]"
      className="bg-[#1A1D24] text-white border-gray-800"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 py-4">
          {/* Área de upload de foto */}
          <div className="flex flex-col items-center gap-4">
            <div 
              onClick={handlePhotoClick}
              className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-dashed border-gray-700 flex items-center justify-center bg-gray-900/50"
            >
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">
                    Adicionar foto
                  </span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Campo de nome */}
          <div>
            <Label htmlFor="name" className="text-white">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-2 bg-gray-900/50 border-gray-700 text-white"
              placeholder="Digite o nome do contato"
            />
          </div>

          {/* Campo somente leitura para telefone */}
          <div>
            <Label htmlFor="phone" className="text-white">Telefone</Label>
            <Input
              id="phone"
              value={lead?.phone || ''}
              readOnly
              disabled
              className="mt-2 bg-gray-900/50 border-gray-700 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">O número de telefone não pode ser alterado</p>
          </div>

          {/* Etiquetas */}
          <div className="space-y-2">
            <Label className="text-white">Etiquetas</Label>
            <div>
              <p className="text-xs text-gray-500 mb-2">Etiquetas selecionadas: {selectedLabels.length}</p>
              <LabelSelector 
                selectedLabels={selectedLabels}
                onLabelsChange={handleLabelsChange}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <SimpleDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCloseWithConfirmation}
            className="bg-transparent text-white border-gray-600 hover:bg-gray-800 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white hover:bg-blue-500"
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </SimpleDialogFooter>
      </form>
    </SimpleDialog>
  );
} 
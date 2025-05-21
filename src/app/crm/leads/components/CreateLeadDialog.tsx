import { useState, useRef, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Upload } from "lucide-react";
import Image from "next/image";
import { CountrySelect } from "@/components/CountrySelect";
import { SimpleDialog } from "@/components/SimpleDialog";
import { SimpleDialogFooter } from "@/components/SimpleDialogFooter";
import { LabelSelector } from './LabelSelector';
import { Label as LabelType } from '@/app/admin/conteudos/configuracoes-contato/etiquetas/components/LabelsList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import axios from "axios";

// Definindo o enum CountryCode localmente se não estiver disponível no import
enum CountryCode {
  BR = '+55',
  US = '+1',
  GB = '+44',
  PT = '+351',
  ES = '+34',
  AR = '+54',
  MX = '+52'
}

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadCreated: () => void;
}

// Função para formatar o número de telefone de acordo com a máscara
const formatPhoneNumber = (value: string, mask: string) => {
  if (!value) return '';
  
  let result = '';
  let index = 0;
  
  // Remover qualquer formatação existente
  const rawValue = value.replace(/\D/g, '');
  
  for (let i = 0; i < mask.length && index < rawValue.length; i++) {
    if (mask[i] === '9') {
      result += rawValue[index++];
    } else {
      result += mask[i];
      if (index < rawValue.length && mask[i] === rawValue[index]) {
        index++;
      }
    }
  }
  
  return result;
};

export function CreateLeadDialog({
  open,
  onOpenChange,
  onLeadCreated
}: CreateLeadDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    countryCode: CountryCode;
  }>({
    name: '',
    phone: '',
    countryCode: CountryCode.BR,
  });
  const [selectedLabels, setSelectedLabels] = useState<LabelType[]>([]);
  const [formattedPhone, setFormattedPhone] = useState(''); // Estado para o número formatado
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Log para depuração quando componente é montado ou desmontado
  useEffect(() => {
    console.log("CreateLeadDialog montado ou atualizado");
    console.log("Estado inicial de selectedLabels:", selectedLabels);
    return () => {
      console.log("CreateLeadDialog desmontado");
    };
  }, []);

  // Log toda vez que selectedLabels mudar
  useEffect(() => {
    console.log("CreateLeadDialog - selectedLabels atualizado:", selectedLabels);
    console.log("Contagem de etiquetas selecionadas:", selectedLabels.length);
  }, [selectedLabels]);

  // Função para determinar a máscara com base no código do país
  const getPhoneMask = useMemo(() => {
    switch (formData.countryCode) {
      case CountryCode.BR: // Brasil
        return '(99) 99999-9999';
      case CountryCode.US: // EUA e Canadá
        return '(999) 999-9999';
      case CountryCode.GB: // Reino Unido
        return '9999 999999';
      case CountryCode.PT: // Portugal
        return '999 999 999';
      case CountryCode.ES: // Espanha
        return '999 999 999';
      case CountryCode.AR: // Argentina
        return '(999) 999-9999';
      case CountryCode.MX: // México
        return '(999) 999-9999';
      default:
        // Fallback para outros países - máscara genérica
        return '999999999999';
    }
  }, [formData.countryCode]);

  // Função para obter o formato sem máscara para validação
  const getPhoneRegex = useMemo(() => {
    switch (formData.countryCode) {
      case CountryCode.BR: // Brasil - 10 ou 11 dígitos (com 9)
        return /^\d{10,11}$/;
      case CountryCode.US: // EUA - 10 dígitos
        return /^\d{10}$/;
      case CountryCode.GB: // Reino Unido - 10 dígitos
        return /^\d{10}$/;
      case CountryCode.PT: // Portugal - 9 dígitos
        return /^\d{9}$/;
      default:
        // Padrão para outros países - de 7 a 12 dígitos
        return /^\d{7,12}$/;
    }
  }, [formData.countryCode]);

  // Função para obter o limite máximo de dígitos permitidos por país
  const getMaxDigits = useMemo(() => {
    switch (formData.countryCode) {
      case CountryCode.BR: // Brasil
        return 11;
      case CountryCode.US: // EUA e Canadá
        return 10;
      case CountryCode.GB: // Reino Unido
        return 10;
      case CountryCode.PT: // Portugal
        return 9;
      case CountryCode.ES: // Espanha
        return 9;
      case CountryCode.AR: // Argentina
        return 10;
      case CountryCode.MX: // México
        return 10;
      default:
        return 12;
    }
  }, [formData.countryCode]);

  // Uso de useEffect para garantir a aplicação correta da máscara
  useEffect(() => {
    if (formData.phone) {
      // Garante que a formatação é aplicada sempre que o telefone ou o país mudam
      const formatted = formatPhoneNumber(formData.phone, getPhoneMask);
      setFormattedPhone(formatted);
    } else {
      setFormattedPhone('');
    }
  }, [formData.phone, formData.countryCode, getPhoneMask]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Verifica se o telefone está vazio
    if (!formData.phone.trim()) {
      newErrors.phone = 'O número é obrigatório';
    } else {
      // Remove todos os caracteres não-numéricos para contar apenas os dígitos
      const phoneDigits = formData.phone.replace(/\D/g, '');
      // Garantir que respeitamos o limite de dígitos
      const limitedPhoneDigits = phoneDigits.substring(0, getMaxDigits);
      
      console.log('Validando telefone:', limitedPhoneDigits, 'Comprimento:', limitedPhoneDigits.length);

      // Específico para Brasil (+55): precisa ter 10 ou 11 dígitos
      if (formData.countryCode === CountryCode.BR && (limitedPhoneDigits.length < 10 || limitedPhoneDigits.length > 11)) {
        newErrors.phone = 'O telefone brasileiro deve ter 10 ou 11 dígitos';
      } 
      // Para outros países, usamos a expressão regular apropriada
      else if (formData.countryCode !== CountryCode.BR && !getPhoneRegex.test(limitedPhoneDigits)) {
        newErrors.phone = 'Formato inválido para o país selecionado';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleLabelsChange = (labels: LabelType[]) => {
    console.log("CreateLeadDialog: handleLabelsChange chamado com:", labels);
    console.log("CreateLeadDialog: Estado anterior de selectedLabels:", selectedLabels);
    
    // Garantir que estamos tratando um array
    if (!Array.isArray(labels)) {
      console.error("CreateLeadDialog: Labels não é um array:", labels);
      return;
    }
    
    // Criar uma cópia explícita do array
    const newLabels = [...labels];
    console.log("CreateLeadDialog: Atualizando selectedLabels para:", newLabels);
    
    // Atualizar o estado
    setSelectedLabels(newLabels);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validação do formulário
    if (!formData.phone) {
      setError('Por favor, insira o número de telefone');
      setLoading(false);
      return;
    }

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Combinar código do país com o número de telefone
      // Remover o '+' do código do país e concatenar com o número do telefone
      const countryCodeWithoutPlus = formData.countryCode.replace('+', '');
      const fullPhone = `${countryCodeWithoutPlus}${formData.phone}`;
      
      console.log("Telefone completo (com código do país):", fullPhone);
      
      // Preparar payload (sem a foto que será enviada separadamente)
      const payload = {
        ...formData,
        phone: fullPhone, // Substituir o telefone pelo telefone completo com código do país
        labels: Array.isArray(selectedLabels) 
          ? selectedLabels
              .filter(label => label && label.id)
              .map(label => ({ id: label.id }))
          : []
      };

      console.log("Payload para criação de lead:", payload);
      console.log("Etiquetas selecionadas enviadas:", selectedLabels);

      // Enviar requisição para criar o lead
      const response = await axios.post('/api/crm/leads', payload);
      
      console.log("Resposta da API:", response.data);
      
      // Se houver uma foto, enviar separadamente
      if (photoPreview) {
        await uploadPhoto(response.data.id);
      }
      
      // Resetar o formulário
      setFormData({
        name: '',
        phone: '',
        countryCode: CountryCode.BR,
      });
      setPhotoPreview(null);
      setSelectedLabels([]);
      
      // Fechar o modal e chamar o callback de sucesso
      if (onOpenChange) onOpenChange(false);
      if (onLeadCreated) onLeadCreated();
      
      toast({
        title: 'Lead criado com sucesso!',
        description: 'O novo lead foi adicionado à sua lista.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro detalhado ao criar lead:', error);
      
      // Melhor tratamento de erros para extrair mais informações
      if (axios.isAxiosError(error) && error.response) {
        console.error('Status do erro:', error.response.status);
        console.error('Dados da resposta:', error.response.data);
        
        if (error.response.status === 409) {
          setError('Este número já está cadastrado como lead.');
        } else {
          setError(error.response?.data?.error || 'Erro ao criar o lead');
        }
      } else {
        setError('Erro desconhecido ao criar o lead');
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para enviar a foto para o API endpoint
  const uploadPhoto = async (leadId: string) => {
    try {
      setIsLoading(true);
      
      // Verifica se temos uma prévia da foto para upload
      if (!photoPreview) return;
      
      // Converte o base64 para um arquivo
      const base64Response = await fetch(photoPreview);
      const blob = await base64Response.blob();
      
      // Cria um objeto File a partir do Blob
      const fileName = `lead-photo-${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      
      // Cria um FormData para envio
      const formData = new FormData();
      formData.append('photo', file);
      
      // Envia para o endpoint de upload de foto
      const response = await axios.post(`/api/crm/leads/${leadId}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Foto enviada com sucesso:', response.data);
      
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer upload da foto, mas o lead foi criado.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Extrair apenas os dígitos para armazenar no state
    let rawValue = inputValue.replace(/\D/g, '');
    
    // Limitar o número de dígitos com base no país selecionado
    if (rawValue.length > getMaxDigits) {
      rawValue = rawValue.substring(0, getMaxDigits);
    }
    
    console.log('handlePhoneChange - rawValue:', rawValue, 'Comprimento:', rawValue.length);
    
    // Atualiza o estado com apenas os dígitos (sem formatação) e limitado
    setFormData(prev => ({ ...prev, phone: rawValue }));
    
    // Atualiza o campo formatado
    setFormattedPhone(formatPhoneNumber(rawValue, getPhoneMask));
    
    // Limpa o erro enquanto digita
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const handlePhoneBlur = () => {
    // Valida o telefone quando o campo perde o foco
    if (formData.phone) {
      // Remove todos os caracteres não-numéricos
      const phoneDigits = formData.phone.replace(/\D/g, '');
      
      // Limitamos novamente aqui para garantir consistência
      const limitedPhoneDigits = phoneDigits.substring(0, getMaxDigits);
      
      console.log('handlePhoneBlur - phoneDigits:', limitedPhoneDigits, 'Comprimento:', limitedPhoneDigits.length);
      
      // Atualizamos o formData para garantir que está limitado
      if (phoneDigits.length > getMaxDigits) {
        setFormData(prev => ({ ...prev, phone: limitedPhoneDigits }));
        setFormattedPhone(formatPhoneNumber(limitedPhoneDigits, getPhoneMask));
      }
      
      if (formData.countryCode === CountryCode.BR && (limitedPhoneDigits.length < 10 || limitedPhoneDigits.length > 11)) {
        setErrors(prev => ({ 
          ...prev, 
          phone: 'O telefone brasileiro deve ter 10 ou 11 dígitos' 
        }));
      } 
      else if (formData.countryCode !== CountryCode.BR && !getPhoneRegex.test(limitedPhoneDigits)) {
        setErrors(prev => ({ 
          ...prev, 
          phone: 'Formato inválido para o país selecionado' 
        }));
      } 
      else {
        // Se estiver válido, limpa o erro
        setErrors(prev => ({ ...prev, phone: '' }));
      }
    }
  };

  const handleCloseWithConfirmation = () => {
    // Fechar diretamente sem confirmação
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onOpenChange && onOpenChange(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar novo Lead</DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para criar um novo lead no sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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
                    <Upload className="h-5 w-5 text-gray-400" />
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

            {/* Campos de telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">Telefone</Label>
              <div className="flex gap-2">
                <div className="w-[140px]">
                  <CountrySelect
                    value={formData.countryCode}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, countryCode: value as CountryCode }))}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    id="phone"
                    value={formattedPhone}
                    onChange={handlePhoneChange}
                    onBlur={handlePhoneBlur}
                    className={`bg-gray-900/50 border-gray-700 text-white ${
                      errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''
                    }`}
                    placeholder={formData.countryCode === CountryCode.BR ? '(DDD) 99999-9999' : 'Número de telefone'}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Etiquetas */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="labels">Etiquetas</Label>
              <div>
                <p className="text-xs text-gray-500 mb-2">Etiquetas selecionadas: {selectedLabels.length}</p>
                <LabelSelector 
                  selectedLabels={selectedLabels} 
                  onLabelsChange={handleLabelsChange} 
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {error && <p className="text-sm font-medium text-destructive mb-4">{error}</p>}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseWithConfirmation} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Lead'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
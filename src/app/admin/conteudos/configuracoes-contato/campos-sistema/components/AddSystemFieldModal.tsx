'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FieldType, SystemFieldInput } from '../services/systemFieldService';
import { toast } from 'react-hot-toast';
import { X, Plus, Trash2, Type, Hash, Calendar, Clock, Braces, ToggleLeft } from 'lucide-react';

// Opções de tipos de campo com ícones
const fieldTypeOptions = [
  { value: "text", label: 'Text', icon: Type },
  { value: "number", label: 'Number', icon: Hash },
  { value: "boolean", label: 'Boolean', icon: ToggleLeft },
  { value: "date", label: 'Date', icon: Calendar },
  { value: "datetime", label: 'Datetime', icon: Clock },
  { value: "json", label: 'JSON', icon: Braces },
];

interface AddSystemFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: SystemFieldInput) => Promise<void>;
  editingField?: SystemFieldInput;
  isEditing?: boolean;
  existingGroups?: string[]; // Lista de grupos existentes
  onAddNewGroup?: (newGroup: string) => boolean; // Função para adicionar novo grupo
}

export default function AddSystemFieldModal({
  isOpen,
  onClose,
  onSave,
  editingField,
  isEditing = false,
  existingGroups = ['Informações Gerais'], // Valor padrão
  onAddNewGroup
}: AddSystemFieldModalProps) {
  // Estado para o formulário
  const [field, setField] = useState<SystemFieldInput>({
    name: '',
    key: '',
    type: "text",
    required: false,
    editable: true,
    options: [],
    group: 'Informações Gerais',
    description: ''
  });

  // Estado para gerenciar nova opção sendo adicionada
  const [newOption, setNewOption] = useState('');
  
  // Estado para gerenciar novo grupo sendo adicionado
  const [newGroup, setNewGroup] = useState('');
  
  // Estado para controlar a exibição do input de novo grupo
  const [isAddingNewGroup, setIsAddingNewGroup] = useState(false);
  
  // Estados para gerenciar validação do formulário
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Estado para gerenciar o carregamento
  const [isLoading, setIsLoading] = useState(false);

  // Inicializa o formulário com os dados do campo a ser editado
  useEffect(() => {
    if (editingField && isEditing) {
      setField({
        ...editingField,
        options: editingField.options || [],
        group: editingField.group || 'Informações Gerais'
      });
    } else {
      // Reinicia o formulário para um novo campo
      setField({
        name: '',
        key: '',
        type: "text",
        required: false,
        editable: true,
        options: [],
        group: 'Informações Gerais',
        description: ''
      });
    }
    
    // Resetar o estado de adição de novo grupo
    setIsAddingNewGroup(false);
    setNewGroup('');
  }, [editingField, isEditing, isOpen]);

  // Gera um identificador a partir do nome
  const generateKey = () => {
    if (!field.name) return;
    
    const key = field.name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    setField(prev => ({ ...prev, key }));
  };

  // Adiciona uma nova opção ao select
  const addOption = () => {
    if (!newOption.trim()) return;
    
    if (field.options?.includes(newOption.trim())) {
      toast.error('Esta opção já existe na lista');
      return;
    }
    
    setField(prev => ({
      ...prev,
      options: [...(prev.options || []), newOption.trim()]
    }));
    
    setNewOption('');
  };

  // Remove uma opção do select
  const removeOption = (index: number) => {
    setField(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index)
    }));
  };

  // Adiciona um novo grupo
  const handleAddGroup = () => {
    if (!newGroup.trim()) return;
    
    if (existingGroups.includes(newGroup.trim())) {
      toast.error('Este grupo já existe');
      return;
    }
    
    // Usar a função onAddNewGroup para registrar o novo grupo globalmente
    if (onAddNewGroup) {
      const success = onAddNewGroup(newGroup.trim());
      if (!success) {
        toast.error('Não foi possível adicionar o grupo');
        return;
      }
    }
    
    setField(prev => ({
      ...prev,
      group: newGroup.trim()
    }));
    
    toast.success(`Grupo "${newGroup.trim()}" adicionado com sucesso`);
    setIsAddingNewGroup(false);
    setNewGroup('');
  };

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!field.name.trim()) {
      newErrors.name = 'O nome é obrigatório';
    }
    
    if (!field.key.trim()) {
      newErrors.key = 'O identificador é obrigatório';
    } else if (!/^[a-z][a-z0-9_]*$/.test(field.key)) {
      newErrors.key = 'O identificador deve começar com uma letra e conter apenas letras minúsculas, números e sublinhados';
    }
    
    if (field.type === 'select' && (!field.options || field.options.length === 0)) {
      newErrors.options = 'Adicione pelo menos uma opção para o campo de seleção';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manipula o envio do formulário
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      await onSave(field);
      onClose();
      toast.success(isEditing ? 'Campo atualizado com sucesso!' : 'Campo criado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro ao salvar o campo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#1A1D24] text-white border-gray-800">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Campo do Sistema' : 'Novo Campo do Sistema'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Nome do campo */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-left">
              Nome
            </Label>
            <div className="col-span-3">
              <Input
                id="name"
                value={field.name}
                onChange={(e) => setField({ ...field, name: e.target.value })}
                onBlur={() => !field.key && generateKey()}
                className="bg-[#0F1115] border-gray-800"
                placeholder="Ex: Status do Contato"
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>
          </div>
          
          {/* Identificador */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="key" className="text-left">
              Identificador
            </Label>
            <div className="col-span-3">
              <Input
                id="key"
                value={field.key}
                onChange={(e) => setField({ ...field, key: e.target.value })}
                className="bg-[#0F1115] border-gray-800"
                placeholder="Ex: status_contato"
                disabled={isEditing && !field.editable}
              />
              {errors.key && <p className="text-sm text-red-500 mt-1">{errors.key}</p>}
              <p className="text-xs text-gray-400 mt-1">
                Identificador único usado no sistema. Não pode ser alterado depois de criado.
              </p>
            </div>
          </div>
          
          {/* Grupo do campo */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="group" className="text-left">
              Grupo
            </Label>
            <div className="col-span-3">
              {isAddingNewGroup ? (
                <div className="flex gap-2">
                  <Input
                    id="newGroup"
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    className="bg-[#0F1115] border-gray-800 flex-1"
                    placeholder="Nome do novo grupo"
                    onBlur={() => {
                      if (newGroup.trim()) {
                        handleAddGroup();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newGroup.trim()) {
                        e.preventDefault();
                        handleAddGroup();
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleAddGroup}
                    className="bg-blue-600 hover:bg-blue-500 text-white"
                    disabled={!newGroup.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      setIsAddingNewGroup(false);
                      setNewGroup('');
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={field.group}
                    onValueChange={(value) => setField({ ...field, group: value })}
                  >
                    <SelectTrigger className="bg-[#0F1115] border-gray-800 flex-1">
                      <SelectValue placeholder="Selecione o grupo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1D24] border-gray-800">
                      {existingGroups.map((group) => (
                        <SelectItem 
                          key={group} 
                          value={group}
                          className="text-white focus:bg-blue-600 focus:text-white"
                        >
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setIsAddingNewGroup(true)}
                    className="bg-[#0F1115] border-gray-800 text-gray-400 hover:text-white"
                    title="Criar novo grupo"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Grupo onde o campo será exibido.
              </p>
            </div>
          </div>
          
          {/* Tipo de campo */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-left">
              Tipo
            </Label>
            <div className="col-span-3">
              <Select
                value={field.type}
                onValueChange={(value) => setField({ ...field, type: value })}
                disabled={isEditing && !field.editable}
              >
                <SelectTrigger className="bg-[#0F1115] border-gray-800">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1D24] border-gray-800">
                  {fieldTypeOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="text-white focus:bg-blue-600 focus:text-white"
                    >
                      <div className="flex items-center">
                        <option.icon className="mr-2 h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Opções para campo de seleção */}
          {field.type === 'select' && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-left mt-2">
                Opções
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    className="bg-[#0F1115] border-gray-800"
                    placeholder="Nova opção"
                  />
                  <Button 
                    type="button" 
                    onClick={addOption}
                    variant="outline"
                    size="icon"
                    className="border-gray-800 hover:bg-blue-600 hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {errors.options && <p className="text-sm text-red-500">{errors.options}</p>}
                
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {field.options && field.options.length > 0 ? (
                    field.options.map((option, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-[#0F1115] border border-gray-800">
                        <span>{option}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                          className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">Nenhuma opção adicionada</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Obrigatório */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="required" className="text-left">
              Obrigatório
            </Label>
            <div className="flex items-center gap-2 col-span-3">
              <Checkbox
                id="required"
                checked={field.required}
                onCheckedChange={(checked) => setField({ ...field, required: checked as boolean })}
                className="border-gray-600"
                disabled={isEditing && !field.editable}
              />
              <span className="text-sm text-gray-400">
                Campo obrigatório para todos os contatos
              </span>
            </div>
          </div>
          
          {/* Descrição */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-left mt-2">
              Descrição
            </Label>
            <div className="col-span-3">
              <Textarea
                id="description"
                value={field.description || ''}
                onChange={(e) => setField({ ...field, description: e.target.value })}
                className="bg-[#0F1115] border-gray-800 min-h-[80px]"
                placeholder="Descreva o propósito deste campo"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="border-gray-800 text-gray-400 hover:text-white hover:bg-[#2A2D34]"
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-blue-600 text-white hover:bg-blue-500"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Salvando...
              </span>
            ) : (
              isEditing ? 'Atualizar' : 'Criar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
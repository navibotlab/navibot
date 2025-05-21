'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { Loader2, Plus, RefreshCw, Search, Database, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Tipo para os campos de contato
type ContactField = {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[];
  placeholder?: string;
  default_value?: string;
  description?: string;
  order: number;
  created_at: string;
};

// Componente para o diálogo de exclusão
function DeleteFieldDialog({ 
  field, 
  onDelete, 
  open, 
  onOpenChange 
}: { 
  field: ContactField | null; 
  onDelete: () => Promise<void>; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'Excluir') {
      setError('Digite "Excluir" para confirmar');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await onDelete();
      onOpenChange(false);
      toast.success('Campo excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir campo:', error);
      setError('Erro ao excluir campo. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1D24] text-white border-gray-800">
        <DialogHeader>
          <DialogTitle>Excluir Campo</DialogTitle>
          <DialogDescription className="text-gray-400">
            Esta ação não pode ser desfeita. O campo será permanentemente excluído.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="mb-4 text-gray-300">
            Você está prestes a excluir o campo <span className="font-semibold text-white">{field?.name}</span>.
          </p>
          
          <div className="mb-4">
            <Label htmlFor="confirm-delete" className="text-gray-300">
              Digite <span className="font-semibold">Excluir</span> para confirmar:
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-2 bg-[#0F1115] border-gray-800 text-white"
              placeholder="Excluir"
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Excluir Campo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CamposContatoPage() {
  const [campos, setCampos] = useState<ContactField[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para o formulário de campo
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentField, setCurrentField] = useState<ContactField | null>(null);
  
  // Estados para o formulário
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea'>('text');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldDefaultValue, setFieldDefaultValue] = useState('');
  const [fieldDescription, setFieldDescription] = useState('');
  const [fieldOptions, setFieldOptions] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para o diálogo de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<ContactField | null>(null);

  // Função para carregar os campos de contato
  const fetchCampos = async () => {
    setRefreshing(true);
    
    try {
      const response = await fetch('/api/contact-fields');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar campos de contato');
      }
      
      const data = await response.json();
      setCampos(data || []);
      
    } catch (error) {
      console.error('Erro ao carregar campos de contato:', error);
      toast.error('Erro ao carregar campos de contato');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCampos();
  }, []);

  // Filtrar campos pelo termo de busca
  const filteredCampos = campos.filter(campo => 
    campo.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para abrir o diálogo de edição
  const handleEditField = (field: ContactField) => {
    setCurrentField(field);
    setFieldName(field.name);
    setFieldType(field.type);
    setFieldRequired(field.required);
    setFieldPlaceholder(field.placeholder || '');
    setFieldDefaultValue(field.default_value || '');
    setFieldDescription(field.description || '');
    setFieldOptions(field.options?.join(', ') || '');
    setIsEditing(true);
    setOpenDialog(true);
    setFormErrors({});
  };

  // Função para abrir o diálogo de criação
  const handleAddField = () => {
    setCurrentField(null);
    setFieldName('');
    setFieldType('text');
    setFieldRequired(false);
    setFieldPlaceholder('');
    setFieldDefaultValue('');
    setFieldDescription('');
    setFieldOptions('');
    setIsEditing(false);
    setOpenDialog(true);
    setFormErrors({});
  };

  // Função para abrir o diálogo de exclusão
  const handleDeleteClick = (field: ContactField) => {
    setFieldToDelete(field);
    setDeleteDialogOpen(true);
  };

  // Função para excluir um campo
  const handleDeleteField = async () => {
    if (!fieldToDelete) return;
    
    try {
      const response = await fetch(`/api/contact-fields?id=${fieldToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir campo');
      }
      
      // Atualizar a lista de campos
      setCampos(campos.filter(campo => campo.id !== fieldToDelete.id));
      
    } catch (error) {
      console.error('Erro ao excluir campo:', error);
      throw error;
    }
  };

  // Função para validar o formulário
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!fieldName.trim()) {
      errors.name = 'Nome é obrigatório';
    }
    
    if (fieldType === 'select' && !fieldOptions.trim()) {
      errors.options = 'Opções são obrigatórias para o tipo Select';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para salvar um campo (criar ou atualizar)
  const handleSaveField = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const formData = {
        id: currentField?.id,
        name: fieldName,
        type: fieldType,
        required: fieldRequired,
        placeholder: fieldPlaceholder,
        default_value: fieldDefaultValue,
        description: fieldDescription,
        options: fieldType === 'select' ? fieldOptions.split(',').map(option => option.trim()) : undefined
      };
      
      const url = isEditing ? `/api/contact-fields?id=${currentField?.id}` : '/api/contact-fields';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} campo`);
      }
      
      const data = await response.json();
      
      // Atualizar a lista de campos
      if (isEditing) {
        setCampos(campos.map(campo => campo.id === data.id ? data : campo));
        toast.success('Campo atualizado com sucesso');
      } else {
        setCampos([...campos, data]);
        toast.success('Campo criado com sucesso');
      }
      
      // Fechar o diálogo
      setOpenDialog(false);
      
    } catch (error) {
      console.error('Erro ao salvar campo:', error);
      toast.error('Erro ao salvar campo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para renderizar o ícone do tipo de campo
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-400 rounded">Texto</span>;
      case 'number':
        return <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded">Número</span>;
      case 'date':
        return <span className="text-xs px-2 py-1 bg-purple-900/30 text-purple-400 rounded">Data</span>;
      case 'select':
        return <span className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded">Seleção</span>;
      case 'checkbox':
        return <span className="text-xs px-2 py-1 bg-red-900/30 text-red-400 rounded">Checkbox</span>;
      case 'textarea':
        return <span className="text-xs px-2 py-1 bg-indigo-900/30 text-indigo-400 rounded">Área de Texto</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Campos Personalizados</h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchCampos}
            disabled={refreshing}
            title="Atualizar"
            className="bg-[#1A1D24] border-gray-800 text-gray-400 hover:text-white hover:bg-[#2A2D34]"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          
          <Button 
            onClick={handleAddField}
            className="bg-blue-600 text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Campo
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar campos..."
            className="pl-10 bg-[#1A1D24] border-gray-800 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : campos.length === 0 ? (
        <div className="bg-[#1A1D24] border border-gray-800 rounded-lg p-8 text-center">
          <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium text-white mb-2">Nenhum campo encontrado</h3>
          <p className="text-gray-400 mb-4">
            Você ainda não criou nenhum campo de contato. Clique no botão acima para adicionar seu primeiro campo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCampos.map((campo) => (
            <div 
              key={campo.id} 
              className="bg-[#1A1D24] border border-gray-800 rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-white">{campo.name}</h3>
                  {campo.required && (
                    <span className="text-xs px-2 py-0.5 bg-red-900/30 text-red-400 rounded">Obrigatório</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {renderTypeIcon(campo.type)}
                  {campo.description && <span className="ml-2">{campo.description}</span>}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleEditField(campo)}
                  title="Editar"
                  className="hover:bg-[#2A2D34]"
                >
                  <Edit className="h-4 w-4 text-gray-400 hover:text-white" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDeleteClick(campo)}
                  title="Excluir"
                  className="hover:bg-red-950/50"
                >
                  <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Diálogo para adicionar/editar campo */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-[#1A1D24] border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Campo' : 'Adicionar Campo'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Preencha os detalhes do campo de contato abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="field-name">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="field-name"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                className="bg-[#0F1115] border-gray-800 text-white"
                placeholder="Nome do campo"
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="field-type">
                Tipo <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={fieldType} 
                onValueChange={(value: any) => setFieldType(value)}
              >
                <SelectTrigger id="field-type" className="bg-[#0F1115] border-gray-800 text-white">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1D24] border-gray-800 text-white">
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="select">Seleção</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="textarea">Área de Texto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox 
                id="field-required" 
                checked={fieldRequired}
                onCheckedChange={(checked) => setFieldRequired(checked as boolean)}
              />
              <Label htmlFor="field-required" className="cursor-pointer">
                Campo obrigatório
              </Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="field-placeholder">Placeholder</Label>
              <Input
                id="field-placeholder"
                value={fieldPlaceholder}
                onChange={(e) => setFieldPlaceholder(e.target.value)}
                className="bg-[#0F1115] border-gray-800 text-white"
                placeholder="Texto de exemplo"
              />
            </div>
            
            {fieldType === 'select' && (
              <div className="space-y-2">
                <Label htmlFor="field-options">
                  Opções (separadas por vírgula)
                </Label>
                <Input
                  id="field-options"
                  value={fieldOptions}
                  onChange={(e) => setFieldOptions(e.target.value)}
                  className="bg-[#0F1115] border-gray-800 text-white"
                  placeholder="Ex: Opção 1, Opção 2, Opção 3"
                />
                {formErrors.options && (
                  <p className="text-sm text-red-500">{formErrors.options}</p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="field-default">Valor Padrão</Label>
              <Input
                id="field-default"
                value={fieldDefaultValue}
                onChange={(e) => setFieldDefaultValue(e.target.value)}
                className="bg-[#0F1115] border-gray-800 text-white"
                placeholder="Valor padrão (opcional)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="field-description">Descrição</Label>
              <Textarea
                id="field-description"
                value={fieldDescription}
                onChange={(e) => setFieldDescription(e.target.value)}
                className="bg-[#0F1115] border-gray-800 text-white"
                placeholder="Descrição do campo (opcional)"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpenDialog(false)}
              className="bg-transparent hover:bg-gray-800"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveField}
              className="bg-blue-600 text-white hover:bg-blue-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {isEditing ? 'Salvar Alterações' : 'Adicionar Campo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmação de exclusão */}
      <DeleteFieldDialog 
        field={fieldToDelete} 
        onDelete={handleDeleteField}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
} 
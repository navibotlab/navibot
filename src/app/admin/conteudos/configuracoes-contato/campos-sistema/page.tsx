'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, RotateCw, Database } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AddSystemFieldModal from './components/AddSystemFieldModal';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';
import SystemFieldsList from './components/SystemFieldsList';
import { 
  SystemField, 
  SystemFieldInput,
  getAllSystemFields, 
  createSystemField, 
  updateSystemField, 
  deleteSystemField,
  searchSystemFields,
  initializeDefaultSystemFields
} from './services/systemFieldService';

export default function CamposDoSistemaPage() {
  // Estados para gerenciar os campos
  const [fields, setFields] = useState<SystemField[]>([]);
  const [filteredFields, setFilteredFields] = useState<SystemField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estado para gerenciar todos os grupos disponíveis
  const [availableGroups, setAvailableGroups] = useState<string[]>(['Informações Gerais']);
  
  // Estados para o modal de adicionar/editar campo
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<SystemFieldInput | null>(null);
  
  // Estados para o diálogo de confirmação de exclusão
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingField, setDeletingField] = useState<SystemField | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Carrega os campos na inicialização
  useEffect(() => {
    loadFields();
  }, []);
  
  // Filtra os campos quando o termo de busca muda
  useEffect(() => {
    setFilteredFields(searchSystemFields(fields, searchTerm));
  }, [fields, searchTerm]);

  // Extrai a lista de grupos únicos dos campos
  useEffect(() => {
    const groupsSet = new Set<string>();
    
    // Garantir que "Informações Gerais" sempre esteja na lista
    groupsSet.add('Informações Gerais');
    
    // Adicionar todos os grupos únicos dos campos
    fields.forEach(field => {
      if (field.group) {
        groupsSet.add(field.group);
      }
    });
    
    setAvailableGroups(Array.from(groupsSet));
  }, [fields]);

  // Adiciona um novo grupo à lista de grupos disponíveis
  const handleAddNewGroup = (newGroup: string) => {
    if (!availableGroups.includes(newGroup)) {
      setAvailableGroups(prev => [...prev, newGroup]);
      return true;
    }
    return false;
  };

  // Carrega os campos do sistema da API
  const loadFields = async () => {
    setIsLoading(true);
    try {
      // Garante que os campos padrão existam
      try {
        await initializeDefaultSystemFields();
        console.log("Inicialização de campos padrão concluída");
      } catch (initError) {
        console.error("Erro na inicialização de campos padrão:", initError);
        // Continuar com o carregamento mesmo com erro na inicialização
      }
      
      // Carrega todos os campos
      try {
        const data = await getAllSystemFields();
        setFields(data);
        
        // Inicializa os grupos disponíveis
        const groups = new Set<string>(['Informações Gerais']);
        data.forEach(field => {
          if (field.group) {
            groups.add(field.group);
          }
        });
        setAvailableGroups(Array.from(groups));
      } catch (loadError) {
        console.error("Erro ao carregar campos do sistema:", loadError);
        toast.error("Não foi possível carregar os campos do sistema");
        // Mostrar pelo menos alguns campos vazios para a interface não quebrar
        setFields([]);
        setAvailableGroups(['Informações Gerais']);
      }
      
    } catch (error: any) {
      console.error("Erro geral na função loadFields:", error);
      toast.error(error.message || 'Erro ao carregar campos do sistema');
      // Inicializar estados com valores padrão para não quebrar a interface
      setFields([]);
      setAvailableGroups(['Informações Gerais']);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualiza a lista de campos
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFields();
    setIsRefreshing(false);
  };

  // Abre o modal para criar um novo campo
  const handleAddField = () => {
    setEditingField(null);
    setIsAddModalOpen(true);
  };

  // Abre o modal para editar um campo existente
  const handleEditField = (field: SystemField) => {
    setEditingField({
      name: field.name,
      key: field.key,
      type: field.type,
      required: field.required,
      editable: field.editable,
      options: field.options,
      group: field.group,
      description: field.description
    });
    setIsAddModalOpen(true);
  };

  // Abre o diálogo de confirmação para excluir um campo
  const handleDeleteClick = (field: SystemField) => {
    setDeletingField(field);
    setIsDeleteDialogOpen(true);
  };

  // Salva um novo campo ou atualiza um existente
  const handleSaveField = async (fieldData: SystemFieldInput) => {
    try {
      // Certificar-se de que o grupo está definido
      const dataWithGroup = {
        ...fieldData,
        group: fieldData.group || 'Informações Gerais'
      };
      
      if (editingField) {
        // Encontrar o id do campo sendo editado
        const fieldToUpdate = fields.find(f => f.key === editingField.key);
        if (!fieldToUpdate?.id) {
          throw new Error('Campo não encontrado para atualização');
        }
        
        // Atualiza um campo existente
        const updatedField = await updateSystemField(fieldToUpdate.id, dataWithGroup);
        setFields(prev => prev.map(f => f.id === updatedField.id ? updatedField : f));
      } else {
        // Cria um novo campo
        const newField = await createSystemField(dataWithGroup);
        setFields(prev => [...prev, newField]);
      }
      
      setIsAddModalOpen(false);
      setEditingField(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar o campo');
      throw error;
    }
  };

  // Confirma a exclusão de um campo
  const handleConfirmDelete = async () => {
    if (!deletingField) return;
    
    setIsDeleting(true);
    
    try {
      await deleteSystemField(deletingField.id);
      setFields(prev => prev.filter(f => f.id !== deletingField.id));
      setIsDeleteDialogOpen(false);
      setDeletingField(null);
      toast.success('Campo excluído com sucesso');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir o campo');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Campos do Sistema</h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Atualizar"
            className="bg-[#1A1D24] border-gray-800 text-gray-400 hover:text-white hover:bg-[#2A2D34]"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button 
            className="bg-blue-600 text-white hover:bg-blue-500"
            onClick={handleAddField}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Campo
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#1A1D24] border-gray-800 text-white placeholder:text-gray-400"
          />
        </div>
      </div>
      
      <div className="rounded-lg border border-gray-800 bg-[#1A1D24] overflow-hidden">
        {/* Cabeçalho da tabela */}
        <div className="grid grid-cols-5 gap-4 border-b border-gray-800 p-4 text-sm text-gray-400 bg-[#0F1115]">
          <div>Nome</div>
          <div>Tipo</div>
          <div>Descrição</div>
          <div>Uso</div>
          <div className="text-right">Ações</div>
        </div>

        {/* Conteúdo da tabela */}
        <SystemFieldsList
          fields={filteredFields}
          isLoading={isLoading}
          onEdit={handleEditField}
          onDelete={handleDeleteClick}
        />
      </div>
      
      {/* Modal para adicionar/editar campo */}
      <AddSystemFieldModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveField}
        editingField={editingField || undefined}
        isEditing={!!editingField}
        existingGroups={availableGroups}
        onAddNewGroup={handleAddNewGroup}
      />
      
      {/* Diálogo de confirmação para exclusão */}
      <DeleteConfirmDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        field={deletingField}
        isDeleting={isDeleting}
      />
    </div>
  );
} 
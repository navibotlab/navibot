'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

import { AddLabelModal } from './components/AddLabelModal';
import { LabelsList, Label } from './components/LabelsList';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import { 
  getAllLabels, 
  createLabel, 
  updateLabel, 
  deleteLabel, 
  searchLabels 
} from './services/labelService';

export default function EtiquetasPage() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [labelToDelete, setLabelToDelete] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  const { toast } = useToast();

  // Carregar etiquetas ao montar o componente, com limite de tentativas
  useEffect(() => {
    // Limitar a 3 tentativas automáticas
    if (loadAttempts < 3) {
      loadLabels();
    }
  }, [loadAttempts]);

  // Carregar etiquetas do serviço
  const loadLabels = async () => {
    // Evitar múltiplas chamadas simultâneas
    if (loading && loadAttempts > 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getAllLabels();
      setLabels(data);
      // Se carregou com sucesso, reseta contador de tentativas
      setLoadAttempts(0);
    } catch (error) {
      console.error('Erro ao carregar etiquetas:', error);
      // Aumenta contador de tentativas
      setLoadAttempts(prev => prev + 1);
      setError('Não foi possível carregar as etiquetas. Clique em atualizar para tentar novamente.');
      
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as etiquetas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualizar etiquetas
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLabels();
    setRefreshing(false);
  };

  // Pesquisar etiquetas
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await searchLabels(searchTerm);
      setLabels(results);
    } catch (error) {
      console.error('Erro ao pesquisar etiquetas:', error);
      setError('Não foi possível realizar a pesquisa. Tente novamente.');
      toast({
        title: 'Erro',
        description: 'Falha ao pesquisar etiquetas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para criar etiqueta
  const handleAddLabel = () => {
    setEditingLabel(null);
    setIsLabelModalOpen(true);
  };

  // Abrir modal para editar etiqueta
  const handleEditLabel = (label: Label) => {
    setEditingLabel(label);
    setIsLabelModalOpen(true);
  };

  // Salvar etiqueta (criar ou atualizar)
  const handleSaveLabel = async (data: { name: string; color: string }) => {
    try {
      if (editingLabel) {
        // Atualizar etiqueta existente
        console.log("Atualizando etiqueta:", editingLabel.id, data);
        const updated = await updateLabel(editingLabel.id, data);
        if (updated) {
          setLabels(prev => prev.map(label => 
            label.id === editingLabel.id ? updated : label
          ));
          toast({
            title: 'Sucesso',
            description: 'Etiqueta atualizada com sucesso',
          });
        }
      } else {
        // Criar nova etiqueta
        console.log("Criando nova etiqueta:", data);
        const newLabel = await createLabel(data);
        setLabels(prev => [...prev, newLabel]);
        toast({
          title: 'Sucesso',
          description: 'Etiqueta criada com sucesso',
        });
      }
      setIsLabelModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar etiqueta:', error);
      
      let errorMessage = 'Não foi possível salvar a etiqueta';
      
      if (error instanceof Error) {
        errorMessage = `Erro ao criar tag de contato: ${error.message}`;
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Confirmar exclusão de etiqueta
  const handleDeleteConfirm = async () => {
    if (!labelToDelete) return;
    
    try {
      const success = await deleteLabel(labelToDelete.id);
      if (success) {
        setLabels(prev => prev.filter(label => label.id !== labelToDelete.id));
        toast({
          title: 'Sucesso',
          description: 'Etiqueta excluída com sucesso',
        });
      }
    } catch (error) {
      console.error('Erro ao excluir etiqueta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a etiqueta',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setLabelToDelete(null);
    }
  };

  // Iniciar processo de exclusão
  const handleDeleteLabel = (id: string) => {
    const label = labels.find(l => l.id === id);
    if (label) {
      setLabelToDelete({ id, name: label.name });
      setIsDeleteDialogOpen(true);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">Etiquetas de Contato</h1>
          <Badge className="bg-yellow-600 text-white hover:bg-yellow-700">Em desenvolvimento</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing || loading}
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
            className="bg-blue-600 text-white hover:bg-blue-500"
            onClick={handleAddLabel}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar tag
          </Button>
        </div>
      </div>
      
      <Alert className="mb-6 border-yellow-600 bg-yellow-950/30 text-yellow-300">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Funcionalidade em desenvolvimento</AlertTitle>
        <AlertDescription>
          A funcionalidade de etiquetas ainda está em desenvolvimento e será implementada em breve. 
          As etiquetas permitirão categorizar contatos para melhor organização do seu CRM.
        </AlertDescription>
      </Alert>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar etiquetas..."
            className="pl-10 bg-[#1A1D24] border-gray-800 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="bg-[#2A1618] border border-red-800 rounded-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-xl font-medium text-white mb-2">Erro ao carregar etiquetas</h3>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">
            {error}
          </p>
          
          <Button 
            className="bg-red-700 text-white hover:bg-red-600"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Tentar novamente
          </Button>
        </div>
      ) : labels.length === 0 ? (
        <div className="bg-[#1A1D24] border border-gray-800 rounded-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium text-white mb-2">Nenhuma etiqueta encontrada</h3>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            {searchTerm ? 
              'Não encontramos etiquetas que correspondam à sua pesquisa. Tente outros termos ou crie uma nova etiqueta.' : 
              'Você ainda não possui etiquetas. Clique no botão "Adicionar tag" para criar sua primeira etiqueta.'}
          </p>
          
          <Button 
            className="bg-purple-600 text-white hover:bg-purple-500"
            onClick={handleAddLabel}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar tag
          </Button>
        </div>
      ) : (
        <LabelsList 
          labels={labels} 
          onEdit={handleEditLabel} 
          onDelete={handleDeleteLabel} 
        />
      )}
      
      {/* Modal para adicionar/editar etiqueta */}
      <AddLabelModal 
        open={isLabelModalOpen}
        onOpenChange={setIsLabelModalOpen}
        onSave={handleSaveLabel}
        initialData={editingLabel ? { name: editingLabel.name, color: editingLabel.color } : undefined}
        isEditing={!!editingLabel}
      />
      
      {/* Diálogo de confirmação para exclusão */}
      {labelToDelete && (
        <DeleteConfirmDialog 
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          labelName={labelToDelete.name}
        />
      )}
    </div>
  );
} 
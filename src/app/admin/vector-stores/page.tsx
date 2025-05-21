'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, Trash2, FileText, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function VectorStoresPage() {
  const [vectorStores, setVectorStores] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newVectorStore, setNewVectorStore] = useState({
    name: '',
    description: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Carregar vector stores e arquivos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar vector stores
        const vectorStoresResponse = await fetch('/api/vector-stores', {
          headers: {
            'x-workspace-id': localStorage.getItem('workspaceId') || '',
          }
        });
        if (vectorStoresResponse.ok) {
          const vectorStoresData = await vectorStoresResponse.json();
          setVectorStores(vectorStoresData.vectorStores || []);
        }

        // Buscar arquivos
        const filesResponse = await fetch('/api/files', {
          headers: {
            'x-workspace-id': localStorage.getItem('workspaceId') || '',
          }
        });
        if (filesResponse.ok) {
          const filesData = await filesResponse.json();
          setFiles(filesData.files || []);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchVectorStores = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/vector-stores', {
        headers: {
          'x-workspace-id': localStorage.getItem('workspaceId') || '',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setVectorStores(data.vectorStores || []);
        toast.success('Vector stores atualizados');
      }
    } catch (error) {
      console.error('Erro ao atualizar vector stores:', error);
      toast.error('Erro ao atualizar vector stores');
    } finally {
      setRefreshing(false);
    }
  };

  // Criar novo vector store
  const handleCreateVectorStore = async () => {
    if (!newVectorStore.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/vector-stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': localStorage.getItem('workspaceId') || '',
        },
        body: JSON.stringify({
          ...newVectorStore,
          fileIds: selectedFiles
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setVectorStores([...vectorStores, data.vectorStore]);
        toast.success('Vector Store criado com sucesso');
        setNewVectorStore({ name: '', description: '' });
        setSelectedFiles([]);
        setOpenDialog(false);
      } else {
        const error = await response.json();
        toast.error(`Erro ao criar Vector Store: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao criar Vector Store:', error);
      toast.error('Erro ao criar Vector Store');
    } finally {
      setCreating(false);
    }
  };

  // Adicionar arquivo a um vector store
  const handleAddFileToVectorStore = async (vectorStoreId: string, fileId: string) => {
    try {
      const response = await fetch(`/api/vector-stores/${vectorStoreId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': localStorage.getItem('workspaceId') || '',
        },
        body: JSON.stringify({ fileId }),
      });

      if (response.ok) {
        // Atualizar a lista de vector stores
        const updatedVectorStores = vectorStores.map(vs => {
          if (vs.id === vectorStoreId) {
            return {
              ...vs,
              files: [...(vs.files || []), { id: fileId }]
            };
          }
          return vs;
        });
        setVectorStores(updatedVectorStores);
        toast.success('Arquivo adicionado com sucesso');
      } else {
        const error = await response.json();
        toast.error(`Erro ao adicionar arquivo: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao adicionar arquivo:', error);
      toast.error('Erro ao adicionar arquivo');
    }
  };

  // Remover vector store
  const handleDeleteVectorStore = async (vectorStoreId: string) => {
    if (!confirm('Tem certeza que deseja excluir este Vector Store? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`/api/vector-stores/${vectorStoreId}`, {
        method: 'DELETE',
        headers: {
          'x-workspace-id': localStorage.getItem('workspaceId') || '',
        }
      });

      if (response.ok) {
        setVectorStores(vectorStores.filter(vs => vs.id !== vectorStoreId));
        toast.success('Vector Store excluído com sucesso');
      } else {
        const error = await response.json();
        toast.error(`Erro ao excluir Vector Store: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao excluir Vector Store:', error);
      toast.error('Erro ao excluir Vector Store');
    }
  };

  // Remover arquivo de um vector store
  const handleRemoveFileFromVectorStore = async (vectorStoreId: string, fileId: string) => {
    try {
      const response = await fetch(`/api/vector-stores/${vectorStoreId}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'x-workspace-id': localStorage.getItem('workspaceId') || '',
        }
      });

      if (response.ok) {
        // Atualizar a lista de vector stores
        const updatedVectorStores = vectorStores.map(vs => {
          if (vs.id === vectorStoreId) {
            return {
              ...vs,
              files: (vs.files || []).filter((file: any) => file.id !== fileId)
            };
          }
          return vs;
        });
        setVectorStores(updatedVectorStores);
        toast.success('Arquivo removido com sucesso');
      } else {
        const error = await response.json();
        toast.error(`Erro ao remover arquivo: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      toast.error('Erro ao remover arquivo');
    }
  };

  // Manipular seleção de arquivos
  const handleFileSelection = (fileId: string) => {
    if (selectedFiles.includes(fileId)) {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
    } else {
      setSelectedFiles([...selectedFiles, fileId]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Vector Stores</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchVectorStores}
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
            onClick={() => setOpenDialog(true)}
            className="bg-blue-600 text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Vector Store
          </Button>
        </div>
      </div>

      {vectorStores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">Nenhum Vector Store encontrado</p>
            <Button 
              onClick={() => setOpenDialog(true)}
              className="bg-blue-600 text-white hover:bg-blue-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Vector Store
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vectorStores.map((vectorStore) => (
            <Card key={vectorStore.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{vectorStore.name}</CardTitle>
                    <CardDescription>{vectorStore.description || 'Sem descrição'}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteVectorStore(vectorStore.id)}
                    title="Excluir"
                    className="hover:bg-red-950/50"
                  >
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-400" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Arquivos</h4>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    {vectorStore.files && vectorStore.files.length > 0 ? (
                      vectorStore.files.map((file: any) => (
                        <div key={file.id} className="flex justify-between items-center py-1">
                          <span className="text-sm flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            {file.filename || file.name || file.id}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFileFromVectorStore(vectorStore.id, file.id)}
                            className="hover:bg-red-950/50"
                          >
                            <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-400" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum arquivo adicionado</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Select onValueChange={(fileId) => handleAddFileToVectorStore(vectorStore.id, fileId)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Adicionar arquivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {files
                      .filter(file => !vectorStore.files?.some((vf: any) => vf.id === file.id))
                      .map(file => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.filename || file.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Vector Store</DialogTitle>
            <DialogDescription>
              Crie um novo armazenamento de vetores para seus arquivos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={newVectorStore.name}
                onChange={(e) => setNewVectorStore({ ...newVectorStore, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={newVectorStore.description}
                onChange={(e) => setNewVectorStore({ ...newVectorStore, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Arquivos
              </Label>
              <div className="col-span-3 border rounded-md p-2 max-h-40 overflow-y-auto">
                {files.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum arquivo disponível</p>
                ) : (
                  files.map((file) => (
                    <div key={file.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        id={`file-${file.id}`}
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => handleFileSelection(file.id)}
                      />
                      <label htmlFor={`file-${file.id}`} className="text-sm flex-1 cursor-pointer">
                        {file.filename || file.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpenDialog(false)} 
              disabled={creating} 
              className="border-gray-700 hover:bg-[#2A2D34] hover:text-white"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateVectorStore} 
              disabled={creating}
              className="bg-blue-600 text-white hover:bg-blue-500"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar Vector Store
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { Loader2, Plus, Database, RefreshCw, Search, Upload, FileText, Link2, AlertTriangle, FilePlus, Trash2, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeleteVectorStoreDialog } from '@/components/DeleteVectorStoreDialog';
import { DeleteVectorStoreFileDialog } from '@/components/DeleteVectorStoreFileDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Tutorial from './components/Tutorial';

const ArmazenamentoVetoresContent = () => {
  const [vectorStores, setVectorStores] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [addingFiles, setAddingFiles] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openAddFilesDialog, setOpenAddFilesDialog] = useState(false);
  const [openViewFilesDialog, setOpenViewFilesDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [vectorStoreName, setVectorStoreName] = useState('');
  const [currentVectorStore, setCurrentVectorStore] = useState<any>(null);
  const [storeFiles, setStoreFiles] = useState<any[]>([]);
  const [loadingStoreFiles, setLoadingStoreFiles] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [apiSuggestion, setApiSuggestion] = useState<string | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Carregar armazenamentos de vetores
  const fetchVectorStores = async () => {
    setRefreshing(true);
    setApiError(null);
    setApiMessage(null);
    setApiSuggestion(null);
    
    try {
      const response = await fetch('/api/vector-stores');
      const data = await response.json();
      
      if (response.ok) {
        setVectorStores(data.vectorStores || []);
        
        // Verificar se há uma mensagem da API
        if (data.message) {
          setApiMessage(data.message);
        }
      } else {
        const error = data.error || 'Erro desconhecido';
        toast.error(`Erro ao carregar armazenamentos: ${error}`);
        setApiError(error);
        
        // Verificar se há mensagens adicionais
        if (data.message) {
          setApiMessage(data.message);
        }
        
        if (data.suggestion) {
          setApiSuggestion(data.suggestion);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar armazenamentos de vetores:', error);
      toast.error('Erro ao carregar armazenamentos de vetores');
      setApiError('Erro ao carregar armazenamentos de vetores');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar arquivos disponíveis
  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files');
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      } else {
        toast.error('Erro ao carregar arquivos');
      }
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      toast.error('Erro ao carregar arquivos');
    }
  };

  useEffect(() => {
    fetchVectorStores();
    fetchFiles();
  }, []);

  // Filtrar armazenamentos pelo termo de busca
  const filteredVectorStores = vectorStores.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Criar novo armazenamento de vetores
  const handleCreateVectorStore = async () => {
    if (!vectorStoreName.trim()) {
      toast.error('Por favor, informe um nome para o armazenamento de vetores');
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error('Por favor, selecione pelo menos um arquivo');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/vector-stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: vectorStoreName,
          fileIds: selectedFiles
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Armazenamento de vetores criado com sucesso');
        
        // Adicionar o novo armazenamento diretamente à lista em vez de fazer uma nova requisição
        if (data.vectorStore) {
          // Garantir que a contagem de arquivos esteja correta
          const newVectorStore = {
            ...data.vectorStore,
            file_count: selectedFiles.length,
            files: data.vectorStore.files || []
          };
          
          setVectorStores(prevStores => [newVectorStore, ...prevStores]);
        } else {
          // Se por algum motivo não receber o armazenamento criado, buscar todos novamente
          fetchVectorStores();
        }
        
        setOpenDialog(false);
        setVectorStoreName('');
        setSelectedFiles([]);
      } else {
        const errorMessage = data.error || 'Erro desconhecido';
        toast.error(`Erro ao criar armazenamento: ${errorMessage}`);
        
        // Verificar se há mensagens adicionais
        if (data.message) {
          setApiMessage(data.message);
        }
        
        if (data.suggestion) {
          setApiSuggestion(data.suggestion);
        }
      }
    } catch (error) {
      console.error('Erro ao criar armazenamento de vetores:', error);
      toast.error('Erro ao criar armazenamento de vetores');
    } finally {
      setCreating(false);
    }
  };

  // Abrir diálogo para adicionar arquivos a um armazenamento existente
  const openAddFilesDialogForStore = async (store: any) => {
    setCurrentVectorStore(store);
    setSelectedFiles([]);
    
    try {
      // Buscar os arquivos atuais do armazenamento
      const response = await fetch(`/api/vector-stores/${store.id}/files`);
      if (response.ok) {
        const data = await response.json();
        const currentFileIds = data.files.map((file: any) => file.id);
        
        // Filtrar os arquivos que já estão no armazenamento
        const availableFiles = files.filter(file => !currentFileIds.includes(file.id));
        
        // Se não houver arquivos disponíveis, mostrar mensagem
        if (availableFiles.length === 0) {
          toast.error('Todos os arquivos já foram adicionados a este armazenamento');
        }
        
        // Atualizar a lista de arquivos disponíveis
        setFiles(prevFiles => {
          // Marcar os arquivos que já estão no armazenamento
          return prevFiles.map(file => ({
            ...file,
            alreadyAdded: currentFileIds.includes(file.id)
          }));
        });
      }
    } catch (error) {
      console.error('Erro ao buscar arquivos do armazenamento:', error);
    }
    
    setOpenAddFilesDialog(true);
  };

  // Adicionar arquivos a um armazenamento existente
  const handleAddFilesToStore = async () => {
    if (!currentVectorStore || selectedFiles.length === 0) {
      toast.error('Por favor, selecione pelo menos um arquivo');
      return;
    }

    setAddingFiles(true);
    try {
      // Adicionar arquivos um por um
      let addedCount = 0;
      for (const fileId of selectedFiles) {
        try {
          const response = await fetch(`/api/vector-stores/${currentVectorStore.id}/files`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ file_id: fileId }),
          });

          if (response.ok) {
            addedCount++;
          } else {
            const data = await response.json();
            console.error(`Erro ao adicionar arquivo ${fileId}:`, data.error);
          }
        } catch (fileError) {
          console.error(`Erro ao adicionar arquivo ${fileId}:`, fileError);
        }
      }

      if (addedCount > 0) {
        toast.success(`${addedCount} arquivo(s) adicionado(s) com sucesso`);
        
        // Atualizar o armazenamento na lista temporariamente
        setVectorStores(prevStores => 
          prevStores.map(store => {
            if (store.id === currentVectorStore.id) {
              return {
                ...store,
                file_count: (parseInt(store.file_count) || 0) + addedCount
              };
            }
            return store;
          })
        );
        
        // Atualizar a lista completa de armazenamentos para garantir dados atualizados
        fetchVectorStores();
        
        setOpenAddFilesDialog(false);
        setSelectedFiles([]);
      } else {
        toast.error('Nenhum arquivo foi adicionado');
      }
    } catch (error) {
      console.error('Erro ao adicionar arquivos:', error);
      toast.error('Erro ao adicionar arquivos ao armazenamento');
    } finally {
      setAddingFiles(false);
    }
  };

  // Formatar a data
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  // Alternar seleção de arquivo
  const toggleFileSelection = (fileId: string) => {
    if (selectedFiles.includes(fileId)) {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
    } else {
      setSelectedFiles([...selectedFiles, fileId]);
    }
  };

  // Remover armazenamento da lista após exclusão
  const handleVectorStoreDeleted = (storeId: string) => {
    setVectorStores(vectorStores.filter(store => store.id !== storeId));
  };

  // Obter a quantidade de arquivos de um armazenamento
  const getFileCount = (store: any) => {
    // Verificar se temos a propriedade files com dados
    if (store.files && Array.isArray(store.files)) {
      return store.files.length;
    }
    
    // Verificar se temos a propriedade file_count
    if (typeof store.file_count === 'number') {
      return store.file_count;
    }
    
    // Tentar converter para número se for string
    if (typeof store.file_count === 'string' && !isNaN(parseInt(store.file_count))) {
      return parseInt(store.file_count);
    }
    
    // Fallback para 0 se nenhuma das opções acima funcionar
    return 0;
  };

  // Abrir diálogo para ver arquivos de um armazenamento
  const openViewFilesDialogForStore = async (store: any) => {
    setCurrentVectorStore(store);
    setLoadingStoreFiles(true);
    setStoreFiles([]);
    setOpenViewFilesDialog(true);
    
    try {
      const response = await fetch(`/api/vector-stores/${store.id}/files`);
      if (response.ok) {
        const data = await response.json();
        console.log('Arquivos retornados pela API:', data.files);
        setStoreFiles(data.files || []);
      } else {
        toast.error('Erro ao carregar arquivos do armazenamento');
      }
    } catch (error) {
      console.error('Erro ao carregar arquivos do armazenamento:', error);
      toast.error('Erro ao carregar arquivos do armazenamento');
    } finally {
      setLoadingStoreFiles(false);
    }
  };

  // Remover arquivo do armazenamento
  const handleFileRemoved = (fileId: string) => {
    // Atualizar a lista de arquivos do armazenamento
    setStoreFiles(storeFiles.filter(file => file.id !== fileId));
    
    // Atualizar a contagem de arquivos no armazenamento
    if (currentVectorStore) {
      setVectorStores(prevStores => 
        prevStores.map(store => {
          if (store.id === currentVectorStore.id) {
            const currentCount = getFileCount(store);
            return {
              ...store,
              file_count: Math.max(0, currentCount - 1)
            };
          }
          return store;
        })
      );
      
      // Atualizar a lista completa de armazenamentos para garantir dados atualizados
      fetchVectorStores();
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
    <div className="h-full">
      <div className="max-w-[1800px] mx-auto px-8">
        <div className="flex items-center justify-between py-6">
          <h1 className="text-2xl font-bold text-white">Armazenamento de Vetores</h1>
          
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={fetchVectorStores} 
                    disabled={refreshing}
                    className="border-gray-700 hover:bg-gray-800 hover:text-white"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Atualizar lista</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-700 bg-gray-800/40 text-gray-300 hover:bg-gray-700 hover:text-white mr-2"
                    onClick={() => setIsTutorialOpen(true)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver tutorial</p>
                </TooltipContent>
              </Tooltip>

              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 text-white hover:bg-blue-500">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Armazenamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1A1D24] text-white border-gray-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Criar Novo Armazenamento</DialogTitle>
                    <DialogDescription className="text-gray-300">
                      Crie um novo armazenamento de vetores para seus arquivos.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label htmlFor="name" className="text-white">Nome do Armazenamento</Label>
                      <Input
                        id="name"
                        value={vectorStoreName}
                        onChange={(e) => setVectorStoreName(e.target.value)}
                        className="mt-2"
                        placeholder="Digite o nome do armazenamento"
                      />
                    </div>
                    <div className="mt-4">
                      <Label className="mb-2 block text-white">Selecione os arquivos</Label>
                      <div className="border border-gray-700 rounded-md max-h-60 overflow-y-auto">
                        {files.length === 0 ? (
                          <div className="p-4 text-center text-gray-400">
                            Nenhum arquivo disponível. Adicione arquivos na página de Arquivos de IA.
                          </div>
                        ) : (
                          files.map((file) => (
                            <div 
                              key={file.id} 
                              className={`flex items-center p-3 border-b border-gray-700 hover:bg-gray-800 transition-colors ${
                                selectedFiles.includes(file.id) ? 'bg-gray-800' : ''
                              }`}
                              onClick={() => toggleFileSelection(file.id)}
                            >
                              <input
                                type="checkbox"
                                checked={selectedFiles.includes(file.id)}
                                onChange={() => {}}
                                className="mr-3 flex-shrink-0"
                              />
                              <FileText className="h-4 w-4 mr-2 text-white flex-shrink-0" />
                              <div className="w-full break-words overflow-hidden pr-2 text-white">
                                {file.filename || file.name}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        {selectedFiles.length} arquivo(s) selecionado(s)
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setOpenDialog(false)}
                      className="bg-transparent text-white border-gray-600 hover:bg-gray-800 hover:text-white"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreateVectorStore} 
                      disabled={creating || !vectorStoreName.trim() || selectedFiles.length === 0}
                      className="bg-blue-600 text-white hover:bg-blue-500"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        'Criar Armazenamento'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TooltipProvider>
          </div>
        </div>

        <div className="relative w-64 mb-6">
          <Search className="absolute left-3 top-1.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar armazenamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-[#1A1D24] border-gray-700 h-7 min-h-0"
          />
        </div>

        {apiError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
            {apiMessage && <AlertDescription className="mt-2">{apiMessage}</AlertDescription>}
            {apiSuggestion && (
              <AlertDescription className="mt-2 font-medium">{apiSuggestion}</AlertDescription>
            )}
          </Alert>
        )}

        <div className="rounded-lg border border-gray-800 overflow-hidden">
          <div className="grid grid-cols-[1fr,120px,180px,120px] gap-4 p-4 bg-gray-900 text-sm font-medium text-gray-400">
            <div>Nome</div>
            <div>Arquivos</div>
            <div>Data</div>
            <div className="text-right">Ações</div>
          </div>

          {filteredVectorStores.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              Nenhum armazenamento encontrado
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredVectorStores.map((store) => (
                <div key={store.id} className="grid grid-cols-[1fr,120px,180px,120px] gap-4 p-4 items-center hover:bg-gray-900/50">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-white truncate">{store.name}</span>
                  </div>
                  <div className="text-sm text-gray-400">{getFileCount(store)} arquivos</div>
                  <div className="text-sm text-gray-400">{formatDate(store.created_at)}</div>
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-blue-400"
                            onClick={() => openViewFilesDialogForStore(store)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ver arquivos</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-green-400"
                            onClick={() => openAddFilesDialogForStore(store)}
                          >
                            <FilePlus className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Adicionar arquivos</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DeleteVectorStoreDialog storeId={store.id} onDeleted={handleVectorStoreDeleted}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DeleteVectorStoreDialog>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Excluir armazenamento</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diálogo para adicionar arquivos a um armazenamento existente */}
        <Dialog open={openAddFilesDialog} onOpenChange={setOpenAddFilesDialog}>
          <DialogContent className="max-w-2xl bg-[#1A1D24] text-white border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Adicionar Arquivos ao Armazenamento</DialogTitle>
              <DialogDescription className="text-gray-300">
                {currentVectorStore && (
                  <>Adicione mais arquivos ao armazenamento <strong>{currentVectorStore.name}</strong>.</>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="mt-4">
                <Label className="mb-2 block text-white">Selecione os arquivos</Label>
                <div className="border border-gray-700 rounded-md max-h-60 overflow-y-auto">
                  {files.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">
                      Nenhum arquivo disponível. Adicione arquivos na página de Arquivos de IA.
                    </div>
                  ) : (
                    files
                      .filter(file => !file.alreadyAdded)
                      .map((file) => (
                        <div 
                          key={file.id} 
                          className={`flex items-center p-3 border-b border-gray-700 hover:bg-gray-800 transition-colors ${
                            selectedFiles.includes(file.id) ? 'bg-gray-800' : ''
                          }`}
                          onClick={() => toggleFileSelection(file.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(file.id)}
                            onChange={() => {}}
                            className="mr-3 flex-shrink-0"
                          />
                          <FileText className="h-4 w-4 mr-2 text-white flex-shrink-0" />
                          <div className="w-full break-words overflow-hidden pr-2 text-white">
                            {file.filename || file.name}
                          </div>
                        </div>
                      ))
                  )}
                  {files.filter(file => !file.alreadyAdded).length === 0 && (
                    <div className="p-4 text-center text-gray-400">
                      Todos os arquivos já foram adicionados a este armazenamento.
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {selectedFiles.length} arquivo(s) selecionado(s)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setOpenAddFilesDialog(false)}
                className="bg-transparent text-white border-gray-600 hover:bg-gray-800 hover:text-white"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddFilesToStore} 
                disabled={addingFiles || selectedFiles.length === 0}
                className="bg-blue-600 text-white hover:bg-blue-500"
              >
                {addingFiles ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  'Adicionar Arquivos'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo para visualizar arquivos de um armazenamento */}
        <Dialog open={openViewFilesDialog} onOpenChange={setOpenViewFilesDialog}>
          <DialogContent className="max-w-2xl bg-[#1A1D24] text-white border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Arquivos do Armazenamento</DialogTitle>
              <DialogDescription className="text-gray-300">
                {currentVectorStore && (
                  <>Arquivos no armazenamento <strong>{currentVectorStore.name}</strong></>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="mt-4">
                {loadingStoreFiles ? (
                  <div className="flex items-center justify-center p-8 text-white">
                    <Loader2 className="h-6 w-6 animate-spin text-white mr-2" />
                    <span>Carregando arquivos...</span>
                  </div>
                ) : (
                  <>
                    {storeFiles.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        Nenhum arquivo encontrado neste armazenamento.
                      </div>
                    ) : (
                      <div className="border border-gray-700 rounded-md max-h-80 overflow-y-auto">
                        {storeFiles.map((file) => (
                          <div 
                            key={file.id} 
                            className="flex items-center justify-between p-3 border-b border-gray-700 hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex items-center overflow-hidden w-full mr-2">
                              <FileText className="h-4 w-4 mr-2 text-white flex-shrink-0" />
                              <div className="w-full break-words overflow-hidden text-white">
                                {file.filename || file.name || file.object_name || `Arquivo ${file.id.substring(0, 8)}`}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <DeleteVectorStoreFileDialog
                                storeId={currentVectorStore?.id || ''}
                                fileId={file.id}
                                fileName={file.filename || file.name || file.object_name || `Arquivo ${file.id.substring(0, 8)}`}
                                onDelete={() => handleFileRemoved(file.id)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-gray-400 mt-2">
                      {storeFiles.length} arquivo(s) no armazenamento
                    </p>
                  </>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setOpenViewFilesDialog(false)}
                className="bg-transparent text-white border-gray-600 hover:bg-gray-800 hover:text-white"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Tutorial Modal */}
      <Tutorial 
        isOpen={isTutorialOpen} 
        onOpenChange={setIsTutorialOpen} 
      />
    </div>
  );
};

export default function ArmazenamentoVetoresPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando...</span>
      </div>
    }>
      <ArmazenamentoVetoresContent />
    </Suspense>
  );
} 
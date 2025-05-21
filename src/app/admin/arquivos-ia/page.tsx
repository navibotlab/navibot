'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { Loader2, Plus, FileText, RefreshCw, Search, Upload, Trash2, Link2, AlertTriangle, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DeleteFileDialog } from '@/components/DeleteFileDialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Tutorial from './components/Tutorial';

interface File {
  id: string;
  name: string;
  filename?: string;
  size: number;
  bytes: number;
  created_at: string;
  createdAt: string;
  updatedAt: string;
  purpose?: string;
}

const ArquivosIAContent = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [viewingFile, setViewingFile] = useState<File | null>(null);
  const [viewFileContent, setViewFileContent] = useState<string>('');
  const [viewFileDialog, setViewFileDialog] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<Blob | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Carregar arquivos
  const fetchFiles = async () => {
    setRefreshing(true);
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Filtrar arquivos pelo termo de busca
  const filteredFiles = files.filter(file => 
    (file.filename || file.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fazer upload de arquivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedFileName(file.name);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setSelectedFileName(file.name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('purpose', 'assistants');

    try {
      const response = await fetch('/api/files/upload-alt', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Arquivo enviado com sucesso');
        fetchFiles();
        setOpenDialog(false);
        setSelectedFile(null);
        setSelectedFileName('');
      } else {
        const error = await response.json();
        toast.error(`Erro ao enviar arquivo: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploading(false);
      // Limpar o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remover arquivo da lista após exclusão
  const handleFileDeleted = (fileId: string) => {
    setFiles(files.filter(file => file.id !== fileId));
  };

  // Formatar o tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const handleViewFile = async (file: File) => {
    try {
      setViewingFile(file);
      setViewFileDialog(true);
      const response = await fetch(`/api/admin/arquivos-ia/${file.id}/content`);
      if (!response.ok) {
        throw new Error('Erro ao carregar o conteúdo do arquivo');
      }
      const content = await response.text();
      setViewFileContent(content);
    } catch (error) {
      console.error('Erro ao carregar arquivo:', error);
      toast.error('Erro ao carregar o conteúdo do arquivo');
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
          <h1 className="text-2xl font-bold text-white">Arquivos de IA</h1>
          
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={fetchFiles} 
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
                    Adicionar Arquivo
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1A1D24] text-white border-gray-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Adicionar Novo Arquivo</DialogTitle>
                    <DialogDescription className="text-gray-300">
                      Faça upload de um arquivo para ser usado com IA.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label htmlFor="file" className="text-white">Arquivo</Label>
                      <div className="mt-2">
                        <input
                          type="file"
                          id="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          accept=".txt,.pdf,.doc,.docx"
                        />
                        <div 
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                            ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'}
                            ${selectedFile ? 'bg-gray-800/50' : ''}`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {selectedFile ? (
                            <div className="flex items-center justify-center gap-2">
                              <FileText className="h-5 w-5 text-blue-400" />
                              <span className="text-white">{selectedFileName}</span>
                            </div>
                          ) : (
                            <div>
                              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm text-gray-300">
                                Arraste um arquivo ou clique para selecionar
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Formatos suportados: TXT, PDF, DOC, DOCX
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setOpenDialog(false);
                        setSelectedFile(null);
                        setSelectedFileName('');
                      }}
                      className="bg-transparent text-white border-gray-600 hover:bg-gray-800 hover:text-white"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleUpload} 
                      disabled={uploading || !selectedFile}
                      className="bg-blue-600 text-white hover:bg-blue-500"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Enviar Arquivo'
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
            placeholder="Buscar arquivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-[#1A1D24] border-gray-700 h-7 min-h-0"
          />
        </div>

        <div className="rounded-lg border border-gray-800 overflow-hidden">
          <div className="grid grid-cols-[1fr,120px,180px,80px] gap-4 p-4 bg-gray-900 text-sm font-medium text-gray-400">
            <div>Nome</div>
            <div>Tamanho</div>
            <div>Data</div>
            <div className="text-right">Ações</div>
          </div>

          {filteredFiles.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              Nenhum arquivo encontrado
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredFiles.map((file) => (
                <div key={file.id} className="grid grid-cols-[1fr,120px,180px,80px] gap-4 p-4 items-center hover:bg-gray-900/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-white truncate">{file.filename || file.name}</span>
                  </div>
                  <div className="text-sm text-gray-400">{formatFileSize(file.bytes || 0)}</div>
                  <div className="text-sm text-gray-400">{formatDate(file.created_at || file.createdAt)}</div>
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DeleteFileDialog fileId={file.id} onDeleted={handleFileDeleted}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DeleteFileDialog>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Excluir arquivo</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={viewFileDialog} onOpenChange={setViewFileDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conteúdo do Arquivo: {viewingFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <pre className="whitespace-pre-wrap bg-gray-900 p-4 rounded-lg text-sm">
              {viewFileContent}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tutorial Modal */}
      <Tutorial 
        isOpen={isTutorialOpen} 
        onOpenChange={setIsTutorialOpen} 
      />
    </div>
  );
};

export default function ArquivosIAPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando...</span>
      </div>
    }>
      <ArquivosIAContent />
    </Suspense>
  );
} 
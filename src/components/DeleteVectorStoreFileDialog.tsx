'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';

interface DeleteVectorStoreFileDialogProps {
  storeId: string;
  fileId: string;
  fileName: string;
  onDelete: () => void;
  id?: string;
}

export function DeleteVectorStoreFileDialog({ storeId, fileId, fileName, onDelete, id }: DeleteVectorStoreFileDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'Delete') return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/vector-stores/${storeId}/files/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Arquivo removido do armazenamento com sucesso');
        setOpen(false);
        onDelete();
      } else {
        const error = await response.json();
        toast.error(`Erro ao remover arquivo: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao remover arquivo do armazenamento:', error);
      toast.error('Erro ao remover arquivo do armazenamento');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Excluir arquivo"
          id={id}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#1A1D24] text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Remover Arquivo do Armazenamento</DialogTitle>
          <DialogDescription className="text-gray-300">
            Esta ação não pode ser desfeita. O arquivo será removido do armazenamento de vetores.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4 text-white">
            Para confirmar, digite <strong>Delete</strong> abaixo:
          </p>
          <p className="mb-2 text-sm font-medium text-gray-300">Arquivo: <span className="font-bold text-white">{fileName}</span></p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Delete"
            className="mt-2 bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
            className="bg-transparent text-white border-gray-600 hover:bg-gray-800 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText !== 'Delete' || isDeleting}
          >
            {isDeleting ? 'Removendo...' : 'Remover Arquivo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
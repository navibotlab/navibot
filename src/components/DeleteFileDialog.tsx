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

interface DeleteFileDialogProps {
  fileId: string;
  children: React.ReactNode;
  onDeleted: (fileId: string) => void;
}

export function DeleteFileDialog({ fileId, children, onDeleted }: DeleteFileDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'Delete') return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Arquivo excluído com sucesso');
        setOpen(false);
        onDeleted(fileId);
      } else {
        const error = await response.json();
        toast.error(`Erro ao excluir arquivo: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      toast.error('Erro ao excluir arquivo');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-[#1A1D24] border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Excluir Arquivo</DialogTitle>
          <DialogDescription className="text-gray-400">
            Esta ação não pode ser desfeita. O arquivo será permanentemente excluído.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4 text-gray-300">
            Para confirmar, digite <strong className="text-white">Delete</strong> abaixo:
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Delete"
            className="mt-2 bg-gray-900 border-gray-700 text-white"
          />
        </div>
        <DialogFooter>
          <Button
            onClick={() => setOpen(false)}
            disabled={isDeleting}
            className="bg-gray-800 text-white border border-gray-700 hover:bg-white hover:text-[#1A1D24]"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText !== 'Delete' || isDeleting}
          >
            {isDeleting ? 'Excluindo...' : 'Excluir Arquivo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
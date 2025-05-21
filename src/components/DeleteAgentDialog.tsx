'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DeleteAgentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  agentName: string;
  title?: string;
  description?: string;
}

export function DeleteAgentDialog({
  isOpen,
  onClose,
  onConfirm,
  agentName,
  title = "Excluir Agente",
  description
}: DeleteAgentDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (confirmText !== 'Delete') return;
    
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Erro ao excluir agente:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-red-500">{title}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {description || (
              <>
                Você está prestes a excluir o agente <span className="font-semibold text-white">{agentName}</span>.
                Esta ação é irreversível e todos os dados associados serão perdidos.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-white">
              Digite "Delete" para confirmar a exclusão
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Delete"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-transparent text-white hover:bg-gray-700"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={confirmText !== 'Delete' || isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Excluindo...' : 'Excluir Agente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
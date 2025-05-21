'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from 'lucide-react';

interface DeleteWhatsAppConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  connectionId: string;
}

export function DeleteWhatsAppConnectionModal({
  isOpen,
  onClose,
  onConfirm,
  connectionId
}: DeleteWhatsAppConnectionModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = () => {
    if (confirmText === 'DELETE') {
      setIsDeleting(true);
      onConfirm();
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setIsDeleting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1A1D24] text-white border-gray-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Esta ação é irreversível. A conexão será removida permanentemente e você perderá todas as informações associadas.
            </p>
            
            <div className="bg-red-950/20 border border-red-900/50 rounded-md p-4 mt-4">
              <p className="text-sm text-red-400">
                Para confirmar a exclusão, digite <span className="font-mono font-bold text-red-500">DELETE</span> no campo abaixo:
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmDelete">Confirmação</Label>
            <Input
              id="confirmDelete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Digite DELETE para confirmar"
              className="bg-[#1E2128] border-gray-800"
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-gray-800"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={confirmText !== 'DELETE' || isDeleting}
              onClick={handleConfirm}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-900/50"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir Conexão'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
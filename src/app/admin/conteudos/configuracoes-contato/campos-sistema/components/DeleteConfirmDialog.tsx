'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { SystemField } from '../services/systemFieldService';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  field: SystemField | null;
  isDeleting: boolean;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  field, 
  isDeleting 
}) => {
  const handleConfirm = async () => {
    try {
      if (!field) {
        console.error("Tentativa de excluir campo nulo");
        return;
      }
      
      console.log(`Confirmando exclusão do campo "${field.name}" (${field.id})`);
      await onConfirm();
    } catch (error) {
      console.error("Erro durante a confirmação de exclusão:", error);
      // O erro já será tratado no callback onConfirm
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1A1D24] text-white border-gray-800">
        <DialogHeader>
          <DialogTitle>Excluir Campo</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-gray-300">
            Tem certeza que deseja excluir o campo <span className="font-semibold text-white">{field?.name}</span>?
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Esta ação não pode ser desfeita.
          </p>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="bg-[#1A1D24] border-gray-700 text-white hover:bg-gray-800"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmDialog; 
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorSelector } from './ColorSelector';
import { z } from 'zod';
import { searchLabels } from '../services/labelService';

// Schema de validação
const tagSchema = z.object({
  name: z.string().min(1, { message: 'Nome é obrigatório' }),
  color: z.string().min(1, { message: 'Cor é obrigatória' }),
});

interface AddLabelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; color: string }) => Promise<void>;
  initialData?: { name: string; color: string };
  isEditing?: boolean;
}

export function AddLabelModal({ 
  open, 
  onOpenChange, 
  onSave, 
  initialData, 
  isEditing = false 
}: AddLabelModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [color, setColor] = useState(initialData?.color || '#F44336'); // vermelho como padrão
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  
  // Validar nome da etiqueta em tempo real
  useEffect(() => {
    const validateName = async () => {
      try {
        // Validar usando schema
        tagSchema.parse({ name, color });
        setError(null);

        // Verificar duplicidade apenas se o nome tiver pelo menos 1 caractere
        if (name.length > 0) {
          const existingLabels = await searchLabels(name);
          const duplicate = existingLabels.some(
            label => label.name.toLowerCase() === name.toLowerCase()
          );
          setIsDuplicate(duplicate);
        }
      } catch (err) {
        if (err instanceof z.ZodError) {
          setError(err.errors[0].message);
        }
      }
    };

    validateName();
  }, [name, color]);

  const handleSave = async () => {
    try {
      // Validar dados antes de salvar
      tagSchema.parse({ name, color });

      if (isDuplicate && !isEditing) {
        setError('Já existe uma etiqueta com este nome');
        return;
      }

      setLoading(true);
      await onSave({ name, color });
      resetForm();
      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao salvar etiqueta:', err);
      
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(`Erro ao salvar etiqueta: ${err.message}`);
      } else {
        setError('Erro ao salvar etiqueta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    if (!isEditing) {
      setName('');
      setColor('#F44336');
    }
  };
  
  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1D24] text-white border-gray-800 max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar' : 'Adicionar'} Etiqueta</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <div className="relative">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da etiqueta"
                className={error || isDuplicate ? 'border-red-500' : 'bg-[#0F1115] border-gray-700 text-white pr-8'}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            {isDuplicate && !error && (
              <p className="text-sm text-red-500">Já existe uma etiqueta com este nome</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Cor</Label>
            <ColorSelector selectedColor={color} onSelectColor={setColor} />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            className="border-gray-700 text-white hover:bg-gray-800"
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSave} 
            className="bg-green-500 hover:bg-green-600 text-white"
            disabled={loading || !!error || isDuplicate || !name || !color}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
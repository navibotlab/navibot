'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  maxWidth?: string;
  className?: string;
}

/**
 * Um dialog simples que não usa atributos aria-hidden complexos
 * para evitar problemas com leitores de tela
 */
export function SimpleDialog({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
  className,
}: SimpleDialogProps) {
  const [isOpen, setIsOpen] = useState(open);
  const dialogRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sincroniza o estado externo com o interno
  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  // Adiciona ouvintes de eventos para tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Modificamos para fechar apenas quando clica diretamente no overlay,
  // não em qualquer área fora do diálogo
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Apenas fecha se o clique for diretamente no overlay
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay - agora com onClick apenas no próprio elemento */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={handleOverlayClick}
      />
      
      {/* Dialog */}
      <div
        ref={dialogRef}
        className={cn(
          `relative z-50 ${maxWidth} w-full p-6 rounded-lg bg-gray-800 border border-gray-700 shadow-lg text-white`,
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {(title || description) && (
          <div className="mb-6">
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
          </div>
        )}
        
        {/* Content */}
        {children}
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-700 rounded-sm"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 
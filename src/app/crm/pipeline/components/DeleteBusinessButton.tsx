'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from '@/components/ui/spinner';
import { deleteBusinessById } from "../services/api";

interface DeleteBusinessButtonProps {
  businessId?: string;
  buttonClassName?: string;
  onDeleteSuccess?: () => void;
  variant?: 'icon' | 'button' | 'menu';
  showConfirmation?: boolean;
  buttonText?: string;
}

// Cache para evitar exclusões duplicadas
const processingIds = new Set<string>();

export function DeleteBusinessButton({
  businessId,
  buttonClassName = '',
  onDeleteSuccess,
  variant = 'button',
  showConfirmation = true,
  buttonText = 'Excluir negócio'
}: DeleteBusinessButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const hasCalledSuccessCallback = useRef(false);

  // Limpar flag quando o componente for desmontado ou quando o ID mudar
  useEffect(() => {
    return () => {
      hasCalledSuccessCallback.current = false;
      if (businessId) {
        processingIds.delete(businessId);
      }
    };
  }, [businessId]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!businessId) {
      console.error("Erro: ID do negócio não fornecido para exclusão");
      toast({
        title: "Erro",
        description: "ID do negócio não disponível para exclusão",
        variant: "destructive",
      });
      return;
    }
    
    // Evitar processamento duplicado
    if (processingIds.has(businessId)) {
      console.log(`Exclusão para ID ${businessId} já está em andamento. Ignorando.`);
      return;
    }
    
    console.log("DeleteBusinessButton: Solicitando exclusão do negócio:", businessId);
    
    // Se não precisar de confirmação, excluir diretamente
    if (!showConfirmation) {
      executeDeletion();
    } else {
      setConfirmOpen(true);
    }
  };

  const executeDeletion = async () => {
    if (!businessId) {
      console.error("Erro: ID do negócio não fornecido para exclusão");
      return;
    }
    
    // Verificar se já está sendo processado
    if (processingIds.has(businessId)) {
      console.log(`Exclusão para ID ${businessId} já está em andamento. Ignorando segunda execução.`);
      return;
    }
    
    // Marcar como em processamento
    processingIds.add(businessId);
    setIsDeleting(true);
    
    console.log("DeleteBusinessButton: Executando exclusão do negócio:", businessId);
    
    try {
      // Chamar API para excluir o negócio
      await deleteBusinessById(businessId);
      
      console.log("DeleteBusinessButton: Exclusão bem-sucedida, atualizando UI");
      
      // Executar o callback de sucesso apenas uma vez
      if (!hasCalledSuccessCallback.current && onDeleteSuccess) {
        hasCalledSuccessCallback.current = true;
        
        // Executar o callback imediatamente para atualizar a UI
        onDeleteSuccess();
      }
      
      // Fechar o diálogo e limpar estado
      setConfirmOpen(false);
      setIsDeleting(false);
      
    } catch (error: any) {
      console.error("Erro ao excluir negócio:", error);
      
      let errorMessage = "Não foi possível excluir o negócio. Tente novamente.";
      
      if (error.message) {
        console.error(`Detalhes do erro: ${error.message}`);
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Limpar estado em caso de erro
      setIsDeleting(false);
      setConfirmOpen(false);
    } finally {
      // Remover do conjunto de processamento após um tempo 
      // para garantir que todos os componentes tenham tempo de reagir
      setTimeout(() => {
        processingIds.delete(businessId);
        hasCalledSuccessCallback.current = false;
      }, 1000);
    }
  };

  // Renderizar variações do botão de acordo com o variant
  const renderButton = () => {
    if (variant === 'icon') {
      return (
        <button
          className={`p-1.5 rounded-full hover:bg-red-900/40 text-red-400 hover:text-red-300 transition-colors ${buttonClassName}`}
          onClick={handleDeleteClick}
          title="Excluir negócio"
          disabled={isDeleting}
        >
          {isDeleting ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
        </button>
      );
    } else if (variant === 'menu') {
      return (
        <div 
          className={`w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center cursor-pointer ${buttonClassName}`}
          onClick={handleDeleteClick}
        >
          {isDeleting ? 
            <Spinner className="h-4 w-4 mr-2" /> : 
            <Trash2 className="h-4 w-4 mr-2 text-red-400" />
          }
          {buttonText}
        </div>
      );
    } else {
      // Padrão: variant === 'button'
      return (
        <button
          className={`mt-2 mb-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-red-900/30 text-red-400 hover:bg-red-800/40 transition-colors cursor-pointer ${buttonClassName}`}
          onClick={handleDeleteClick}
          disabled={isDeleting}
        >
          {isDeleting ? <Spinner className="h-4 w-4 mr-2" /> : <Trash2 className="h-4 w-4" />}
          <span className="text-xs font-medium">{buttonText}</span>
        </button>
      );
    }
  };

  return (
    <>
      {renderButton()}

      {/* Diálogo de confirmação */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-[#1A1D24] text-white border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Tem certeza que deseja excluir este negócio?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-transparent text-white border-gray-600 hover:bg-gray-800 hover:text-white"
              onClick={() => {
                console.log("DeleteBusinessButton: Cancelamento de exclusão");
                setConfirmOpen(false);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                console.log("DeleteBusinessButton: Confirmação de exclusão, executando");
                executeDeletion();
              }}
              className="bg-red-600 text-white hover:bg-red-500"
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner className="h-4 w-4 mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 
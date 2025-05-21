import { Toast } from '@/components/ui/toast';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: ToastProps) => {
    // Por enquanto vamos apenas logar no console
    console.log(`Toast: ${variant}`, { title, description });
  };

  return { toast };
} 
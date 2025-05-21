import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SimpleDialogFooterProps {
  children: ReactNode;
  className?: string;
}

export function SimpleDialogFooter({ children, className }: SimpleDialogFooterProps) {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)}>
      {children}
    </div>
  );
} 
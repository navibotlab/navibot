import { ReactNode } from 'react';

interface ToastProps {
  children: ReactNode;
  variant?: 'default' | 'destructive';
}

export function Toast({ children, variant = 'default' }: ToastProps) {
  const baseClasses = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg';
  const variantClasses = {
    default: 'bg-white text-gray-900',
    destructive: 'bg-red-600 text-white',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </div>
  );
} 
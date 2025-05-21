'use client';

import "flag-icons/css/flag-icons.min.css";

interface FlagIconProps {
  countryCode: string;
  className?: string;
}

/**
 * Componente de ícone de bandeira que segue as diretrizes de acessibilidade
 * Implementa o padrão apropriado de acessibilidade para elementos decorativos
 */
export function FlagIcon({ countryCode, className = '' }: FlagIconProps) {
  return (
    <span 
      className={`fi fi-${countryCode.toLowerCase()} ${className}`} 
      role="img" 
      aria-label={`Bandeira de ${countryCode.toUpperCase()}`}
    />
  );
} 
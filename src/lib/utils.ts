import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina nomes de classes CSS usando clsx e tailwind-merge
 * Esta função é útil para combinar classes condicionais e evitar conflitos
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utilitários diversos para a aplicação

/**
 * Gera uma senha forte aleatória
 * @param length Comprimento da senha (padrão: 12 caracteres)
 * @returns Uma senha forte aleatória
 */
export function generateStrongPassword(length: number = 12): string {
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = upperChars + lowerChars + numbers + specialChars;
  
  // Garantir pelo menos um caractere de cada tipo
  let password = 
    upperChars.charAt(Math.floor(Math.random() * upperChars.length)) +
    lowerChars.charAt(Math.floor(Math.random() * lowerChars.length)) +
    numbers.charAt(Math.floor(Math.random() * numbers.length)) +
    specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // Completar o restante da senha
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Embaralhar a senha para não ter um padrão previsível
  return password.split('').sort(() => 0.5 - Math.random()).join('');
} 
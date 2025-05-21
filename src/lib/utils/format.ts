import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatPhone = (phone: string) => {
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  // Se não for um número válido, retorna o original
  if (numbers.length < 8) return phone;

  // Verifica se começa com um código de país
  // Códigos comuns: 55 (Brasil), 1 (EUA), 44 (Reino Unido), etc.
  // Para simplificar, assumimos que o código do país tem 1 a 3 dígitos
  let countryCode = '';
  let remainingDigits = numbers;
  
  if (numbers.length >= 10) {
    // Tenta identificar códigos de países comuns
    if (numbers.startsWith('55')) {
      countryCode = '+55';
      remainingDigits = numbers.substring(2);
    } else if (numbers.startsWith('1')) {
      countryCode = '+1';
      remainingDigits = numbers.substring(1);
    } else if (numbers.startsWith('44')) {
      countryCode = '+44';
      remainingDigits = numbers.substring(2);
    } else if (numbers.startsWith('351')) {
      countryCode = '+351';
      remainingDigits = numbers.substring(3);
    } else if (numbers.startsWith('34')) {
      countryCode = '+34';
      remainingDigits = numbers.substring(2);
    } else if (numbers.startsWith('54')) {
      countryCode = '+54';
      remainingDigits = numbers.substring(2);
    } else if (numbers.startsWith('52')) {
      countryCode = '+52';
      remainingDigits = numbers.substring(2);
    }
  }

  // Formata o restante dos dígitos (sem o código do país)
  let formattedNumber = '';
  
  // Formata números com 11 dígitos (celular com DDD no Brasil)
  if (remainingDigits.length === 11) {
    formattedNumber = remainingDigits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  // Formata números com 10 dígitos (fixo com DDD no Brasil ou celular em outros países)
  else if (remainingDigits.length === 10) {
    formattedNumber = remainingDigits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  // Formata números com 9 dígitos (celular sem DDD no Brasil)
  else if (remainingDigits.length === 9) {
    formattedNumber = remainingDigits.replace(/(\d{5})(\d{4})/, '$1-$2');
  }
  // Formata números com 8 dígitos (fixo sem DDD)
  else if (remainingDigits.length === 8) {
    formattedNumber = remainingDigits.replace(/(\d{4})(\d{4})/, '$1-$2');
  }
  // Para outros tamanhos, mantém como está
  else {
    formattedNumber = remainingDigits;
  }

  // Retorna o número formatado com o código do país, se existir
  return countryCode ? `${countryCode} ${formattedNumber}` : formattedNumber;
};

export const formatDateTime = (dateString: string) => {
  return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
}; 
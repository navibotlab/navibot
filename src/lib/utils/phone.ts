// Importações necessárias

/**
 * Formata um número de telefone para o formato padrão.
 * @param phoneNumber Número de telefone a ser formatado
 * @returns Número de telefone formatado
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Log para diagnóstico
  console.log(`Formatando número de telefone: ${phoneNumber}`);
  
  // Se o número já tiver um sufixo para origem, preservá-lo
  if (phoneNumber.includes('_origin') || phoneNumber.includes('@')) {
    console.log('Número já tem sufixo para origem, preservando formato original');
    return phoneNumber;
  }
  
  // Remover todos os caracteres não numéricos
  let digits = phoneNumber.replace(/\D/g, '');
  
  // Se for um número brasileiro, verifica se tem 11 dígitos (com 9 na frente)
  if (digits.length >= 10 && digits.length <= 11) {
    // Adicionar 9 se necessário
    if (digits.length === 10) {
      // Verifica se o DDD é seguido por 8 ou 9 (número de celular)
      const ddd = digits.substring(0, 2);
      const firstDigit = digits.substring(2, 3);
      
      // Se não começa com 9, é provavelmente um número de celular antigo, adicionar o 9
      if (firstDigit !== '9') {
        digits = `${ddd}9${digits.substring(2)}`;
        console.log(`Adicionado 9 ao número: ${digits}`);
      }
    }
  }
  
  console.log(`Número formatado: ${digits}`);
  return digits;
}

/**
 * Gera uma versão alternativa do número de telefone (com ou sem 9).
 * @param phoneNumber Número de telefone original
 * @returns Versão alternativa do número ou null se não aplicável
 */
export function getAlternativePhoneNumber(phoneNumber: string): string | null {
  // Se o número já tiver um sufixo para origem, não gerar alternativa
  if (phoneNumber.includes('_origin') || phoneNumber.includes('@')) {
    return null;
  }
  
  // Remover todos os caracteres não numéricos
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Precisa ter pelo menos 11 dígitos para ser um celular com 9
  if (digits.length === 11) {
    const ddd = digits.substring(0, 2);
    const firstDigit = digits.substring(2, 3);
    
    // Se começa com 9, criar versão sem o 9
    if (firstDigit === '9') {
      const withoutNine = `${ddd}${digits.substring(3)}`;
      console.log(`Gerada versão alternativa sem 9: ${withoutNine}`);
      return withoutNine;
    }
  } else if (digits.length === 10) {
    // Se tem 10 dígitos, criar versão com 9
    const ddd = digits.substring(0, 2);
    const withNine = `${ddd}9${digits.substring(2)}`;
    console.log(`Gerada versão alternativa com 9: ${withNine}`);
    return withNine;
  }
  
  return null;
} 
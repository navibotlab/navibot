/**
 * Formata um número de telefone do Brasil para o formato padrão
 * Adiciona o 9 quando necessário e mantém apenas dígitos
 * @param phone número de telefone
 * @returns número formatado ou null se inválido
 */
export function formatBrazilianPhoneNumber(phone: string): string | null {
  try {
    // Remove todos os caracteres não numéricos
    const digits = phone.replace(/\D/g, '');

    // Verifica se é um número brasileiro (começa com 55)
    if (!digits.startsWith('55')) {
      console.log('❌ Número não é brasileiro:', phone);
      return null;
    }

    // Extrai as partes do número
    const countryCode = digits.slice(0, 2); // 55
    const ddd = digits.slice(2, 4); // DDD
    let number = digits.slice(4); // Resto do número

    // Valida DDD
    if (!/^[1-9][0-9]$/.test(ddd)) {
      console.log('❌ DDD inválido:', ddd);
      return null;
    }

    // Verifica o tamanho do número (sem país e DDD)
    if (number.length === 9) {
      // Número móvel já com 9
      if (number[0] !== '9') {
        console.log('❌ Número móvel com 9 dígitos deve começar com 9');
        return null;
      }
      console.log('📱 Número móvel já com 9');
      return `${countryCode}${ddd}${number}`;
    } else if (number.length === 8) {
      // Se tem 8 dígitos, é um número móvel sem o 9
      console.log('📱 Número móvel detectado, adicionando dígito 9');
      return `${countryCode}${ddd}9${number}`;
    }

    console.log('❌ Formato de número inválido:', {
      countryCode,
      ddd,
      number,
      length: number.length
    });
    return null;
  } catch (error) {
    console.error('❌ Erro ao formatar número:', error);
    return null;
  }
}

/**
 * Normaliza um número de telefone para busca
 * Remove todos os caracteres não numéricos
 * @param phone número de telefone
 * @returns número apenas com dígitos ou null se vazio
 */
export function normalizePhoneNumber(phone: string): string | null {
  try {
    const normalized = phone.replace(/\D/g, '');
    return normalized || null;
  } catch {
    return null;
  }
} 
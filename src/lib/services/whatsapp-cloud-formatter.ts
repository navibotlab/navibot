/**
 * Sistema de formatação de mensagens para os serviços do WhatsApp Cloud API
 * 
 * Este módulo contém funções para formatar e dividir mensagens longas
 * em blocos menores que respeitam os limites do WhatsApp e mantêm
 * a integridade do conteúdo (listas, frases, etc).
 */

import { structuredLog } from './whatsapp-cloud-logger';

// Constantes de configuração
export const MAX_BLOCK_LENGTH = 350; // Tamanho máximo dos blocos em caracteres

/**
 * Divide um texto longo em blocos menores, respeitando a estrutura
 * do conteúdo como listas e frases.
 * 
 * @param text Texto a ser dividido em blocos
 * @returns Array com os blocos de texto
 */
export function splitTextIntoBlocks(text: string): string[] {
  if (!text) return [];
  
  structuredLog({ correlationId: '', messageId: '', phone: '', type: 'general' }, 'info', '\n=== INICIANDO DIVISÃO DO TEXTO EM BLOCOS ===');
  structuredLog({ correlationId: '', messageId: '', phone: '', type: 'general' }, 'info', `📏 Tamanho total do texto: ${text.length} caracteres`);
  
  const blocks: string[] = [];
  
  // 1. Primeiro, dividimos o texto em seções principais (separadas por linhas em branco)
  const sections = text.split(/\n\s*\n/);
  structuredLog({ correlationId: '', messageId: '', phone: '', type: 'general' }, 'info', `📑 Número de seções: ${sections.length}`);
  
  let currentBlock = '';
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    
    // Se a seção está vazia, continuamos
    if (!section) continue;
    
    // Verifica se é uma lista (começa com - ou •)
    const isList = section.split('\n').every(line => line.trim().match(/^[-•*]\s/));
    
    // Se é uma lista e cabe no bloco atual
    if (isList) {
      const listItems = section.split('\n');
      structuredLog({ correlationId: '', messageId: '', phone: '', type: 'general' }, 'info', `📝 Processando lista com ${listItems.length} itens`);
      
      // Tenta manter a lista junta se possível
      if ((currentBlock + '\n\n' + section).length <= MAX_BLOCK_LENGTH) {
        currentBlock = currentBlock 
          ? currentBlock + '\n\n' + section 
          : section;
      } else {
        // Se temos conteúdo no bloco atual, salvamos primeiro
        if (currentBlock) {
          structuredLog({ correlationId: '', messageId: '', phone: '', type: 'general' }, 'info', `📦 Bloco finalizado com ${currentBlock.length} caracteres`);
          blocks.push(currentBlock.trim());
          currentBlock = '';
        }
        
        // Agora processamos a lista
        let currentListBlock = '';
        for (const item of listItems) {
          if ((currentListBlock + '\n' + item).length <= MAX_BLOCK_LENGTH) {
            currentListBlock = currentListBlock 
              ? currentListBlock + '\n' + item 
              : item;
          } else {
            if (currentListBlock) {
              structuredLog({ correlationId: '', messageId: '', phone: '', type: 'general' }, 'info', `📦 Bloco de lista finalizado com ${currentListBlock.length} caracteres`);
              blocks.push(currentListBlock.trim());
            }
            currentListBlock = item;
          }
        }
        
        if (currentListBlock) {
          currentBlock = currentListBlock;
        }
      }
    } else {
      // Não é uma lista, processa como texto normal
      const sentences = section.split(/(?<=[.!?])\s+/);
      
      for (const sentence of sentences) {
        // Se a sentença cabe no bloco atual
        if ((currentBlock + (currentBlock ? ' ' : '') + sentence).length <= MAX_BLOCK_LENGTH) {
          currentBlock = currentBlock 
            ? currentBlock + ' ' + sentence 
            : sentence;
        } else {
          // Salva o bloco atual se existir
          if (currentBlock) {
            structuredLog({ correlationId: '', messageId: '', phone: '', type: 'general' }, 'info', `📦 Bloco finalizado com ${currentBlock.length} caracteres`);
            blocks.push(currentBlock.trim());
          }
          
          // Se a sentença é muito grande, divide ela
          if (sentence.length > MAX_BLOCK_LENGTH) {
            const parts = sentence.match(/.{1,350}/g) || [];
            parts.forEach(part => {
              structuredLog({ correlationId: '', messageId: '', phone: '', type: 'general' }, 'info', `📦 Parte da sentença longa: ${part.length} caracteres`);
              blocks.push(part.trim());
            });
            currentBlock = '';
          } else {
            currentBlock = sentence;
          }
        }
      }
    }
    
    // Se é a última seção ou a próxima seção não caberia, salvamos o bloco atual
    if (i === sections.length - 1 || 
        (currentBlock && i < sections.length - 1 && 
         (currentBlock + '\n\n' + sections[i + 1]).length > MAX_BLOCK_LENGTH)) {
      if (currentBlock) {
        structuredLog({ correlationId: '', messageId: '', phone: '', type: 'general' }, 'info', `📦 Bloco finalizado com ${currentBlock.length} caracteres`);
        blocks.push(currentBlock.trim());
        currentBlock = '';
      }
    }
  }
  
  // Adiciona o último bloco se houver
  if (currentBlock) {
    structuredLog({ correlationId: '', messageId: '', phone: '', type: 'general' }, 'info', `📦 Último bloco finalizado com ${currentBlock.length} caracteres`);
    blocks.push(currentBlock.trim());
  }

  structuredLog({ correlationId: '', messageId: '', phone: '', type: 'general' }, 'info', `✅ Texto dividido em ${blocks.length} blocos`);
  blocks.forEach((block, index) => {
    structuredLog({ correlationId: '', messageId: '', phone: '', type: 'general' }, 'info', `📑 Bloco ${index + 1}: ${block.length} caracteres`);
    structuredLog({ correlationId: '', messageId: '', phone: '', type: 'general' }, 'info', block);
    structuredLog({ correlationId: '', messageId: '', phone: '', type: 'general' }, 'info', '---');
  });
  structuredLog({ correlationId: '', messageId: '', phone: '', type: 'general' }, 'info', '=====================================\n');
  
  return blocks;
}

/**
 * Formata a resposta para um mensagem de áudio recebida,
 * adicionando ícones e organização visual.
 * 
 * @param transcription Texto transcrito do áudio
 * @returns Texto formatado com ícones
 */
export function formatAudioTranscription(transcription: string): string {
  return `🎵 Áudio recebido\n\n📝 Transcrição do áudio:\n${transcription}`;
}

/**
 * Formata o texto para exibição em logs ou débug
 * 
 * @param text Texto a ser formatado
 * @param maxPreviewLength Tamanho máximo para preview
 * @returns Texto formatado
 */
export function formatTextForDisplay(text: string, maxPreviewLength: number = 100): string {
  if (!text) return '[Texto vazio]';
  
  const preview = text.length > maxPreviewLength 
    ? `${text.substring(0, maxPreviewLength)}... (${text.length} caracteres)`
    : text;
    
  return preview;
} 
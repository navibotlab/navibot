import he from 'he';

interface SendMessageParams {
  secret: string;
  unique: string;
  recipient: string;
  message: string;
  type?: 'text' | 'media' | 'document';
  media_url?: string;
  media_type?: string;
  document_url?: string;
  document_type?: string;
  document_name?: string;
  delayMessage?: number;
  priority?: number;
}

export class DisparaJaService {
  private baseUrl = 'https://disparaja.com/api';
  private secret: string;
  private unique: string;

  constructor(secret: string, unique: string) {
    this.secret = secret;
    this.unique = unique;
  }

  private splitMessageIntoBlocks(message: string): string[] {
    // Se a mensagem for menor que 1000 caracteres, retorna como um único bloco
    if (message.length <= 1000) {
      return [message];
    }

    const blocks: string[] = [];
    let currentBlock = '';
    
    // Divide o texto em linhas
    const lines = message.split('\n');
    
    for (const line of lines) {
      // Se a linha atual + bloco atual exceder 1000 caracteres
      if (currentBlock.length + line.length + 1 > 1000) {
        // Se o bloco atual não estiver vazio, adiciona aos blocos
        if (currentBlock) {
          blocks.push(currentBlock.trim());
          currentBlock = '';
        }
        
        // Se a linha for muito grande, divide em partes menores
        if (line.length > 1000) {
          const parts = line.match(/.{1,1000}/g) || [];
          parts.forEach(part => blocks.push(part.trim()));
        } else {
          currentBlock = line;
        }
      } else {
        // Adiciona a linha ao bloco atual
        currentBlock = currentBlock ? `${currentBlock}\n${line}` : line;
      }
    }
    
    // Adiciona o último bloco se houver
    if (currentBlock) {
      blocks.push(currentBlock.trim());
    }
    
    return blocks;
  }

  async sendMessage(params: Omit<SendMessageParams, 'secret' | 'unique'>) {
    try {
      console.log('[DisparaJa] Enviando mensagem:', {
        ...params,
        secret: this.secret.substring(0, 8) + '...',
        account: this.unique
      });

      const formData = new URLSearchParams();
      formData.append('secret', this.secret);
      formData.append('account', this.unique);
      formData.append('delayMessage', '1');
      formData.append('priority', '1');
      
      // Adiciona os outros parâmetros
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      const response = await fetch(`${this.baseUrl}/send/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[DisparaJa] Erro ao enviar mensagem:', error);
        throw new Error(error.message || 'Erro ao enviar mensagem');
      }

      const result = await response.json();
      console.log('[DisparaJa] Resposta da API:', result);
      return result;
    } catch (error) {
      console.error('[DisparaJa] Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async sendText(recipient: string, message: string) {
    try {
      // Decodificar entidades HTML
      const decodedMessage = he.decode(message);

      // Garante que o número tenha o prefixo +55
      const formattedRecipient = recipient.startsWith('+55') ? recipient : `+${recipient}`;
      
      // Divide a mensagem em blocos se necessário
      const messageBlocks = this.splitMessageIntoBlocks(decodedMessage);
      console.log(`[DisparaJa] Mensagem dividida em ${messageBlocks.length} blocos`);

      // Envia cada bloco como uma mensagem separada
      for (const block of messageBlocks) {
        console.log('[DisparaJa] Enviando bloco de mensagem para:', formattedRecipient);
        console.log('[DisparaJa] Tamanho do bloco:', block.length, 'caracteres');

        const formData = new URLSearchParams();
        formData.append('secret', this.secret);
        formData.append('account', this.unique);
        formData.append('type', 'text');
        formData.append('recipient', formattedRecipient);
        formData.append('message', block);
        formData.append('delayMessage', '1');
        formData.append('priority', '1');

        console.log('[DisparaJa] Payload:', {
          secret: this.secret.substring(0, 8) + '...',
          account: this.unique,
          type: 'text',
          recipient: formattedRecipient,
          message: block,
          delayMessage: 1,
          priority: 1
        });

        const response = await fetch(`${this.baseUrl}/send/whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('[DisparaJa] Erro ao enviar mensagem:', error);
          throw new Error(error.message || 'Erro ao enviar mensagem');
        }

        const result = await response.json();
        console.log('[DisparaJa] Resposta da API:', result);

        // Adiciona um pequeno delay entre as mensagens para manter a ordem
        if (messageBlocks.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return { status: 200, message: 'Todas as mensagens foram enviadas com sucesso' };
    } catch (error) {
      console.error('[DisparaJa] Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async sendMedia(recipient: string, mediaUrl: string, caption: string, mediaType: string) {
    return this.sendMessage({
      recipient,
      message: caption,
      type: 'media',
      media_url: mediaUrl,
      media_type: mediaType
    });
  }

  async sendDocument(recipient: string, documentUrl: string, documentName: string, documentType: string) {
    return this.sendMessage({
      recipient,
      message: '',
      type: 'document',
      document_url: documentUrl,
      document_name: documentName,
      document_type: documentType
    });
  }
} 
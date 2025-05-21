import { prisma } from '@/lib/prisma';
import { DisparaJaService } from './disparaja';
import OpenAI from 'openai';
import he from 'he';

// Interface para definir os parâmetros de processamento de mensagem
interface ProcessMessageParams {
  leadId: string;
  connectionId: string;
  message: string;
  mediaUrl?: string | null;
  phone?: string;
}

// Interface para definir o conteúdo da mensagem de chat
interface ChatMessageContent {
  type: string;
  text: {
    value: string;
  };
}

// Interface para definir a mensagem de chat
interface ChatMessage {
  content: ChatMessageContent[];
}

/**
 * Ajusta o fuso horário para compensar a conversão automática para UTC
 * Subtrai 3 horas para o fuso horário Brasil (UTC-3)
 */
function adjustTimezoneBR(): Date {
  const date = new Date();
  date.setHours(date.getHours() - 3);
  return date;
}

export class MessageProcessor {
  private disparaJa: DisparaJaService;
  private readonly MAX_BLOCK_SIZE = 350;
  private readonly BLOCK_DELAY = 3000; // 3 segundos

  constructor(disparaJa: DisparaJaService) {
    this.disparaJa = disparaJa;
  }

  private splitTextIntoBlocks(text: string): string[] {
    const blocks: string[] = [];
    let currentBlock = '';
    
    // Divide o texto em linhas para processar cada uma
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
      
      // Se a linha atual é um título (começa com ###)
      if (line.startsWith('###')) {
        // Se já temos conteúdo no bloco atual, salvamos ele primeiro
        if (currentBlock.trim()) {
          blocks.push(currentBlock.trim());
          currentBlock = '';
        }
        
        // Começamos um novo bloco com o título
        currentBlock = line;
        
        // Adicionamos a próxima linha se não for outro título
        if (nextLine && !nextLine.startsWith('###')) {
          currentBlock += '\n' + nextLine;
          i++; // Avança o índice já que usamos a próxima linha
        }
        
        continue;
      }

      // Se adicionar a linha atual exceder o limite
      if ((currentBlock + '\n' + line).length > this.MAX_BLOCK_SIZE) {
        // Se o bloco atual não está vazio, salvamos ele
        if (currentBlock.trim()) {
          blocks.push(currentBlock.trim());
          currentBlock = '';
        }
        
        // Se a linha atual é muito grande, precisamos dividi-la
        if (line.length > this.MAX_BLOCK_SIZE) {
          // Divide a linha em sentenças
          const sentences = line.split(/(?<=[.!?])\s+/);
          
          for (const sentence of sentences) {
            if ((currentBlock + ' ' + sentence).length > this.MAX_BLOCK_SIZE) {
              if (currentBlock.trim()) {
                blocks.push(currentBlock.trim());
                currentBlock = '';
              }
              currentBlock = sentence;
            } else {
              currentBlock += (currentBlock ? ' ' : '') + sentence;
            }
          }
        } else {
          currentBlock = line;
        }
      } else {
        // Adiciona a linha ao bloco atual
        currentBlock += (currentBlock ? '\n' : '') + line;
      }
    }
    
    // Adiciona o último bloco se houver conteúdo
    if (currentBlock.trim()) {
      blocks.push(currentBlock.trim());
    }
    
    // Pós-processamento: junta blocos muito pequenos com o próximo se possível
    const mergedBlocks: string[] = [];
    let tempBlock = '';
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Se juntar com o bloco temporário não exceder o limite
      if (tempBlock && (tempBlock + '\n' + block).length <= this.MAX_BLOCK_SIZE) {
        tempBlock += '\n' + block;
      } else {
        // Se temos um bloco temporário, salvamos ele
        if (tempBlock) {
          mergedBlocks.push(tempBlock);
        }
        tempBlock = block;
      }
    }
    
    // Adiciona o último bloco temporário
    if (tempBlock) {
      mergedBlocks.push(tempBlock);
    }
    
    return mergedBlocks;
  }

  async processIncomingMessage({ leadId, connectionId, message, mediaUrl, phone }: ProcessMessageParams) {
    try {
      console.log('\n=== INÍCIO DO PROCESSAMENTO DE MENSAGEM ===');
      console.log('Lead ID:', leadId);
      console.log('Connection ID:', connectionId);
      console.log('Mensagem:', message);
      console.log('Media URL:', mediaUrl);
      console.log('Phone:', phone);
      
      // 1. Buscar o lead e a conexão com o agente
      console.log('\n=== BUSCANDO LEAD E CONEXÃO ===');
      const [lead, connection] = await Promise.all([
        prisma.leads.findUnique({
          where: { id: leadId }
        }),
        prisma.dispara_ja_connections.findUnique({
          where: { id: connectionId },
          include: {
            agents: true
          }
        })
      ]);

      if (!lead || !connection || !connection.agents) {
        console.error('Lead, conexão ou agente não encontrados');
        throw new Error('Lead, conexão ou agente não encontrados');
      }

      console.log('Lead encontrado:', lead.id);
      console.log('Conexão encontrada:', connection.id);
      console.log('Agente:', connection.agents.assistant_id);

      // Determinar tipo de mensagem baseado na presença de mediaUrl
      console.log('\n=== DETERMINANDO TIPO DE MENSAGEM ===');
      let messageType = 'text';
      let processedMessage = message || ''; // Garante que a mensagem nunca é undefined
      
      if (mediaUrl) {
        // Verificar se é uma imagem ou áudio pela extensão
        const fileExtension = mediaUrl.split('.').pop()?.toLowerCase();
        console.log('URL de mídia detectada:', mediaUrl);
        console.log('Extensão do arquivo:', fileExtension);
        
        if (fileExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
          messageType = 'image';
          console.log('Tipo detectado: IMAGEM');
          // Se não houver mensagem de texto, usar um prompt padrão para imagens
          if (!processedMessage) {
            processedMessage = 'Imagem Recebida';
            console.log('Usando prompt padrão para imagem:', processedMessage);
          }
        } else if (fileExtension && ['mp3', 'wav', 'ogg', 'oga', 'mp4', 'm4a'].includes(fileExtension)) {
          messageType = 'audio';
          console.log('Tipo detectado: ÁUDIO');
          // Se não houver mensagem de texto, usar um prompt padrão para áudio
          if (!processedMessage) {
            processedMessage = 'Áudio Recebido';
            console.log('Usando prompt padrão para áudio:', processedMessage);
          }
        } else {
          console.log('Tipo não reconhecido, tratando como texto');
        }
      } else {
        console.log('Nenhuma mídia detectada, tratando como texto simples');
      }
      
      // 2. Buscar ou criar uma conversa para este lead
      let conversation = await prisma.conversations.findFirst({
        where: {
          lead_id: lead.id
        }
      });

      if (!conversation) {
        console.log('[DisparaJá] Criando nova conversa com canal "disparaja"');
        conversation = await prisma.conversations.create({
          data: {
            lead_id: lead.id,
            workspaceId: lead.workspaceId,
            channel: 'disparaja', // Define o canal como disparaja para novas conversas
            created_at: new Date(),
            updated_at: new Date()
          } as any
        });
        console.log(`[DisparaJá] Conversa ${conversation.id} criada com sucesso`);
      } else if ((conversation as any).channel !== 'disparaja') {
        // Se a conversa existe mas o canal não está definido como disparaja, atualiza
        console.log(`[DisparaJá] Atualizando canal da conversa ${conversation.id} para "disparaja"`);
        conversation = await prisma.conversations.update({
          where: { id: conversation.id },
          data: {
            channel: 'disparaja'
          } as any
        });
        console.log(`[DisparaJá] Canal da conversa ${conversation.id} atualizado com sucesso`);
      } else {
        console.log(`[DisparaJá] Conversa ${conversation.id} já tem canal definido como "disparaja"`);
      }

      // 3. Salvar a mensagem recebida com o tipo correto
      console.log('Salvando mensagem no banco de dados...');
      console.log('- Tipo:', messageType);
      console.log('- Conteúdo:', processedMessage);
      console.log('- URL de mídia:', mediaUrl || 'nenhuma');

      // 4. Inicializar o cliente OpenAI com a chave da API do sistema
      let openaiApiKey = '';
      
      const apiKeyConfig = await prisma.system_configs.findFirst({
        where: { 
          key: 'OPENAI_API_KEY',
          workspaceId: lead.workspaceId
        }
      });

      if (!apiKeyConfig) {
        // Fallback para configuração global
        const globalConfig = await prisma.system_configs.findFirst({
          where: { 
            key: 'OPENAI_API_KEY'
          },
          orderBy: {
            createdAt: 'asc'
          },
          take: 1
        });
        
        if (!globalConfig) {
          throw new Error('Chave da API OpenAI não encontrada nas configurações do sistema');
        }
        
        console.log('Usando chave OpenAI global...');
        openaiApiKey = globalConfig.value;
      } else {
        console.log('Usando chave OpenAI do workspace...');
        openaiApiKey = apiKeyConfig.value;
      }
      
      // Verificação de segurança: não logar a chave completa
      const maskedKey = openaiApiKey.substring(0, 5) + '...' + openaiApiKey.substring(openaiApiKey.length - 4);
      console.log('Chave API (parcial):', maskedKey);
      console.log('ID do assistente:', connection.agents.assistant_id);

      const openai = new OpenAI({ apiKey: openaiApiKey });

      // 5. Criar thread se necessário
      let threadId = conversation.thread_id;
      if (!threadId) {
        console.log('Criando thread...');
        const thread = await openai.beta.threads.create();
        threadId = thread.id;
        
        // Atualizar a conversa com o ID do thread
        await prisma.conversations.update({
          where: { id: conversation.id },
          data: { thread_id: thread.id }
        });
        
        console.log('Thread criado:', threadId);
      }

      // 6. Processar a mensagem baseado no tipo
      if (messageType === 'audio' && mediaUrl) {
        // Se for áudio, processar a transcrição primeiro
        const transcription = await this.processAudioMessage(openai, threadId, mediaUrl, processedMessage);
        
        // Salvar a mensagem com a transcrição
        const now = adjustTimezoneBR(); // Usar timestamp ajustado para o fuso horário do Brasil
        
        await prisma.messages.create({
          data: {
            conversation_id: conversation.id,
            content: transcription, // Salvar a transcrição como conteúdo
            sender: 'user',
            read: false,
            media_url: mediaUrl,
            type: 'audio',
            external_id: `audio_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
            created_at: now, // Timestamp com ajuste de fuso horário
            updated_at: now  // Timestamp com ajuste de fuso horário
          } as any
        });

        // Usar a transcrição como mensagem para o processamento
        processedMessage = transcription;
      } else {
        // Para outros tipos de mensagem, salvar normalmente
        const now = adjustTimezoneBR(); // Usar timestamp ajustado para o fuso horário do Brasil
        
        await prisma.messages.create({
          data: {
            conversation_id: conversation.id,
            content: processedMessage,
            sender: 'user',
            read: false,
            media_url: mediaUrl,
            type: messageType,
            external_id: `${messageType}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
            created_at: now, // Timestamp com ajuste de fuso horário
            updated_at: now  // Timestamp com ajuste de fuso horário
          } as any
        });
      }

      // 7. Adicionar mensagem ao thread
      console.log('Adicionando mensagem ao thread...');
      
      // Utilizar o método apropriado com base no tipo de mídia
      if (messageType === 'image' && mediaUrl) {
        console.log('Processando mensagem como IMAGEM');
        console.log('URL da mídia:', mediaUrl);
        console.log('Conteúdo da mensagem:', processedMessage);
        await this.processImageMessage(openai, threadId, mediaUrl, processedMessage);
      } else if (messageType === 'audio' && mediaUrl) {
        console.log('Processando mensagem como ÁUDIO');
        // O áudio já é processado anteriormente neste método
        // e usa o resultado da transcrição como processedMessage
        await this.processTextMessage(openai, threadId, processedMessage);
      } else {
        console.log('Processando mensagem como TEXTO');
        await this.processTextMessage(openai, threadId, processedMessage);
      }

      // 8. Executar o assistente
      console.log('Executando assistente...');
      console.log('Thread ID:', threadId);
      console.log('Assistant ID:', connection.agents.assistant_id);

      if (!connection.agents.assistant_id) {
        throw new Error('ID do assistente não configurado para o agente');
      }

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: connection.agents.assistant_id
      });
      console.log('Run criado com sucesso. ID:', run.id);

      // 9. Aguardar processamento
      console.log('Aguardando processamento...');
      let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      
      while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
        console.log(`Status atual: ${runStatus.status}. Aguardando 1 segundo...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      }

      console.log('Processamento finalizado. Status final:', runStatus.status);
      
      if (runStatus.status === 'completed') {
        // 10. Obter resposta
        console.log('Obtendo mensagens do thread...');
        const messages = await openai.beta.threads.messages.list(threadId);
        const lastMessage = messages.data[0];
        let response = lastMessage.content[0].type === 'text' 
          ? lastMessage.content[0].text.value 
          : 'Não foi possível gerar uma resposta de texto.';
        console.log('Resposta gerada:', response);

        // Decodificar entidades HTML usando 'he'
        response = he.decode(response);
        console.log('Resposta decodificada:', response);

        // 11. Salvar resposta do agente no banco de dados...
        console.log('Salvando resposta do agente no banco de dados...');
        const now = adjustTimezoneBR(); // Usar timestamp ajustado para o fuso horário do Brasil
        
        await prisma.messages.create({
          data: {
            conversation_id: conversation.id,
            content: response,
            sender: 'agent',
            read: true,
            type: 'text', // As respostas do agente são sempre texto por enquanto
            external_id: `agent_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
            created_at: now, // Timestamp com ajuste de fuso horário
            updated_at: now  // Timestamp com ajuste de fuso horário
          } as any
        });

        // Divide a resposta em blocos
        const blocks = this.splitTextIntoBlocks(response);
        console.log(`Resposta dividida em ${blocks.length} blocos`);

        // Gera um delay aleatório inicial entre 6 e 15 segundos
        const initialDelay = Math.floor(Math.random() * (15000 - 6000 + 1)) + 6000;
        console.log(`Aguardando ${initialDelay/1000} segundos antes de enviar o primeiro bloco...`);
        await new Promise(resolve => setTimeout(resolve, initialDelay));

        // 12. Enviar blocos de resposta via DisparaJa
        const resultados = [];
        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];
          console.log(`Enviando bloco ${i + 1}/${blocks.length} para o lead:`, lead.phone);
          console.log('Conteúdo do bloco:', block);
          
          const resultado = await this.disparaJa.sendText(lead.phone, block);
          resultados.push(resultado);
          console.log(`Bloco ${i + 1} enviado com sucesso`);

          // Aguarda 3 segundos entre os blocos (exceto após o último)
          if (i < blocks.length - 1) {
            console.log('Aguardando 3 segundos antes do próximo bloco...');
            await new Promise(resolve => setTimeout(resolve, this.BLOCK_DELAY));
          }
        }

        console.log('Todos os blocos foram enviados com sucesso');
        
        // Retornar informações sobre o processamento
        return {
          success: true,
          messageType,
          hasMedia: !!mediaUrl,
          responseBlocks: blocks.length,
          threadId
        };
      } else {
        // Se não completou com sucesso, lançar erro
        if (runStatus.status === 'failed') {
          console.error('A execução falhou. Erro:', runStatus.last_error);
          throw new Error(`Execução falhou: ${runStatus.last_error?.code} - ${runStatus.last_error?.message}`);
        } else if (runStatus.status === 'cancelled') {
          throw new Error('A execução foi cancelada');
        } else if (runStatus.status === 'expired') {
          throw new Error('A execução expirou');
        } else {
          throw new Error(`Processamento falhou com status: ${runStatus.status}`);
        }
      }

    } catch (error: any) {
      console.error('Erro ao processar mensagem:', error);
      return {
        success: false,
        error: error.message,
        messageType: mediaUrl ? 
          (this.isImageUrl(mediaUrl || '') ? 'image' : 'audio') : 
          'text'
      };
    }
  }

  // Processa mensagem de texto
  private async processTextMessage(openai: OpenAI, threadId: string, messageText: string) {
    try {
      console.log('\n=== PROCESSANDO TEXTO ===');
      console.log('Texto:', messageText.substring(0, 100) + (messageText.length > 100 ? '...' : ''));
      
      // Verificar texto vazio
      if (!messageText || messageText.trim() === '') {
        messageText = '[Mensagem vazia recebida]';
      }
      
      // Enviar mensagem de texto
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: messageText
      });
      
      console.log('Mensagem de texto adicionada ao thread');
    } catch (error: any) {
      console.error('Erro ao processar texto:', error.message);
      throw error;
    }
  }

  // Processa mensagem com imagem
  private async processImageMessage(openai: OpenAI, threadId: string, imageUrl: string, messageText: string) {
    try {
      console.log('\n=== PROCESSANDO IMAGEM ===');
      console.log('Thread ID:', threadId);
      console.log('URL da imagem:', imageUrl);
      console.log('Texto associado:', messageText || '(nenhum)');
      
      // Verificar URL
      console.log('\n=== VALIDANDO URL DA IMAGEM ===');
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        console.error('URL inválida: não começa com http:// ou https://');
        throw new Error(`URL da imagem inválida: ${imageUrl}`);
      }

      // Tentar validar a URL da imagem
      try {
        console.log('Validando formato da URL...');
        const url = new URL(imageUrl);
        console.log('✅ URL da imagem validada com sucesso');
        console.log('- Protocolo:', url.protocol);
        console.log('- Host:', url.hostname);
        console.log('- Caminho:', url.pathname);
      } catch (error) {
        console.error('❌ Erro ao validar URL:', error);
        throw new Error(`URL da imagem mal formatada: ${imageUrl}`);
      }
      
      // Enviar a mensagem como um par imagem+texto
      console.log('\n=== ENVIANDO MENSAGEM PARA O THREAD ===');
      console.log('Criando mensagem com:');
      console.log('- Tipo: image_url');
      console.log('- URL:', imageUrl);
      console.log('- Texto:', messageText);

      const response = await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageUrl
            }
          },
          {
            type: 'text',
            text: messageText
          }
        ]
      });
      
      console.log('\n✅ MENSAGEM COM IMAGEM PROCESSADA');
      console.log('ID da mensagem:', response.id);
      return response;
    } catch (error: any) {
      console.error('\n❌ ERRO AO PROCESSAR IMAGEM ❌');
      console.error('Tipo de erro:', error.name);
      console.error('Mensagem de erro:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      
      // Se falhar, tenta enviar texto alternativo
      console.log('\n=== TENTANDO ENVIAR MENSAGEM ALTERNATIVA ===');
      await this.processTextMessage(openai, threadId, 
        `[Não foi possível processar a imagem. URL: ${imageUrl}]\n${messageText || ''}`
      );
      throw error;
    }
  }

  // Processa mensagem com áudio
  private async processAudioMessage(openai: OpenAI, threadId: string, audioUrl: string, messageText: string) {
    try {
      console.log('\n=== PROCESSANDO ÁUDIO ===');
      console.log('URL do áudio:', audioUrl);
      
      // 1. Download do áudio
      console.log('📥 Baixando áudio...');
      const audioResponse = await fetch(audioUrl);

      if (!audioResponse.ok) {
        console.error('❌ Erro ao baixar áudio:', {
          status: audioResponse.status,
          statusText: audioResponse.statusText
        });
        throw new Error(`Falha ao baixar o áudio: ${audioResponse.statusText}`);
      }

      const audioBuffer = await audioResponse.arrayBuffer();
      console.log('✅ Áudio baixado com sucesso:', {
        size: audioBuffer.byteLength
      });

      // 2. Transcrição com Whisper
      console.log('🔄 Iniciando transcrição com Whisper...');
      try {
        // Determinar o tipo MIME
        const fileExtension = audioUrl.split('.').pop()?.toLowerCase();
        let whisperMimeType = 'audio/ogg'; // Padrão
        
        if (fileExtension === 'mp3') {
          whisperMimeType = 'audio/mpeg';
        } else if (fileExtension === 'mp4' || fileExtension === 'm4a') {
          whisperMimeType = 'audio/mp4';
        } else if (fileExtension === 'wav') {
          whisperMimeType = 'audio/wav';
        } else if (fileExtension === 'webm') {
          whisperMimeType = 'audio/webm';
        }
        
        console.log('📦 Tipo MIME para Whisper:', whisperMimeType);

        const audioBlob = new Blob([audioBuffer], { type: whisperMimeType });
        const audioFile = new File([audioBlob], 'audio.' + fileExtension, { type: whisperMimeType });
        
        console.log('📦 Arquivo de áudio preparado:', {
          size: audioFile.size,
          type: audioFile.type,
          name: audioFile.name
        });

        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          language: 'pt'
        });

        console.log('\n=== TRANSCRIÇÃO DO ÁUDIO ===');
        console.log(transcription.text);
        console.log('===========================\n');

        // 3. Enviar a transcrição para o agente
        if (!threadId) {
          throw new Error('Thread ID não encontrado');
        }

        // Adicionar a mensagem à thread do OpenAI
        console.log('🤖 Adicionando transcrição à thread do OpenAI...');
        await openai.beta.threads.messages.create(threadId, {
          role: 'user',
          content: transcription.text
        });

        return transcription.text;
      } catch (error: any) {
        console.error('❌ Erro ao processar áudio:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('\n❌ ERRO AO PROCESSAR ÁUDIO ❌');
      console.error('Erro:', error.message);
      
      await this.processTextMessage(openai, threadId, 
        `[Não foi possível processar o áudio. URL: ${audioUrl}]`
      );
      throw error;
    }
  }

  // Métodos auxiliares
  private isImageUrl(url: string): boolean {
    const fileExtension = url.split('.').pop()?.toLowerCase();
    return fileExtension !== undefined && 
      ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
  }

  private isAudioUrl(url: string): boolean {
    const fileExtension = url.split('.').pop()?.toLowerCase();
    return fileExtension !== undefined && 
      ['mp3', 'wav', 'ogg', 'mp4', 'm4a'].includes(fileExtension);
  }
} 
import { NextResponse } from 'next/server';
import { getOpenAIClient } from '../../integrations/openai/route';
import { v4 as uuidv4 } from 'uuid';

// Função para gerar um ID de correlação para rastreamento de logs
function generateCorrelationId() {
  return uuidv4().substring(0, 8);
}

// Logger estruturado para garantir consistência nos logs
function createLogger(correlationId: string) {
  return {
    info: (message: string) => console.log(`[INFO] [${correlationId}] ${message}`),
    warn: (message: string) => console.warn(`[WARN] [${correlationId}] ${message}`),
    error: (message: string, error?: any) => {
      console.error(`[ERROR] [${correlationId}] ${message}`);
      if (error) console.error(`[ERROR] [${correlationId}] Detalhes: ${error.message || 'Erro desconhecido'}`);
    }
  };
}

export async function POST(request: Request) {
  const correlationId = generateCorrelationId();
  const logger = createLogger(correlationId);
  
  try {
    logger.info('Iniciando processo de upload de arquivo');
    const openai = await getOpenAIClient();
    
    if (!openai) {
      logger.error('Cliente OpenAI não configurado');
      return NextResponse.json(
        { error: 'OpenAI não configurada' },
        { status: 500 }
      );
    }

    // Processar o formulário multipart
    logger.info('Processando formulário multipart');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const purpose = formData.get('purpose') as string || 'assistants';

    // Log sem informações sensíveis
    logger.info('Arquivo recebido para processamento');
    
    if (!file) {
      logger.error('Nenhum arquivo enviado');
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Converter o arquivo para um buffer
    logger.info('Preparando arquivo para upload');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Enviar o arquivo para a OpenAI
    logger.info('Iniciando upload para serviço de IA');
    try {
      // Criar um objeto Blob a partir do buffer para compatibilidade com a API da OpenAI
      const blob = new Blob([buffer]);
      const fileObj = new File([blob], file.name, { type: file.type });
      
      const response = await openai.files.create({
        file: fileObj,
        purpose: purpose as 'assistants' | 'fine-tune',
      });
      
      // Log seguro sem mostrar ID completo
      logger.info('Upload concluído com sucesso');

      return NextResponse.json({
        success: true,
        file: response
      });
    } catch (uploadError: any) {
      logger.error('Erro no processo de upload para serviço de IA', uploadError);
      return NextResponse.json(
        { 
          error: 'Erro ao fazer upload de arquivo para OpenAI', 
          message: uploadError.message || 'Erro desconhecido',
          details: uploadError.toString()
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Erro geral ao processar upload de arquivo', error);
    return NextResponse.json(
      { 
        error: 'Erro ao processar upload de arquivo',
        message: error.message || 'Erro desconhecido',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

// Configuração para Next.js 13 App Router
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 
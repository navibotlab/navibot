import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/app/api/integrations/openai/route';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { logger } from '@/lib/logger';

// Configurações para tamanho máximo e tipos permitidos
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_FILE_TYPES = [
  'text/plain',
  'text/csv',
  'application/json',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/msword',
];

// Função para gerar um ID de correlação para rastreamento de logs
function generateCorrelationId() {
  return uuidv4().substring(0, 8);
}

// Logger estruturado para garantir consistência nos logs
function createLogger(correlationId: string) {
  return {
    info: (message: string) => logger.info(`[${correlationId}] ${message}`),
    warn: (message: string) => logger.warn(`[${correlationId}] ${message}`),
    error: (message: string, error?: any) => {
      logger.error(`[${correlationId}] ${message}`);
      if (error) logger.error(`[${correlationId}] Detalhes: ${error.message || 'Erro desconhecido'}`);
    }
  };
}

export async function POST(request: Request) {
  const correlationId = generateCorrelationId();
  const customLogger = createLogger(correlationId);
  let tempFilePath = '';
  
  try {
    customLogger.info('Iniciando processo alternativo de upload de arquivo');
    const openai = await getOpenAIClient();
    
    if (!openai) {
      customLogger.error('Cliente OpenAI não configurado');
      return NextResponse.json(
        { error: 'OpenAI não configurada. Por favor, configure a chave da API OpenAI nas configurações.' },
        { status: 200 }
      );
    }

    // Obter a sessão do usuário
    const session = await getServerSession(authOptions);
    customLogger.info('Verificando autenticação do usuário');
    
    if (!session?.user.email) {
      customLogger.error('Usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário tem um workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        users: {
          some: {
            email: session.user.email,
          },
        },
      },
    });

    if (!workspace) {
      customLogger.error('Workspace não encontrado');
      return NextResponse.json(
        { error: 'Workspace não encontrado' },
        { status: 401 }
      );
    }

    customLogger.info('Workspace encontrado, processando formulário');
    
    // Processar o formulário multipart
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const purpose = formData.get('purpose') as string || 'assistants';

    if (!file) {
      customLogger.error('Nenhum arquivo enviado');
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validar o tipo do arquivo
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      customLogger.error(`Tipo de arquivo não permitido: ${file.type}`);
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido' },
        { status: 400 }
      );
    }

    // Verificar o tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      customLogger.error(`Arquivo excede o tamanho máximo: ${file.size} bytes`);
      return NextResponse.json(
        { error: 'Arquivo excede o tamanho máximo permitido (15MB)' },
        { status: 400 }
      );
    }

    // Log com informações básicas e não-sensíveis
    customLogger.info(`Recebido arquivo para processamento (${Math.round(file.size/1024)} KB)`);

    // Salvar o arquivo temporariamente
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, file.name);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    customLogger.info('Salvando arquivo temporariamente');
    fs.writeFileSync(tempFilePath, buffer);
    
    // Gerar um nome único para o arquivo
    const uniqueFileName = `${workspace.id}_${Date.now()}_${file.name}`;
    customLogger.info('Preparando para envio ao serviço de IA');
    
    try {
      // Criar um buffer de leitura do arquivo temporário
      const fileStream = fs.createReadStream(tempFilePath);
      
      // Criar um objeto Blob a partir do buffer para compatibilidade com a API da OpenAI
      const response = await openai.files.create({
        file: fileStream as any,
        purpose: purpose as 'assistants' | 'fine-tune',
      });
      
      customLogger.info('Upload para serviço de IA concluído com sucesso');
      
      // Criar um registro do arquivo no banco de dados
      customLogger.info('Salvando registro do arquivo no banco de dados');
      const fileRecord = await prisma.files.create({
        data: {
          id: uuidv4(),
          fileId: response.id,
          filename: file.name,
          purpose: purpose,
          size: file.size,
          type: file.type,
          workspaceId: workspace.id,
          updatedAt: new Date(),
        },
      });
      
      // Limpar o arquivo temporário
      customLogger.info('Limpando arquivo temporário');
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        tempFilePath = '';
      }
      
      // Retornar a resposta de sucesso
      return NextResponse.json({
        success: true,
        file: {
          id: fileRecord.id,
          name: fileRecord.filename,
          fileId: fileRecord.fileId,
          type: fileRecord.type,
          size: fileRecord.size,
          createdAt: fileRecord.createdAt,
        }
      });
    } catch (uploadError: any) {
      // Limpar o arquivo temporário em caso de erro
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        tempFilePath = '';
      }
      
      customLogger.error('Erro no upload para serviço de IA', uploadError);
      return NextResponse.json(
        { 
          error: 'Erro ao fazer upload de arquivo para OpenAI', 
          message: uploadError.message || 'Erro desconhecido',
          details: uploadError.toString()
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    // Limpar o arquivo temporário em caso de erro
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    customLogger.error('Erro geral ao processar upload de arquivo', error);
    return NextResponse.json(
      { 
        error: 'Erro ao processar upload de arquivo',
        message: error.message || 'Erro desconhecido',
        details: error.toString()
      },
      { status: 200 }
    );
  }
}

// Configuração para Next.js 13 App Router
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 
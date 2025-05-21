import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { DisparaJaConnection, DisparaJaConnectionStatus, UpdateDisparaJaConnectionInput } from '@/app/admin/canais/dispara-ja/types';

// Função auxiliar para deletar a conta no Dispara Já
async function deleteDisparaJaAccount(secret: string, unique: string) {
  try {
    console.log('Enviando solicitação para excluir conta no Dispara Já...');
    console.log(`Secret: ${secret.substring(0, 8)}... | Unique: ${unique}`);
    
    // Na URL real, enviaríamos os parâmetros, mas usar URL.toString() diretamente pode
    // expor o secret no log, então montamos manualmente
    console.log(`URL: https://disparaja.com/api/delete/wa.account?secret=[secretOculto]&unique=${unique}`);
    
    const url = new URL('https://disparaja.com/api/delete/wa.account');
    url.searchParams.append('secret', secret);
    url.searchParams.append('unique', unique);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Erro ao excluir conta na API do Dispara Já: ${error}`);
      throw new Error(`Erro na API do Dispara Já: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    console.log('Resposta da API do Dispara Já:', data);
    
    // Verificar se a exclusão foi bem-sucedida
    // A API retorna status 200 e mensagem "WhatsApp account has been deleted!" quando tem sucesso
    if (data.status === 200) {
      if (data.message === 'WhatsApp account has been deleted!' || 
          data.message === 'Success' ||
          data.message.includes('deleted')) {
        console.log(`Conta com unique ${unique} excluída com sucesso na API do Dispara Já!`);
        return { success: true, message: 'Conta excluída com sucesso na API do Dispara Já' };
      }
    }
    
    // Se chegou aqui, a resposta foi ok mas não corresponde aos critérios de sucesso
    console.error(`Resposta inesperada da API do Dispara Já: ${data.message}`);
    return { success: false, message: `Resposta inesperada: ${data.message}` };
  } catch (error) {
    console.error('Erro ao excluir conta no Dispara Já:', error);
    throw error;
  }
}

// Endpoint para obter uma conexão específica
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Aguardar resolução do objeto params por completo
    const params = await context.params;
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da conexão não fornecido' },
        { status: 400 }
      );
    }

    // Usando um raw query para evitar erros de tipo
    const connections = await prisma.$queryRaw<DisparaJaConnection[]>`
      SELECT * FROM "dispara_ja_connections" WHERE id = ${id}
    `;

    if (!connections || connections.length === 0) {
      return NextResponse.json(
        { error: 'Conexão não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(connections[0]);
  } catch (error) {
    console.error('Erro ao buscar conexão:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar conexão' },
      { status: 500 }
    );
  }
}

// Endpoint para atualizar uma conexão
export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Aguardar resolução do objeto params por completo
    const params = await context.params;
    const connectionId = params.id;
    const now = new Date();

    const updateData: UpdateDisparaJaConnectionInput = await request.json();

    // Validar status se estiver sendo atualizado
    if (updateData.status && !['ativo', 'inativo', 'pendente', 'error'].includes(updateData.status)) {
      return NextResponse.json({
        error: "Status inválido"
      }, { status: 400 });
    }

    // Atualizar a conexão
    await prisma.$executeRaw`
      UPDATE "dispara_ja_connections"
      SET
        ${updateData.secret ? `secret = ${updateData.secret},` : ''}
        ${updateData.sid ? `sid = ${updateData.sid},` : ''}
        ${updateData.token ? `token = ${updateData.token},` : ''}
        ${updateData.phoneNumber ? `"phoneNumber" = ${updateData.phoneNumber},` : ''}
        ${updateData.unique ? `unique = ${updateData.unique},` : ''}
        ${updateData.webhookUrl ? `"webhookUrl" = ${updateData.webhookUrl},` : ''}
        ${updateData.status ? `status = ${updateData.status},` : ''}
        "updatedAt" = ${now}
      WHERE id = ${connectionId}
    `;
    
    // Buscar a conexão atualizada
    const updatedConnections = await prisma.$queryRaw<DisparaJaConnection[]>`
      SELECT * FROM "dispara_ja_connections" WHERE id = ${connectionId}
    `;
    
    if (!updatedConnections || updatedConnections.length === 0) {
      return NextResponse.json({
        error: "Erro ao recuperar conexão atualizada"
      }, { status: 500 });
    }
    
    const updatedConnection = updatedConnections[0];
    console.log("[DisparaJá API] Conexão atualizada com sucesso:", updatedConnection);
    
    // Criar log da atualização
    const logId = uuidv4();
    const updateMessage = `Conexão atualizada: ${JSON.stringify(updateData)}`;
    
    await prisma.$executeRaw`
      INSERT INTO "dispara_ja_logs" 
      (id, "connectionId", type, message, timestamp, action, status) 
      VALUES (
        ${logId}, 
        ${connectionId}, 
        'CONNECTION_UPDATE', 
        ${updateMessage}, 
        ${now},
        'UPDATE',
        'success'
      )
    `;
    
    // Retornar os dados atualizados
    return NextResponse.json({
      success: true,
      message: "Conexão atualizada com sucesso",
      connection: updatedConnection
    });
    
  } catch (error) {
    console.error('Erro ao atualizar conexão:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar conexão' },
      { status: 500 }
    );
  }
}

// Endpoint para deletar uma conexão
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Aguardar resolução do objeto params por completo
    const params = await context.params;
    const connectionId = params.id;
    
    if (!connectionId) {
      return NextResponse.json(
        { error: 'ID da conexão não fornecido' },
        { status: 400 }
      );
    }

    // Buscar a conexão para obter o secret e unique
    const connections = await prisma.$queryRaw<DisparaJaConnection[]>`
      SELECT * FROM "dispara_ja_connections" WHERE id = ${connectionId}
    `;

    if (!connections || connections.length === 0) {
      return NextResponse.json(
        { error: 'Conexão não encontrada' },
        { status: 404 }
      );
    }

    const connection = connections[0];
    let apiDeletionResult = { success: false, message: 'Não foi necessário excluir na API' };
    
    // Se o status for "ativo", tentar excluir na API do Dispara Já
    if (connection.status === 'ativo' && connection.secret && connection.unique) {
      try {
        apiDeletionResult = await deleteDisparaJaAccount(connection.secret, connection.unique);
      } catch (apiError: any) {
        console.error('Erro ao excluir na API do Dispara Já:', apiError);
        
        // Registrar o erro em um log
        try {
          const logId = uuidv4();
          const errorMessage = `Erro ao excluir conta na API: ${apiError.message || 'Erro desconhecido'}`;
          
          await prisma.$executeRaw`
            INSERT INTO "dispara_ja_logs" 
            (id, "connectionId", type, message, timestamp) 
            VALUES (
              ${logId}, 
              ${connection.id}, 
              'DELETE_ACCOUNT', 
              ${errorMessage}, 
              ${new Date()}
            )
          `;
        } catch (logError) {
          console.error('Erro ao registrar log:', logError);
        }
        
        // Se a API falhar, continuamos a exclusão no banco local, mas informamos o erro
        apiDeletionResult = { 
          success: false, 
          message: `Erro ao excluir na API do Dispara Já: ${apiError.message}` 
        };
      }
    }

    // Excluir a conexão do banco de dados
    await prisma.$executeRaw`
      DELETE FROM "dispara_ja_connections" WHERE id = ${connectionId}
    `;

    // Registrar a exclusão em um log
    try {
      const logId = uuidv4();
      const logMessage = `Conexão excluída. API: ${apiDeletionResult.message}`;
      
      await prisma.$executeRaw`
        INSERT INTO "dispara_ja_logs" 
        (id, type, message, timestamp, "workspaceId") 
        VALUES (
          ${logId}, 
          'DELETE_CONNECTION', 
          ${logMessage}, 
          ${new Date()},
          ${connection.workspaceId}
        )
      `;
    } catch (logError) {
      console.error('Erro ao registrar log:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Conexão excluída com sucesso',
      apiDeletionResult
    });
  } catch (error) {
    console.error('Erro ao excluir conexão:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir conexão' },
      { status: 500 }
    );
  }
} 
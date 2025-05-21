import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cache para armazenar o acesso a token recentemente usado com sucesso
// Chave: mediaId/mediaUrl, Valor: { connectionId, accessToken, phoneNumberId }
const successCache = new Map();

// Usando variáveis de ambiente diretamente do process.env
export async function GET(request: NextRequest) {
  console.log('🔄 Iniciando proxy de imagem...');
  
  // Obter o mediaId ou URL da consulta
  const searchParams = request.nextUrl.searchParams;
  let mediaId = searchParams.get('mediaId');
  let mediaUrl = searchParams.get('url');
  
  console.log('📝 Parâmetros recebidos:', { mediaId, mediaUrl });
  
  // Criar uma chave para o cache
  const cacheKey = mediaId || (mediaUrl || '').substring(0, 100);
  
  // Extrair mediaId da URL se a URL for fornecida e contiver o parâmetro 'mid'
  if (mediaUrl && !mediaId && mediaUrl.includes('mid=')) {
    try {
      const urlParts = mediaUrl.split('mid=');
      if (urlParts.length > 1) {
        const midValue = urlParts[1].split('&')[0];
        if (midValue) {
          mediaId = midValue;
          console.log(`🔍 Extraído mediaId da URL: ${mediaId}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao extrair mediaId da URL:', error);
    }
  }
  
  // Verificar se temos mediaId ou URL
  if (!mediaId && !mediaUrl) {
    console.error('❌ Nenhum mediaId ou URL fornecidos');
    return new NextResponse('É necessário fornecer mediaId ou url', { status: 400 });
  }
  
  try {
    // Verificar se temos uma conexão com sucesso anterior para esta mídia
    if (successCache.has(cacheKey)) {
      const cachedData = successCache.get(cacheKey);
      console.log(`🔍 Usando conexão em cache: ${cachedData.connectionId}`);
      
      try {
        const result = await downloadWithConnection(
          cachedData.accessToken,
          cachedData.phoneNumberId,
          mediaId,
          mediaUrl
        );
        
        if (result) {
          return result;
        }
        
        // Se falhou, remove do cache
        console.log(`🔍 Conexão em cache falhou, removendo do cache`);
        successCache.delete(cacheKey);
      } catch (error) {
        console.warn(`⚠️ Erro com conexão em cache:`, error);
        successCache.delete(cacheKey);
      }
    }
    
    // Primeiro, tentar com o agente AG001003 (que vimos na imagem do banco)
    const primaryConnection = await prisma.whatsAppCloudConnection.findFirst({
      where: { agentId: 'AG001003' }
    });
    
    if (primaryConnection) {
      console.log(`🔍 Tentando conexão primária: ${primaryConnection.id}`);
      try {
        const result = await downloadWithConnection(
          primaryConnection.accessToken,
          primaryConnection.phoneNumberId,
          mediaId,
          mediaUrl
        );
        
        if (result) {
          // Adicionar ao cache para uso futuro
          successCache.set(cacheKey, {
            connectionId: primaryConnection.id,
            accessToken: primaryConnection.accessToken,
            phoneNumberId: primaryConnection.phoneNumberId
          });
          return result;
        }
      } catch (error) {
        console.warn(`⚠️ Erro com conexão primária:`, error);
      }
    }
    
    // Se não funcionou com a conexão primária, buscar todas as outras
    const allConnections = await prisma.whatsAppCloudConnection.findMany({
      where: {
        NOT: {
          agentId: 'AG001003'
        }
      }
    });

    if (allConnections.length === 0 && !primaryConnection) {
      console.error('❌ Nenhuma conexão do WhatsApp encontrada');
      return new NextResponse('Nenhuma conexão do WhatsApp encontrada', { status: 404 });
    }
    
    // Vamos tentar cada conexão até encontrar uma que funcione
    let lastError = null;
    let lastStatus = 500;

    for (const connection of allConnections) {
      try {
        const accessToken = connection.accessToken;
        if (!accessToken) {
          console.warn(`⚠️ Token não encontrado para conexão: ${connection.id}`);
          continue;
        }

        console.log(`🔍 Tentando conexão alternativa: ${connection.id}, phoneNumberId: ${connection.phoneNumberId}`);
        
        const result = await downloadWithConnection(
          accessToken,
          connection.phoneNumberId,
          mediaId,
          mediaUrl
        );
        
        if (result) {
          // Adicionar ao cache para uso futuro
          successCache.set(cacheKey, {
            connectionId: connection.id,
            accessToken: connection.accessToken,
            phoneNumberId: connection.phoneNumberId
          });
          return result;
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao processar com conexão ${connection.id}:`, error);
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    // Se chegamos aqui, nenhuma conexão funcionou
    console.error('❌ Nenhuma conexão do WhatsApp conseguiu obter a imagem');
    return new NextResponse(
      `Falha ao obter imagem. Último erro: ${lastError}`, 
      { status: lastStatus }
    );
  } catch (error) {
    console.error('❌ Erro ao processar imagem:', error);
    return new NextResponse(`Erro interno: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

async function downloadWithConnection(accessToken: string, phoneNumberId: string | null, mediaId: string | null, mediaUrl: string | null) {
  if (!accessToken) {
    return null;
  }
  
  console.log(`🔑 Usando token (primeiros 10 caracteres): ${accessToken.substring(0, 10)}...`);

  // Se tivermos um mediaId, precisamos obter a URL primeiro
  let downloadUrl = mediaUrl;
  if (mediaId && !mediaUrl) {
    // Obter a URL do media usando o ID
    console.log(`🔍 Obtendo URL para mediaId: ${mediaId}`);
    
    if (!phoneNumberId) {
      console.warn(`⚠️ phoneNumberId não encontrado`);
      return null;
    }
    
    const mediaEndpoint = `https://graph.facebook.com/v19.0/${phoneNumberId}/media/${mediaId}`;
    console.log(`🌐 Endpoint para obter URL da mídia: ${mediaEndpoint}`);
    
    const mediaUrlResponse = await fetch(mediaEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!mediaUrlResponse.ok) {
      const errorText = await mediaUrlResponse.text();
      console.warn(`⚠️ Erro ao obter URL: ${errorText}`);
      return null;
    }

    const mediaData = await mediaUrlResponse.json();
    if (!mediaData.url) {
      console.warn(`⚠️ URL não encontrada na resposta`);
      return null;
    }
    
    downloadUrl = mediaData.url;
    console.log(`🔗 URL da mídia obtida: ${downloadUrl}`);
  }

  // Baixar a imagem com o token de acesso
  if (!downloadUrl) {
    console.warn(`⚠️ URL de download inválida`);
    return null;
  }
  
  console.log(`🔽 Baixando imagem de: ${downloadUrl}`);
  const imageResponse = await fetch(downloadUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!imageResponse.ok) {
    const errorText = await imageResponse.text();
    console.warn(`⚠️ Erro ao baixar imagem: ${errorText}`);
    return null;
  }

  // Sucesso! Obter o tipo de conteúdo e os dados da imagem
  const contentType = imageResponse.headers.get('content-type') || 'application/octet-stream';
  const imageData = await imageResponse.arrayBuffer();
  
  console.log(`✅ Imagem obtida com sucesso! Tamanho: ${imageData.byteLength} bytes`);
  
  // Retornar a imagem com o tipo de conteúdo apropriado
  return new NextResponse(imageData, {
    status: 200,
    headers: {
      'Content-Type': contentType,
    'Cache-Control': 'public, max-age=86400' // Cache por 24 horas
    }
  });
} 
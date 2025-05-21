import { readFileSync } from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

// Rota pública - não requer autenticação
export const dynamic = 'force-dynamic';

interface VersionData {
  version: string;
  buildDate: string;
  environment: string;
  timestamp?: string;
  [key: string]: any;
}

export async function GET() {
  try {
    // Garantir uma resposta básica mesmo que o arquivo não exista
    let versionData: VersionData = {
      version: "current",
      buildDate: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    };
    
    try {
      // Tentar ler o arquivo de versão
      const versionPath = path.join(process.cwd(), 'public', 'version.json');
      const fileContent = readFileSync(versionPath, 'utf8');
      const fileData = JSON.parse(fileContent);
      
      // Usar dados do arquivo se disponíveis
      versionData = {
        ...versionData,
        ...fileData
      };
    } catch (fileError) {
      console.warn('Não foi possível ler o arquivo version.json, usando dados padrão');
    }
    
    // Adicionar timestamp para prevenir cache
    versionData.timestamp = new Date().toISOString();
    
    // Retornar com cabeçalhos apropriados
    return new Response(JSON.stringify(versionData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET'
      }
    });
  } catch (error) {
    console.error('Erro ao processar requisição de versão:', error);
    
    // Retornar uma versão padrão em caso de erro
    const fallbackData: VersionData = { 
      version: 'fallback-version',
      timestamp: new Date().toISOString(),
      buildDate: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    };
    
    return new Response(JSON.stringify(fallbackData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET'
      }
    });
  }
} 
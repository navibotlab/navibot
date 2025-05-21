import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

// Función para obtener el tipo MIME basado en la extensión del archivo
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
  };

  return mimeTypes[extension] || 'text/plain';
}

export async function GET(request: NextRequest) {
  try {
    // Obtener la ruta del archivo solicitado
    const url = new URL(request.url);
    let filePath = url.pathname.replace('/api/docs', '');
    
    // Si no se especifica un archivo, servir index.html
    if (filePath === '' || filePath === '/') {
      filePath = '/index.html';
    }
    
    // Construir la ruta completa al archivo
    const fullPath = path.join(process.cwd(), 'docs', filePath);
    
    // Verificar si el archivo existe
    try {
      await fsPromises.access(fullPath);
    } catch (error) {
      return new NextResponse('Arquivo não encontrado', { status: 404 });
    }
    
    // Leer el archivo
    const fileContent = await fsPromises.readFile(fullPath);
    
    // Determinar el tipo MIME basado en la extensión del archivo
    const extension = path.extname(fullPath);
    const contentType = getMimeType(extension);
    
    // Devolver el archivo con el tipo MIME adecuado
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Erro ao servir documentação:', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
} 
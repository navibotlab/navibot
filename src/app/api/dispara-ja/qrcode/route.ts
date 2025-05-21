import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('[DisparaJá QRCode] Iniciando geração de QR Code...');
    const { secret } = await request.json();

    if (!secret) {
      console.log('[DisparaJá QRCode] Secret não fornecido');
      return NextResponse.json(
        { error: 'Secret é obrigatório' },
        { status: 400 }
      );
    }

    // Primeiro, tentar excluir qualquer conexão existente
    try {
      console.log('[DisparaJá QRCode] Tentando excluir conexão antiga...');
      const deleteUrl = `https://disparaja.com/api/delete/wa.account?secret=${encodeURIComponent(secret)}`;
      await fetch(deleteUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      console.log('[DisparaJá QRCode] Conexão antiga excluída ou não existia');
    } catch (deleteError) {
      console.log('[DisparaJá QRCode] Erro ao excluir conexão antiga (ignorando):', deleteError);
    }

    // Aguardar um momento para garantir que a exclusão foi processada
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fazer a requisição para o Dispara Já
    const url = `https://disparaja.com/api/create/wa.link?secret=${encodeURIComponent(secret)}&sid=3`;
    console.log('[DisparaJá QRCode] Chamando API:', url.replace(secret, '***'));
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DisparaJá QRCode] Erro na resposta:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        headers: Object.fromEntries(response.headers.entries())
      });

      return NextResponse.json(
        { error: `Erro na API do Dispara Já: ${errorText}` },
        { status: response.status }
      );
    }

    console.log('[DisparaJá QRCode] Resposta recebida, convertendo para JSON...');
    const data = await response.json();
    console.log('[DisparaJá QRCode] Dados recebidos:', {
      hasData: !!data,
      hasDataObject: !!data?.data,
      qrImageLink: !!data?.data?.qrimagelink,
      infoLink: !!data?.data?.infolink
    });

    if (!data || !data.data) {
      console.error('[DisparaJá QRCode] Resposta sem dados:', data);
      return NextResponse.json(
        { error: 'Resposta inválida da API' },
        { status: 500 }
      );
    }

    if (!data.data.qrimagelink || !data.data.infolink) {
      console.error('[DisparaJá QRCode] QR Code ou infolink ausentes:', data.data);
      return NextResponse.json(
        { error: 'QR code ou infolink não encontrados na resposta' },
        { status: 500 }
      );
    }

    console.log('[DisparaJá QRCode] QR Code gerado com sucesso');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[DisparaJá QRCode] Erro ao gerar QR code:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno ao gerar QR code' },
      { status: 500 }
    );
  }
} 
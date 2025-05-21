import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * ARQUIVO COMPLETAMENTE NOVO VERSÃO ULTRA SIMPLIFICADA
 * NÃO USA PARAMS DE FORMA ALGUMA
 * GET /api/crm/leads/[id]/business
 * Retorna o negócio associado a um lead específico
 */
export async function GET(request: NextRequest) {
  try {
    // Extrair ID da URL usando regex - SEM USAR PARAMS DE FORMA ALGUMA
    const url = request.url;
    console.log(`URL recebida: ${url}`);
    const matches = url.match(/\/api\/crm\/leads\/([^\/]+)\/business/);
    const leadId = matches ? matches[1] : null;
    
    console.log(`VERSÃO ULTRA NOVA (${new Date().toISOString()}) - LEADS/BUSINESS - ID extraído: ${leadId}`);
    
    if (!leadId || leadId === "undefined") {
      return NextResponse.json(
        { error: "ID do lead não identificado" },
        { status: 400 }
      );
    }

    // Buscar o lead diretamente
    const lead = await (prisma as any).leads.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      console.error("Lead não encontrado:", leadId);
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    // Buscar o negócio diretamente - VERSÃO SIMPLIFICADA
    const business = await (prisma as any).business.findFirst({
      where: { leadId }
    });

    if (!business) {
      console.error("Nenhum negócio encontrado para o lead:", leadId);
      return NextResponse.json(
        { error: "Nenhum negócio associado a este lead" },
        { status: 404 }
      );
    }

    console.log("Business encontrado:", business.id);
    return NextResponse.json(business);

  } catch (error) {
    console.error("Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar negócio do lead" },
      { status: 500 }
    );
  }
} 
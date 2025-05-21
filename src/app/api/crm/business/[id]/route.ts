import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * ARQUIVO COMPLETAMENTE NOVO VERSÃO ULTRA SIMPLIFICADA
 * NÃO USA PARAMS DE FORMA ALGUMA
 */

// GET - Buscar um negócio específico pelo ID
export async function GET(request: NextRequest) {
  try {
    // Extrair ID da URL usando regex - SEM USAR PARAMS
    const url = request.url;
    console.log(`URL recebida: ${url}`);
    const matches = url.match(/\/api\/crm\/business\/([^\/]+)/);
    const id = matches ? matches[1] : null;
    
    console.log(`VERSÃO ULTRA NOVA (${new Date().toISOString()}) - ID extraído: ${id}`);
    
    if (!id || id === "undefined") {
      return NextResponse.json(
        { error: "ID do negócio não identificado" },
        { status: 400 }
      );
    }

    // Obter workspaceId do header
    const workspaceId = request.headers.get('x-workspace-id');
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace não identificada" }, { status: 401 });
    }
    
    // Buscar negócio com suas relações
    const business = await (prisma as any).business.findUnique({
      where: { id, workspaceId },
      include: {
        lead: true,
        stage: true,
        origin: true,
        owner: true
      }
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negócio não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error("Erro ao buscar negócio:", error);
    return NextResponse.json(
      { error: "Erro ao buscar negócio" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um negócio
export async function PUT(request: NextRequest) {
  try {
    // Extrair ID da URL usando regex - SEM USAR PARAMS
    const url = request.url;
    console.log(`URL recebida: ${url}`);
    const matches = url.match(/\/api\/crm\/business\/([^\/]+)/);
    const id = matches ? matches[1] : null;
    
    console.log(`VERSÃO ULTRA NOVA (${new Date().toISOString()}) - PUT - ID extraído: ${id}`);
    
    if (!id || id === "undefined") {
      return NextResponse.json(
        { error: "ID do negócio não identificado" },
        { status: 400 }
      );
    }

    // Obter workspaceId
    const workspaceId = request.headers.get('x-workspace-id');
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace não identificada" }, { status: 401 });
    }
    
    // Verificar se o negócio existe
    const existingBusiness = await (prisma as any).business.findUnique({
      where: { id, workspaceId }
    });

    if (!existingBusiness) {
      return NextResponse.json(
        { error: "Negócio não encontrado" },
        { status: 404 }
      );
    }

    // Dados para atualização
    const body = await request.json();
    
    // Atualizar o negócio (versão simplificada)
    const updatedBusiness = await (prisma as any).business.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date()
      }
    });
    
    // Atualizar o lead se necessário (simplificado)
    if (body.stageId && existingBusiness.leadId) {
      await (prisma as any).leads.update({
        where: { id: existingBusiness.leadId },
        data: { stageId: body.stageId }
      });
    }
    
    return NextResponse.json(updatedBusiness);
  } catch (error) {
    console.error("Erro ao atualizar negócio:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar negócio" },
      { status: 500 }
    );
  }
}

// DELETE - Completamente reimplementado sem usar params
export async function DELETE(request: NextRequest) {
  try {
    // Extrair ID da URL usando regex - SEM USAR PARAMS DE FORMA ALGUMA
    const url = request.url;
    console.log(`URL recebida: ${url}`);
    const matches = url.match(/\/api\/crm\/business\/([^\/]+)/);
    const id = matches ? matches[1] : null;
    
    console.log(`VERSÃO ULTRA NOVA REESCRITA COMPLETA (${new Date().toISOString()}) - DELETE - ID extraído: ${id}`);
    
    if (!id || id === "undefined") {
      return NextResponse.json(
        { error: "ID do negócio não identificado" },
        { status: 400 }
      );
    }

    // Obter workspaceId
    const workspaceId = request.headers.get('x-workspace-id');
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace não identificada" }, { status: 401 });
    }
    
    // Verificar se o negócio existe
    const existingBusiness = await (prisma as any).business.findUnique({
      where: { id, workspaceId }
    });

    if (!existingBusiness) {
      return NextResponse.json(
        { error: "Negócio não encontrado" },
        { status: 404 }
      );
    }
    
    // Deletar o negócio diretamente - VERSÃO ULTRA SIMPLIFICADA
    await (prisma as any).business.delete({
      where: { id }
    });
    
    console.log(`Negócio excluído - IMPLEMENTAÇÃO COMPLETAMENTE NOVA`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir negócio:", error);
    return NextResponse.json(
      { error: "Erro ao excluir negócio" },
      { status: 500 }
    );
  }
}
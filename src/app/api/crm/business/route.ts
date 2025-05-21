import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar todos os negócios
export async function GET(request: Request) {
  try {
    // Obter workspaceId do header (configurado pelo middleware)
    const headersList = request.headers;
    const workspaceId = headersList.get('x-workspace-id');
    
    // Verificar se temos um workspaceId válido
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace não identificada" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stageId = searchParams.get("stageId");
    const originId = searchParams.get("originId");

    console.log(`API GET business: Filtrando por stageId: ${stageId}, originId: ${originId}`);

    const where = {
      workspaceId: workspaceId,
      ...(stageId && { stageId }),
      ...(originId && { originId }),
    };

    try {
      // Usar raw query para contornar erros de tipo
      const queryStr = `
        SELECT b.*, l.*, s.*, o.*, u.*
        FROM business b
        LEFT JOIN leads l ON b."leadId" = l.id
        LEFT JOIN stages s ON b."stageId" = s.id
        LEFT JOIN origins o ON b."originId" = o.id
        LEFT JOIN users u ON b."ownerId" = u.id
        WHERE b."workspaceId" = $1
        ${stageId ? `AND b."stageId" = $2` : ''}
        ${originId ? `AND b."originId" = $${stageId ? '3' : '2'}` : ''}
        ORDER BY b."createdAt" DESC
      `;

      const queryParams = [
        workspaceId,
        ...(stageId ? [stageId] : []),
        ...(originId ? [originId] : [])
      ];

      console.log('API GET business: Executando query com params:', queryParams);

      const business: any[] = await prisma.$queryRawUnsafe(queryStr, ...queryParams);
      console.log(`API GET business: ${business.length} negócios encontrados`);

      return NextResponse.json(business);
    } catch (queryError) {
      console.error("Erro ao executar query:", queryError);
      
      // Tentar um fallback usando Prisma padrão em caso de erro com a query raw
      const business: any = await (prisma as any).business.findMany({
        where,
        include: {
          lead: true,
          stage: true,
          origin: true,
          owner: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return NextResponse.json(business);
    }
  } catch (error) {
    console.error("Erro ao buscar negócios:", error);
    return NextResponse.json(
      { error: "Erro ao buscar negócios" },
      { status: 500 }
    );
  }
}

// POST - Criar um novo negócio
export async function POST(request: Request) {
  try {
    // Obter workspaceId do header (configurado pelo middleware)
    const headersList = request.headers;
    const workspaceId = headersList.get('x-workspace-id');
    
    // Verificar se temos um workspaceId válido
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace não identificada" }, { status: 401 });
    }

    // Função para verificar se uma string é um UUID válido ou um ID de estágio/origem válido
    const isValidId = (str: string) => {
      if (!str) return false;
      
      // Verificar se é um formato de ID de estágio (stage_XXXXXXXXXX)
      if (str.startsWith('stage_') || str.startsWith('origin_')) {
        console.log(`Aceitando ID no formato de estágio/origem: ${str}`);
        return true;
      }
      
      // Verificar se é um UUID padrão
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };
    
    const body = await request.json();
    const {
      title,
      value,
      leadId,
      stageId,
      originId,
      ownerId,
      probability,
      expectedCloseDate,
      customFields,
    } = body;

    console.log('API: Criando negócio com:', {
      leadId,
      stageId,
      originId,
      ownerId
    });

    // Validações básicas
    if (!leadId || !stageId || !originId) {
      return NextResponse.json(
        { error: "Dados obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Validar IDs
    if (!isValidId(leadId)) {
      return NextResponse.json(
        { error: "leadId inválido. Deve ser um UUID válido." },
        { status: 400 }
      );
    }
    
    if (!isValidId(stageId)) {
      console.error(`stageId rejeitado: ${stageId}, tipo: ${typeof stageId}`);
      return NextResponse.json(
        { error: "stageId inválido. Deve ser um UUID válido." },
        { status: 400 }
      );
    }
    
    if (!isValidId(originId)) {
      return NextResponse.json(
        { error: "originId inválido. Deve ser um UUID válido." },
        { status: 400 }
      );
    }
    
    if (ownerId && !isValidId(ownerId)) {
      return NextResponse.json(
        { error: "ownerId inválido. Deve ser um UUID válido." },
        { status: 400 }
      );
    }

    // Verificar se o lead existe
    const leadQuery = `SELECT * FROM "leads" WHERE id::text = $1::text LIMIT 1`;
    const existingLeads = await prisma.$queryRawUnsafe(leadQuery, leadId);
    const lead = Array.isArray(existingLeads) && existingLeads.length > 0 ? existingLeads[0] : null;
    
    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    // Preparar os dados do negócio
    const now = new Date();
    const businessData = {
      title: title || lead.name || "Novo negócio",
      value: value ? parseFloat(String(value)) : null,
      leadId,
      stageId,
      originId,
      ownerId: ownerId || null,
      workspaceId, // Usar o workspaceId do header
      probability: probability || 10,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
      customFields: customFields || {},
      status: "active",
      createdAt: now,
      updatedAt: now
    };

    // Adicionar log para verificar os dados antes de inserir
    console.log('Dados a serem inseridos no banco:', JSON.stringify(businessData, null, 2));

    try {
      // Criar negócio com query raw - O leadId precisa ser UUID, mas os outros IDs podem ser do formato "stage_"
      const insertQuery = `
        INSERT INTO "business" (
          "title", "value", "leadId", "stageId", "originId", "ownerId", 
          "workspaceId", "probability", "expectedCloseDate", "customFields", 
          "status", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13
        )
        RETURNING *
      `;
      
      const params = [
        businessData.title,
        businessData.value,
        leadId,
        stageId,
        originId,
        businessData.ownerId ? businessData.ownerId : null,
        workspaceId,
        businessData.probability,
        businessData.expectedCloseDate,
        JSON.stringify(businessData.customFields),
        businessData.status,
        businessData.createdAt,
        businessData.updatedAt
      ];
      
      console.log('Parâmetros da query:', params);
      console.log('SQL Query completa:', insertQuery);
      
      const newBusinessResult = await prisma.$queryRawUnsafe(insertQuery, ...params);
      const newBusiness = Array.isArray(newBusinessResult) ? newBusinessResult[0] : newBusinessResult;

      // Adicionar logs detalhados para confirmar que temos o ID do negócio
      console.log('Negócio criado com sucesso. ID:', newBusiness.id);
      console.log('Detalhes completos do negócio criado:', {
        id: newBusiness.id,
        businessId: newBusiness.id, // Explicitar que este é o ID do negócio
        leadId: leadId,
        title: newBusiness.title,
        stageId: newBusiness.stageId,
        originId: newBusiness.originId
      });
      
      // Atualizar o lead para refletir a associação com o negócio - mantendo conversão do leadId para UUID
      const updateLeadQuery = `
        UPDATE "leads" 
        SET "stageId" = $1, 
            "updatedAt" = $2,
            "value" = $3,
            "originId" = $4
        WHERE id = $5::uuid
      `;
      
      await prisma.$executeRawUnsafe(
        updateLeadQuery, 
        stageId, 
        now, 
        value ? parseFloat(String(value)) : null, 
        originId, 
        leadId
      );

      // Retornar o novo negócio com campos adicionais para deixar claro que este é o ID do business
      console.log('Negócio criado com sucesso. Retornando para o frontend:', {
        id: newBusiness.id,
        businessId: newBusiness.id, // Adicionar explicitamente o businessId
        leadId: leadId,             // Manter o leadId para referência, mas não como ID principal
        _type: 'business',          // Indicar que este é um objeto do tipo business
        ...newBusiness              // Incluir todos os campos do negócio
      });
      
      return NextResponse.json({
        id: newBusiness.id,         // ID principal deve ser o do business, não do lead
        businessId: newBusiness.id, // Adicionar explicitamente o businessId
        leadId: leadId,             // Manter o leadId para referência, mas não como ID principal
        _type: 'business',          // Indicar que este é um objeto do tipo business
        ...newBusiness              // Incluir todos os campos do negócio
      });
    } catch (prismaError: any) {
      console.error("Erro específico ao criar negócio:", prismaError);
      
      // Verificar se é um erro de Prisma e fornecer mais detalhes
      if (prismaError.name === 'PrismaClientKnownRequestError') {
        return NextResponse.json(
          { error: `Erro ao criar negócio: ${prismaError.message}` },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: "Erro ao criar negócio no banco de dados" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Erro ao criar negócio:", error);
    return NextResponse.json(
      { error: "Erro ao criar negócio" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um negócio existente
export async function PUT(request: Request) {
  try {
    // Obter workspaceId do header (configurado pelo middleware)
    const headersList = request.headers;
    const workspaceId = headersList.get('x-workspace-id');
    
    // Verificar se temos um workspaceId válido
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace não identificada" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do negócio não fornecido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      value,
      stageId,
      originId,
      ownerId,
      status,
      probability,
      expectedCloseDate,
      customFields,
    } = body;

    // Verificar se o negócio existe usando raw query
    const checkQuery = `
      SELECT * FROM business 
      WHERE id = $1 AND "workspaceId" = $2
      LIMIT 1
    `;
    
    const existingBusinessResult: any[] = await prisma.$queryRawUnsafe(
      checkQuery,
      id,
      workspaceId
    );

    if (!existingBusinessResult.length) {
      return NextResponse.json(
        { error: "Negócio não encontrado" },
        { status: 404 }
      );
    }

    const existingBusiness = existingBusinessResult[0];

    // Construir query de atualização dinâmica
    let updateQuery = `UPDATE business SET "updatedAt" = NOW()`;
    const params = [];
    
    if (title) {
      params.push(title);
      updateQuery += `, "title" = $${params.length}`;
    }
    
    if (value !== undefined) {
      params.push(value ? parseFloat(value) : null);
      updateQuery += `, "value" = $${params.length}`;
    }
    
    if (stageId) {
      params.push(stageId);
      updateQuery += `, "stageId" = $${params.length}`;
    }
    
    if (originId) {
      params.push(originId);
      updateQuery += `, "originId" = $${params.length}`;
    }
    
    if (ownerId !== undefined) {
      if (ownerId === null) {
        updateQuery += `, "ownerId" = NULL`;
      } else {
        params.push(ownerId);
        updateQuery += `, "ownerId" = $${params.length}`;
      }
    }
    
    if (status) {
      params.push(status);
      updateQuery += `, "status" = $${params.length}`;
    }
    
    if (probability !== undefined) {
      params.push(probability);
      updateQuery += `, "probability" = $${params.length}`;
    }
    
    if (expectedCloseDate !== undefined) {
      params.push(expectedCloseDate ? new Date(expectedCloseDate) : null);
      updateQuery += `, "expectedCloseDate" = $${params.length}`;
    }
    
    if (customFields) {
      params.push(JSON.stringify(customFields));
      updateQuery += `, "customFields" = $${params.length}::jsonb`;
    }
    
    params.push(id);
    updateQuery += ` WHERE id = $${params.length} RETURNING *`;

    // Executar a atualização
    const business = await prisma.$queryRawUnsafe(updateQuery, ...params);

    // Se houver mudança de estágio, origem ou valor, atualizar também o lead
    if (stageId || originId || value !== undefined) {
      let leadUpdateQuery = `UPDATE leads SET "updatedAt" = NOW()`;
      const leadParams = [];
      
      if (stageId) {
        leadParams.push(stageId);
        leadUpdateQuery += `, "stageId" = $${leadParams.length}`;
      }
      
      if (originId) {
        leadParams.push(originId);
        leadUpdateQuery += `, "originId" = $${leadParams.length}`;
      }
      
      if (value !== undefined) {
        leadParams.push(value ? parseFloat(value) : null);
        leadUpdateQuery += `, "value" = $${leadParams.length}`;
      }
      
      leadParams.push(existingBusiness.leadId);
      leadUpdateQuery += ` WHERE id = $${leadParams.length}::uuid`;

      await prisma.$queryRawUnsafe(leadUpdateQuery, ...leadParams);
    }

    // Buscar dados completos para retorno
    const completeQuery = `
      SELECT b.*, l.*, s.*, o.*, u.*
      FROM business b
      LEFT JOIN leads l ON b."leadId" = l.id
      LEFT JOIN stages s ON b."stageId" = s.id
      LEFT JOIN origins o ON b."originId" = o.id
      LEFT JOIN users u ON b."ownerId" = u.id
      WHERE b.id = $1
    `;
    
    const completeBusinessData: any[] = await prisma.$queryRawUnsafe(
      completeQuery,
      id
    );

    return NextResponse.json(completeBusinessData[0]);
  } catch (error) {
    console.error("Erro ao atualizar negócio:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar negócio" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um negócio
export async function DELETE(request: Request) {
  try {
    // Obter workspaceId do header (configurado pelo middleware)
    const headersList = request.headers;
    const workspaceId = headersList.get('x-workspace-id');
    
    // Verificar se temos um workspaceId válido
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace não identificada" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do negócio não fornecido" },
        { status: 400 }
      );
    }

    // Verificar se o negócio existe usando raw query e obter o leadId
    const checkQuery = `
      SELECT * FROM business 
      WHERE id = $1 AND "workspaceId" = $2
      LIMIT 1
    `;
    
    const existingBusinessResult: any[] = await prisma.$queryRawUnsafe(
      checkQuery,
      id,
      workspaceId
    );

    if (!existingBusinessResult.length) {
      return NextResponse.json(
        { error: "Negócio não encontrado" },
        { status: 404 }
      );
    }

    // Guardar o ID do lead associado ao negócio (pode ser necessário para atualizações)
    const leadId = existingBusinessResult[0].leadId;
    console.log(`Excluindo negócio ${id} associado ao lead ${leadId}`);

    // Excluir o negócio com raw query
    const deleteQuery = `DELETE FROM business WHERE id = $1`;
    await prisma.$executeRawUnsafe(deleteQuery, id);

    // Se houver leadId, atualizar o lead para remover a associação com o estágio e origem
    if (leadId) {
      try {
        // Consulta para verificar se o lead possui outros negócios associados
        const otherBusinessQuery = `
          SELECT COUNT(*) as count 
          FROM business 
          WHERE "leadId" = $1::uuid AND id != $2
        `;
        
        const otherBusinessResult: any[] = await prisma.$queryRawUnsafe(
          otherBusinessQuery,
          leadId,
          id
        );
        
        // Se não houver outros negócios associados, desassociar o lead da origem e estágio
        if (otherBusinessResult.length > 0 && otherBusinessResult[0].count === 0) {
          console.log(`Lead ${leadId} não tem outros negócios associados, atualizando referências.`);
          
          // Atualizar o lead para desassociar da origem e estágio
          const updateLeadQuery = `
            UPDATE leads 
            SET "stageId" = NULL, "originId" = NULL 
            WHERE id = $1::uuid
          `;
          
          await prisma.$executeRawUnsafe(updateLeadQuery, leadId);
        } else {
          console.log(`Lead ${leadId} ainda tem outros negócios associados, mantendo referências.`);
        }
      } catch (leadUpdateError) {
        console.error("Erro ao atualizar lead após exclusão do negócio:", leadUpdateError);
        // Não falhar a operação principal se a atualização do lead falhar
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Negócio removido com sucesso" 
    });
  } catch (error) {
    console.error("Erro ao excluir negócio:", error);
    return NextResponse.json(
      { error: "Erro ao excluir negócio" },
      { status: 500 }
    );
  }
}
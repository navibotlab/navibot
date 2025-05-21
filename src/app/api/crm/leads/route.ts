import { NextResponse } from 'next/server';
import { formatPhoneNumber, getAlternativePhoneNumber } from '@/lib/utils/phone';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

// GET - Listar todos os leads
export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const workspaceId = headersList.get('x-workspace-id');
    const userId = headersList.get('x-user-id');
    
    console.log(`Buscando leads para o workspace: ${workspaceId}`);
    console.log(`Usuário requisitando: ${userId || 'Não especificado'}`);
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace não encontrado no contexto' },
        { status: 400 }
      );
    }
    
    // Usar a instância prisma importada
    console.log('PrismaClient disponível na rota:', Boolean(prisma));
    
    // Verificar se o modelo leads está disponível
    // @ts-ignore - Verificando o modelo 'leads' em runtime
    console.log('Model leads disponível:', Boolean(prisma.leads));
    
    // O modelo correto é 'leads' (plural) e não 'lead' (singular)
    // @ts-ignore - O modelo 'leads' existe no runtime mas não é reconhecido pelo TypeScript
    const leads = await prisma.leads.findMany({
      where: {
        workspaceId: workspaceId
      },
      include: {
        tags: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Encontrados ${leads.length} leads para o workspace ${workspaceId}`);
    
    // Formatamos os leads para manter compatibilidade com o cliente existente
    // Convertendo tags para o formato de labels esperado pelo frontend
    const formattedLeads = leads.map((lead: any) => ({
      ...lead,
      labels: lead.tags.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color
      }))
    }));
    
    return NextResponse.json(formattedLeads);
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    console.error('Detalhes do erro:', {
      nome: error instanceof Error ? error.name : 'Erro desconhecido',
      mensagem: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'Stack não disponível'
    });
    
    // Verifica a disponibilidade dos modelos no Prisma
    try {
      // @ts-ignore - Acessando propriedades do Prisma em runtime
      const modelos = Object.keys(prisma).filter(key => !key.startsWith('$'));
      console.log('Modelos disponíveis no Prisma:', modelos);
    } catch (e) {
      console.error('Erro ao listar modelos:', e);
    }
    
    return NextResponse.json(
      { error: 'Erro ao buscar leads' },
      { status: 500 }
    );
  }
}

// POST - Criar novo lead
export async function POST(request: Request) {
  console.log('POST /api/crm/leads - Iniciando...');
  
  try {
    const headersList = await headers();
    const workspaceId = headersList.get('x-workspace-id');
    console.log('WorkspaceId:', workspaceId);
    
    if (!workspaceId) {
      return NextResponse.json({ error: "ID do workspace não fornecido" }, { status: 400 });
    }

    const data = await request.json();
    console.log('Dados recebidos:', data);

    // Extrair parâmetros importantes
    const { contactId, labels } = data;
    
    console.log('Etiquetas recebidas:', labels);
    console.log('OriginId recebido:', data.originId);

    // Pré-processo do número do telefone, removendo caracteres não-numéricos
    const phoneNumber = data.phone ? data.phone.replace(/\D/g, '') : '';
    
    // Verificar se é um número único e consistente
    if (!phoneNumber || phoneNumber.length < 8) {
      console.log('Número de telefone inválido:', phoneNumber);
      return NextResponse.json({ error: "Número de telefone inválido" }, { status: 400 });
    }
    
    // Verificar se já existe um lead com este telefone
    console.log(`Verificando lead existente com telefone: ${phoneNumber}`);
    console.log(`Workspace atual: ${workspaceId}`);
    console.log(`Origin ID: ${data.originId || 'não especificado'}`);
    
    // Formatar o número principal
    let phoneToUse = formatPhoneNumber(phoneNumber);
    
    // Gerar versão alternativa do número (com/sem 9)
    const alternativePhone = getAlternativePhoneNumber(phoneToUse);
    
    // Preparar conexão com etiquetas, se existirem
    let tagsConnect;
    if (Array.isArray(labels) && labels.length > 0) {
      console.log('Preparando conexão com etiquetas, quantidade:', labels.length);
      
      // Verificamos se estamos recebendo objetos completos ou apenas IDs
      if (typeof labels[0] === 'string') {
        // Se recebemos apenas strings (IDs)
        tagsConnect = {
          connect: labels.map((id) => ({ id }))
        };
        console.log('Conectando etiquetas por IDs:', labels);
      } else {
        // Se recebemos objetos ou qualquer outro formato
        const labelIds = labels.map((label) => 
          typeof label === 'object' && label !== null && 'id' in label 
            ? label.id 
            : String(label)
        );
        tagsConnect = {
          connect: labelIds.map((id) => ({ id }))
        };
        console.log('Conectando etiquetas a partir de objetos, IDs extraídos:', labelIds);
      }
    } else {
      console.log('Nenhuma etiqueta para conectar');
      tagsConnect = undefined;
    }

    console.log('tagsConnect final:', tagsConnect);

    // Verificar se o lead já existe com o mesmo número na mesma workspace
    // @ts-ignore - O modelo 'leads' existe no runtime mas não é reconhecido pelo TypeScript
    const existingLead = await prisma.leads.findFirst({
      where: {
        OR: [
          { phone: phoneToUse },
          ...(alternativePhone ? [{ phone: alternativePhone }] : [])
        ],
        workspaceId
      },
      include: {
        tags: true
      }
    });

    if (existingLead) {
      // Verificar se o lead existente tem a mesma origem que estamos tentando criar
      const existingOriginId = existingLead.originId as string | null;
      const targetOriginId = data.originId as string | null;
      
      console.log(`Lead existente encontrado: ${existingLead.id}`);
      console.log(`Origem do lead existente: ${existingOriginId || 'sem origem'}`);
      console.log(`Origem alvo: ${targetOriginId || 'sem origem'}`);
      
      // Caso 1: Mesma origem - Atualizar lead existente
      if (existingOriginId === targetOriginId) {
        console.log(`Lead já existe na mesma origem: ${existingLead.id}. Atualizando...`);
        
        // Atualizar o lead existente com os novos dados
        // @ts-ignore - O modelo 'leads' existe no runtime mas não é reconhecido pelo TypeScript
        const updatedLead = await prisma.leads.update({
          where: { id: existingLead.id },
          data: {
            stageId: data.stageId || undefined,
            value: data.value ? parseFloat(data.value) : undefined,
            ownerId: data.ownerId || undefined,
            source: data.origin || undefined
          },
          include: {
            tags: true
          }
        });
  
        // Formatamos o retorno para manter compatibilidade com o frontend
        const formattedLead = {
          ...updatedLead,
          labels: updatedLead.tags.map((tag: any) => ({
            id: tag.id,
            name: tag.name,
            color: tag.color
          }))
        };
  
        return NextResponse.json(formattedLead);
      }
      
      // Caso 2: Origem diferente - Criar novo lead com telefone modificado
      console.log(`Lead existe em outra origem. Criando lead com telefone modificado.`);
      
      // Adicionar um sufixo para tornar o telefone único
      const uniquePhone = `${phoneToUse}_origin${targetOriginId || Date.now()}`;
      
      try {
        // Criar novo lead com telefone modificado
        // @ts-ignore - O modelo 'leads' existe no runtime mas não é reconhecido pelo TypeScript
        const newLead = await prisma.leads.create({
          data: {
            phone: uniquePhone,
            name: data.name || null,
            photo: data.photo || null,
            workspaceId,
            stageId: data.stageId || undefined,
            value: data.value ? parseFloat(data.value) : undefined,
            ownerId: data.ownerId || undefined,
            source: data.origin || undefined,
            originId: targetOriginId || undefined,
            tags: tagsConnect,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          include: {
            tags: true
          }
        });
        
        console.log(`Novo lead criado com sucesso usando telefone modificado: ${uniquePhone}`);
        
        // Formatamos o retorno para manter compatibilidade com o frontend
        const formattedNewLead = {
          ...newLead,
          phone: phoneToUse, // Retornar o telefone original para o frontend
          labels: newLead.tags.map((tag: any) => ({
            id: tag.id,
            name: tag.name,
            color: tag.color
          }))
        };
  
        return NextResponse.json(formattedNewLead, { status: 201 });
      } catch (error) {
        console.error('Erro ao criar lead com telefone modificado:', error);
        // Tentar com outra estratégia de nomeação
        const randomSuffix = Date.now().toString();
        const absolutelyUniquePhone = `${phoneToUse}_${randomSuffix}`;
        
        // @ts-ignore - O modelo 'leads' existe no runtime mas não é reconhecido pelo TypeScript
        const newLead = await prisma.leads.create({
          data: {
            phone: absolutelyUniquePhone,
            name: data.name || null,
            photo: data.photo || null,
            workspaceId,
            stageId: data.stageId || undefined,
            value: data.value ? parseFloat(data.value) : undefined,
            ownerId: data.ownerId || undefined,
            source: data.origin || undefined,
            originId: targetOriginId || undefined,
            tags: tagsConnect,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          include: {
            tags: true
          }
        });
        
        console.log(`Lead criado com telefone absolutamente único: ${absolutelyUniquePhone}`);
        
        const formattedNewLead = {
          ...newLead,
          phone: phoneToUse, // Retornar o telefone original para o frontend
          labels: newLead.tags.map((tag: any) => ({
            id: tag.id,
            name: tag.name,
            color: tag.color
          }))
        };
        
        return NextResponse.json(formattedNewLead, { status: 201 });
      }
    }

    // Caso 3: Não existe nenhum lead com este telefone - Criar novo lead normal
    console.log('Criando novo lead com os seguintes dados:');
    console.log('- Phone:', phoneToUse);
    console.log('- Name:', data.name || null);
    console.log('- StageId:', data.stageId || undefined);
    console.log('- OriginId:', data.originId || undefined);
    console.log('- WorkspaceId:', workspaceId);
    
    try {
      // @ts-ignore - O modelo 'leads' existe no runtime mas não é reconhecido pelo TypeScript
      const lead = await prisma.leads.create({
        data: {
          phone: phoneToUse,
          name: data.name || null,
          photo: data.photo || null,
          workspaceId,
          stageId: data.stageId || undefined,
          value: data.value ? parseFloat(data.value) : undefined,
          ownerId: data.ownerId || undefined,
          source: data.origin || undefined,
          originId: data.originId || undefined,
          tags: tagsConnect,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          tags: true
        }
      });
  
      console.log(`Lead criado com sucesso: ${lead.id}`);
      console.log(`originId salvo: ${lead.originId || 'nenhum'}`);
      console.log(`stageId salvo: ${lead.stageId || 'nenhum'}`);
      console.log(`Etiquetas associadas: ${lead.tags.length}`);
  
      // Formatamos o retorno para manter compatibilidade com o frontend
      const formattedLead = {
        ...lead,
        labels: lead.tags.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          color: tag.color
        }))
      };
  
      return NextResponse.json(formattedLead, { status: 201 });
    } catch (prismaError: any) {
      // Tratamento específico para erros do Prisma ao criar lead
      console.error('ERRO DURANTE CRIAÇÃO DO LEAD:', prismaError);
      
      if (prismaError.code === 'P2002') {
        // Erro de restrição única - mostrar mais detalhes e tentar uma última estratégia
        const target = prismaError.meta?.target;
        console.error(`VIOLAÇÃO DE RESTRIÇÃO ÚNICA: ${JSON.stringify(target)}`);
        console.error(`Detalhes do erro: ${JSON.stringify(prismaError, null, 2)}`);
        
        // Último recurso: telefone com timestamp único
        const finalUniquePhone = `${phoneToUse}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        try {
          console.log(`Tentativa final com telefone: ${finalUniquePhone}`);
          
          // @ts-ignore - O modelo 'leads' existe no runtime mas não é reconhecido pelo TypeScript
          const lead = await prisma.leads.create({
            data: {
              phone: finalUniquePhone,
              name: data.name || null,
              photo: data.photo || null,
              workspaceId,
              stageId: data.stageId || undefined,
              value: data.value ? parseFloat(data.value) : undefined,
              ownerId: data.ownerId || undefined,
              source: data.origin || undefined,
              originId: data.originId || undefined,
              tags: tagsConnect,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            include: {
              tags: true
            }
          });
          
          console.log(`Lead criado com telefone final único: ${finalUniquePhone}`);
          
          const formattedLead = {
            ...lead,
            phone: phoneToUse, // Retornar o telefone original para o frontend
            labels: lead.tags.map((tag: any) => ({
              id: tag.id,
              name: tag.name,
              color: tag.color
            }))
          };
          
          return NextResponse.json(formattedLead, { status: 201 });
        } catch (finalError) {
          console.error('Falha na última tentativa:', finalError);
          return NextResponse.json(
            { error: "Erro ao criar lead: número de telefone já existe e não foi possível criar com alterações." },
            { status: 400 }
          );
        }
      }
      
      throw prismaError;
    }
  } catch (error) {
    console.error('Erro detalhado ao criar lead:', error);
    
    if ((error as any).code === 'P2002') {
      const target = (error as any).meta?.target || [];
      console.error(`VIOLAÇÃO DE RESTRIÇÃO ÚNICA: ${JSON.stringify(target)}`);
      console.error(`Detalhes do erro: ${JSON.stringify(error, null, 2)}`);
      return NextResponse.json(
        { error: `Este lead já existe (violação de restrição única)` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Erro ao criar/atualizar lead: " + (error as Error).message },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getWorkspaceFromContext } from '@/lib/utils/workspace';
import { getSupabaseClient } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { headers } from 'next/headers';

// Criar uma instância direta do PrismaClient para garantir que está disponível
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// GET - Buscar foto do lead
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = await headers();
    const workspaceId = headersList.get('x-workspace-id');
    const { id } = await Promise.resolve(params);
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace não encontrado no contexto' },
        { status: 400 }
      );
    }
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do lead não fornecido' },
        { status: 400 }
      );
    }

    // Verificar se o lead existe e pertence ao workspace
    // @ts-ignore - O modelo 'leads' existe no runtime mas não é reconhecido pelo TypeScript
    const lead = await prisma.leads.findFirst({
      where: { 
        id,
        workspaceId
      },
      select: {
        photo: true
      }
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead não encontrado neste workspace' },
        { status: 404 }
      );
    }

    if (!lead.photo) {
      return NextResponse.json(
        { error: 'Este lead não possui foto' },
        { status: 404 }
      );
    }

    // Redirecionar para a URL da foto
    return NextResponse.redirect(lead.photo);
  } catch (error) {
    console.error('Erro ao buscar foto do lead:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar foto do lead' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = await headers();
    const workspaceId = headersList.get('x-workspace-id');
    const { id: leadId } = await Promise.resolve(params);
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace não encontrado no contexto' },
        { status: 400 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('photo') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhuma foto foi enviada' },
        { status: 400 }
      );
    }

    // Verificar se o lead existe e pertence ao workspace
    // @ts-ignore - O modelo 'leads' existe no runtime mas não é reconhecido pelo TypeScript
    const lead = await prisma.leads.findFirst({
      where: { 
        id: leadId,
        workspaceId
      }
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead não encontrado neste workspace' },
        { status: 404 }
      );
    }

    // Obter o cliente do Supabase
    const supabase = getSupabaseClient();
    
    // Gerar um nome único para o arquivo
    const fileName = `${workspaceId}/${leadId}/${uuidv4()}-${file.name}`;
    
    // Converter o arquivo para um buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Fazer upload para o bucket 'avatars' do Supabase
    const { data, error } = await supabase
      .storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });
    
    if (error) {
      console.error('Erro ao fazer upload para o Supabase:', error);
      return NextResponse.json(
        { error: 'Erro ao fazer upload da imagem para o Supabase' },
        { status: 500 }
      );
    }
    
    // Obter a URL pública da imagem
    const { data: urlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    const publicUrl = urlData.publicUrl;
    
    // Atualizar o lead com a URL da foto
    // @ts-ignore - O modelo 'leads' existe no runtime mas não é reconhecido pelo TypeScript
    await prisma.leads.update({
      where: { id: leadId },
      data: { photo: publicUrl },
    });

    // Revalidar o cache da página de leads
    revalidatePath('/crm/leads');

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Erro ao fazer upload da foto:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o upload da foto', details: (error as Error).message },
      { status: 500 }
    );
  }
} 
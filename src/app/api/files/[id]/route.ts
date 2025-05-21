import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Aguardar resolução do objeto params por completo
    const params = await context.params;
    const fileId = params.id;
    
    console.log(`🗑️ Solicitação para excluir arquivo: ${fileId}`);
    
    // Primeiro, buscar o arquivo no banco de dados
    const file = await prisma.file.findFirst({
      where: { fileId: fileId }
    });

    // Obter o cliente OpenAI
    const openai = await getOpenAIClient();
    if (!openai) {
      console.error('❌ Cliente OpenAI não configurado');
      return NextResponse.json(
        { error: 'Cliente OpenAI não configurado' },
        { status: 500 }
      );
    }
    
    let openaiDeleted = false;
    let dbDeleted = false;

    // Excluir o arquivo da OpenAI
    try {
      await openai.files.del(fileId);
      console.log(`✅ Arquivo excluído da OpenAI: ${fileId}`);
      openaiDeleted = true;
    } catch (error: any) {
      console.error('❌ Erro ao excluir arquivo da OpenAI:', error);
      // Se o erro for 404, consideramos como "excluído" pois já não existe
      if (error.status === 404) {
        openaiDeleted = true;
        console.log('ℹ️ Arquivo já não existe na OpenAI');
      } else {
        return NextResponse.json(
          { 
            error: 'Erro ao excluir arquivo da OpenAI',
            details: error.message
          },
          { status: 500 }
        );
      }
    }
    
    // Se o arquivo existe no banco, excluir
    if (file) {
      try {
        await prisma.file.delete({
          where: { id: file.id }
        });
        console.log(`✅ Arquivo excluído do banco de dados: ${file.id} (fileId: ${fileId})`);
        dbDeleted = true;
      } catch (dbError) {
        console.error('❌ Erro ao excluir do banco:', dbError);
        // Se já excluímos da OpenAI, informamos parcialmente sucesso
        if (openaiDeleted) {
          return NextResponse.json({ 
            success: true,
            warning: 'Arquivo excluído da OpenAI mas falhou ao excluir do banco de dados',
            details: dbError instanceof Error ? dbError.message : 'Erro desconhecido'
          });
        }
        throw dbError;
      }
    } else {
      console.log('ℹ️ Arquivo não encontrado no banco de dados - ignorando exclusão do banco');
      dbDeleted = true; // Consideramos como "excluído" pois não existia
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Arquivo excluído com sucesso',
      details: {
        openaiDeleted,
        dbDeleted,
        fileId,
        dbId: file?.id
      }
    });
  } catch (error) {
    console.error('❌ Erro ao excluir arquivo:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao excluir arquivo',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    console.log('Tentando excluir conexão:', id);

    // Verificar se a conexão existe
    const connection = await prisma.whatsapp_cloud_connections.findUnique({
      where: { id }
    });

    if (!connection) {
      console.error('Conexão não encontrada:', id);
      return NextResponse.json(
        { error: 'Conexão não encontrada' },
        { status: 404 }
      );
    }

    // Excluir a conexão
    await prisma.whatsapp_cloud_connections.delete({
      where: { id }
    });

    console.log('Conexão excluída com sucesso:', id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao excluir conexão:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir conexão' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { status } = data;

    console.log('Tentando atualizar conexão:', { id, status });

    if (!status || !['active', 'inactive'].includes(status)) {
      console.error('Status inválido:', status);
      return NextResponse.json(
        { error: 'Status inválido. Use "active" ou "inactive"' },
        { status: 400 }
      );
    }

    // Verificar se a conexão existe
    const connection = await prisma.whatsapp_cloud_connections.findUnique({
      where: { id }
    });

    if (!connection) {
      console.error('Conexão não encontrada:', id);
      return NextResponse.json(
        { error: 'Conexão não encontrada' },
        { status: 404 }
      );
    }

    // Atualizar o status da conexão
    const updatedConnection = await prisma.whatsapp_cloud_connections.update({
      where: { id },
      data: { status }
    });

    console.log('Conexão atualizada com sucesso:', updatedConnection);
    return NextResponse.json(updatedConnection);
  } catch (error) {
    console.error('Erro ao atualizar conexão:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar conexão' },
      { status: 500 }
    );
  }
} 
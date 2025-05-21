import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteAgent() {
  try {
    await prisma.agent.delete({
      where: {
        id: 'AG001002'
      }
    })
    console.log('Agente excluído com sucesso')
  } catch (error) {
    console.error('Erro ao excluir agente:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteAgent() 
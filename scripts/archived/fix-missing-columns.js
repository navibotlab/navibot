const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixMissingColumns() {
  try {
    console.log('Adicionando colunas faltantes...')
    
    // Adicionar coluna vectorStoreId
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "agents" ADD COLUMN "vectorStoreId" TEXT`)
      console.log('Coluna vectorStoreId adicionada com sucesso!')
    } catch (error) {
      console.error('Erro ao adicionar coluna vectorStoreId:', error)
    }
    
    // Verificar estrutura final da tabela
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'agents'
      ORDER BY ordinal_position
    `
    
    console.log('\nEstrutura final da tabela agents:')
    columns.forEach(column => {
      console.log(`- ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })
    
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixMissingColumns() 
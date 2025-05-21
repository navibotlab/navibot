const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addChannelToConversationsTable() {
  try {
    console.log('Verificando se a coluna channel já existe na tabela conversations...')
    
    // Verificar se a coluna channel já existe
    const columnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversations' 
        AND column_name = 'channel'
      )
    `
    
    if (columnExists[0].exists) {
      console.log('A coluna channel já existe na tabela conversations!')
      return
    }
    
    console.log('Adicionando a coluna channel à tabela conversations...')
    
    // Adicionar a coluna channel com valor padrão 'whatsapp-cloud' para compatibilidade
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "conversations" 
      ADD COLUMN "channel" TEXT DEFAULT 'whatsapp-cloud'
    `)
    
    console.log('Coluna channel adicionada com sucesso!')
    
    // Verificar a estrutura atualizada da tabela
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'conversations'
      ORDER BY ordinal_position
    `
    
    console.log('\nEstrutura atualizada da tabela conversations:')
    columns.forEach(column => {
      console.log(`- ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })
    
  } catch (error) {
    console.error('Erro ao adicionar coluna channel:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar a função
addChannelToConversationsTable() 
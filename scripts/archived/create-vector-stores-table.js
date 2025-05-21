const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createVectorStoresTable() {
  try {
    console.log('Verificando se a tabela vector_stores existe...')
    
    // Verificar se a tabela vector_stores existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'vector_stores'
      )
    `
    
    if (tableExists[0].exists) {
      console.log('A tabela vector_stores já existe!')
      return
    }
    
    console.log('Criando a tabela vector_stores...')
    
    // Criar a tabela vector_stores
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "vector_stores" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "openaiId" TEXT NOT NULL,
        "files" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT "vector_stores_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "vector_stores_openaiId_key" UNIQUE ("openaiId")
      )
    `)
    
    console.log('Tabela vector_stores criada com sucesso!')
    
    // Adicionar a foreign key na tabela agents
    console.log('Verificando se a coluna vectorStoreId existe na tabela agents...')
    const columnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
        AND column_name = 'vectorStoreId'
      )
    `
    
    if (!columnExists[0].exists) {
      console.log('Adicionando coluna vectorStoreId à tabela agents...')
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "agents" ADD COLUMN "vectorStoreId" TEXT REFERENCES "vector_stores"("id") ON DELETE SET NULL
      `)
      console.log('Coluna vectorStoreId adicionada com sucesso!')
    } else {
      console.log('A coluna vectorStoreId já existe na tabela agents')
    }
    
  } catch (error) {
    console.error('Erro ao criar tabela vector_stores:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createVectorStoresTable() 
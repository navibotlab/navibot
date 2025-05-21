const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createDisparaJaTable() {
  try {
    console.log('Verificando se a tabela dispara_ja_connections existe...')
    
    // Verificar se a tabela dispara_ja_connections existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dispara_ja_connections'
      )
    `
    
    if (tableExists[0].exists) {
      console.log('A tabela dispara_ja_connections já existe!')
      return
    }
    
    console.log('Criando a tabela dispara_ja_connections...')

    // Criar a tabela dispara_ja_connections
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "dispara_ja_connections" (
        "id" TEXT NOT NULL,
        "agentId" TEXT NOT NULL,
        "provider" TEXT NOT NULL DEFAULT 'DISPARA_JA',
        "secret" TEXT NOT NULL,
        "sid" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "phoneNumber" TEXT NOT NULL,
        "unique" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'ativo',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT "dispara_ja_connections_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "dispara_ja_connections_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `)
    
    console.log('Tabela dispara_ja_connections criada com sucesso!')

    // Também vamos verificar se precisamos criar a tabela de logs
    const logsTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dispara_ja_logs'
      )
    `
    
    if (!logsTableExists[0].exists) {
      console.log('Criando a tabela dispara_ja_logs...')
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "dispara_ja_logs" (
          "id" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "timestamp" TIMESTAMP(3) NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "dispara_ja_logs_pkey" PRIMARY KEY ("id")
        )
      `)
      
      console.log('Tabela dispara_ja_logs criada com sucesso!')
    }
    
  } catch (error) {
    console.error('Erro ao criar tabela dispara_ja_connections:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDisparaJaTable() 
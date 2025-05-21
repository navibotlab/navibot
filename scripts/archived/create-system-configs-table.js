const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createSystemConfigsTable() {
  try {
    console.log('Verificando se a tabela system_configs existe...')
    
    // Verificar se a tabela system_configs existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_configs'
      )
    `
    
    if (tableExists[0].exists) {
      console.log('A tabela system_configs já existe!')
      return
    }
    
    console.log('Criando a tabela system_configs...')
    
    // Criar a tabela system_configs
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "system_configs" (
        "id" TEXT NOT NULL,
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "description" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        
        CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "system_configs_key_key" UNIQUE ("key")
      )
    `)
    
    console.log('Tabela system_configs criada com sucesso!')
    
    // Inserir configuração da OpenAI, se necessário
    console.log('Inserindo configuração da OpenAI...')
    await prisma.$executeRawUnsafe(`
      INSERT INTO "system_configs" ("id", "key", "value", "description", "createdAt", "updatedAt")
      VALUES (
        'cuid_' || md5(random()::text || clock_timestamp()::text)::text,
        'openai_api_key',
        '',
        'Chave da API da OpenAI',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("key") DO NOTHING
    `)
    
    console.log('Configuração da OpenAI inserida com sucesso!')
    
  } catch (error) {
    console.error('Erro ao criar tabela system_configs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSystemConfigsTable() 
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDBConnection() {
  try {
    console.log('Verificando conexão com o banco de dados...')
    
    // Testar a conexão com o banco de dados
    const result = await prisma.$queryRaw`SELECT current_database(), current_schema()`
    console.log('Conexão bem-sucedida!')
    console.log('Banco de dados:', result[0].current_database)
    console.log('Schema:', result[0].current_schema)
    
    // Listar tabelas
    console.log('\nListando tabelas do banco de dados:')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    
    if (tables.length === 0) {
      console.log('Nenhuma tabela encontrada.')
    } else {
      tables.forEach(table => {
        console.log(`- ${table.table_name}`)
      })
    }
    
    // Verificar estrutura da tabela agents
    console.log('\nVerificando estrutura da tabela agents:')
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'agents'
      ORDER BY ordinal_position
    `
    
    if (columns.length === 0) {
      console.log('Tabela "agents" não encontrada ou sem colunas.')
    } else {
      columns.forEach(column => {
        console.log(`- ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
      })
    }
    
  } catch (error) {
    console.error('Erro ao verificar banco de dados:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDBConnection() 
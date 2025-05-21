const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDisparaJaLogsStructure() {
  try {
    console.log('Verificando a estrutura da tabela dispara_ja_logs...')
    
    // Consultar todas as colunas da tabela dispara_ja_logs
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'dispara_ja_logs'
    `
    
    console.log('Colunas da tabela dispara_ja_logs:')
    columns.forEach(column => {
      console.log(`- ${column.column_name} (${column.data_type})`)
    })
    
    // Verificar os registros existentes
    const logs = await prisma.disparaJaLog.findMany({
      take: 5
    })
    
    console.log('\nÚltimos registros de log:')
    logs.forEach(log => {
      console.log(JSON.stringify(log, null, 2))
    })
    
  } catch (error) {
    console.error('Erro ao verificar estrutura da tabela dispara_ja_logs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDisparaJaLogsStructure() 
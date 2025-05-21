const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDisparaJaTable() {
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
    
    console.log('A tabela dispara_ja_connections existe?', tableExists[0].exists ? 'Sim' : 'Não')
    
    if (tableExists[0].exists) {
      // Contar quantas conexões existem usando SQL raw para evitar erros de modelo
      const countResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "dispara_ja_connections"
      `
      const count = parseInt(countResult[0].count)
      console.log(`Total de conexões do Dispara Já: ${count}`)
      
      // Listar as conexões
      if (count > 0) {
        const connections = await prisma.$queryRaw`
          SELECT * FROM "dispara_ja_connections"
        `
        console.log('\nConexões do Dispara Já:')
        connections.forEach(conn => {
          console.log(`- ID: ${conn.id}, Agent: ${conn.agentId}, Status: ${conn.status}`)
        })
      }
      
      // Verificar a estrutura da tabela
      console.log('\nEstrutura da tabela dispara_ja_connections:')
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'dispara_ja_connections'
        ORDER BY ordinal_position
      `
      
      columns.forEach(column => {
        console.log(`- ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
      })
    } else {
      console.log('\nA tabela dispara_ja_connections não existe no banco de dados!')
    }

    // Verificar também a tabela de logs
    const logsTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dispara_ja_logs'
      )
    `
    
    console.log('\nA tabela dispara_ja_logs existe?', logsTableExists[0].exists ? 'Sim' : 'Não')
    
  } catch (error) {
    console.error('Erro ao verificar tabela dispara_ja_connections:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDisparaJaTable() 
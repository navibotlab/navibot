const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixAgentsTable() {
  try {
    console.log('Iniciando correção da tabela agents...')
    
    // Verificar se a tabela Agents existe (com A maiúsculo)
    const tablesQuery = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('agents', 'Agents')
    `
    
    const tableNames = tablesQuery.map(t => t.table_name.toLowerCase())
    console.log('Tabelas encontradas:', tableNames)
    
    // Adicionar colunas ausentes
    console.log('\nAdicionando colunas ausentes...')
    
    // Lista de colunas do esquema Prisma que precisamos garantir que existam
    const columns = [
      { name: 'internal_name', type: 'TEXT', nullable: true },
      { name: 'image_url', type: 'TEXT', nullable: true },
      { name: 'initial_message', type: 'TEXT', nullable: true },
      { name: 'voice_tone', type: 'TEXT', nullable: true },
      { name: 'model', type: 'TEXT', nullable: true },
      { name: 'language', type: 'TEXT', nullable: true },
      { name: 'timezone', type: 'TEXT', nullable: true },
      { name: 'assistant_id', type: 'TEXT', nullable: true },
      { name: 'company_name', type: 'TEXT', nullable: true },
      { name: 'company_sector', type: 'TEXT', nullable: true },
      { name: 'company_website', type: 'TEXT', nullable: true },
      { name: 'company_description', type: 'TEXT', nullable: true },
      { name: 'temperature', type: 'DOUBLE PRECISION', nullable: true },
      { name: 'frequency_penalty', type: 'DOUBLE PRECISION', nullable: true },
      { name: 'presence_penalty', type: 'DOUBLE PRECISION', nullable: true },
      { name: 'max_messages', type: 'INTEGER', nullable: true },
      { name: 'max_tokens', type: 'INTEGER', nullable: true },
      { name: 'response_format', type: 'TEXT', nullable: true },
      { name: 'personality_objective', type: 'TEXT', nullable: true },
      { name: 'agent_skills', type: 'TEXT', nullable: true },
      { name: 'agent_function', type: 'TEXT', nullable: true },
      { name: 'product_info', type: 'TEXT', nullable: true },
      { name: 'restrictions', type: 'TEXT', nullable: true },
      { name: 'vector_store_id', type: 'TEXT', nullable: true }
    ]
    
    // Para cada coluna, verificar se existe e adicionar se não existir
    for (const column of columns) {
      try {
        // Verificar se a coluna já existe
        const columnCheck = await prisma.$queryRaw`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'agents' AND column_name = ${column.name}
        `
        
        if (columnCheck.length === 0) {
          console.log(`Adicionando coluna ${column.name}...`)
          
          // Adicionar a coluna
          await prisma.$executeRaw`
            ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "${column.name}" ${prisma.raw(column.type)} ${column.nullable ? '' : 'NOT NULL'}
          `
          
          console.log(`Coluna ${column.name} adicionada com sucesso!`)
        } else {
          console.log(`Coluna ${column.name} já existe.`)
        }
      } catch (error) {
        console.error(`Erro ao adicionar coluna ${column.name}:`, error)
      }
    }
    
    console.log('\nCorreção concluída. Verificando estrutura final da tabela...')
    
    // Verificar novamente a estrutura da tabela
    const finalColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'agents'
      ORDER BY ordinal_position
    `
    
    console.log('Estrutura final da tabela agents:')
    finalColumns.forEach(column => {
      console.log(`- ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })
    
  } catch (error) {
    console.error('Erro ao corrigir tabela agents:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAgentsTable() 
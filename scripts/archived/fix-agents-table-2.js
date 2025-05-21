const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixAgentsTable() {
  try {
    console.log('Iniciando correção da tabela agents...')
    
    // Verificar se a tabela existe
    const tablesQuery = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'agents'
    `
    
    if (tablesQuery.length === 0) {
      console.log('ERRO: Tabela agents não encontrada!')
      return
    }
    
    console.log('Tabela agents encontrada, adicionando colunas...')
    
    // Adicionar colunas ausentes uma a uma
    // Usando $executeRawUnsafe porque não temos prisma.raw disponível
    
    const addColumn = async (columnName, dataType, isNullable) => {
      try {
        // Verificar se a coluna já existe
        const columnExists = await prisma.$queryRaw`
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = ${columnName}
        `
        
        if (columnExists.length > 0) {
          console.log(`Coluna ${columnName} já existe.`)
          return
        }
        
        console.log(`Adicionando coluna ${columnName}...`)
        
        const nullableText = isNullable ? '' : 'NOT NULL'
        // Usando $executeRawUnsafe porque precisamos concatenar strings SQL
        await prisma.$executeRawUnsafe(`ALTER TABLE "agents" ADD COLUMN "${columnName}" ${dataType} ${nullableText}`)
        
        console.log(`Coluna ${columnName} adicionada com sucesso!`)
      } catch (error) {
        console.error(`Erro ao adicionar coluna ${columnName}:`, error)
      }
    }
    
    // Adicionar todas as colunas necessárias
    await addColumn('internal_name', 'TEXT', true)
    await addColumn('image_url', 'TEXT', true)
    await addColumn('initial_message', 'TEXT', true)
    await addColumn('voice_tone', 'TEXT', true)
    await addColumn('model', 'TEXT', true)
    await addColumn('language', 'TEXT', true)
    await addColumn('timezone', 'TEXT', true)
    await addColumn('assistant_id', 'TEXT', true)
    await addColumn('company_name', 'TEXT', true)
    await addColumn('company_sector', 'TEXT', true)
    await addColumn('company_website', 'TEXT', true)
    await addColumn('company_description', 'TEXT', true)
    await addColumn('temperature', 'DOUBLE PRECISION', true)
    await addColumn('frequency_penalty', 'DOUBLE PRECISION', true)
    await addColumn('presence_penalty', 'DOUBLE PRECISION', true)
    await addColumn('max_messages', 'INTEGER', true)
    await addColumn('max_tokens', 'INTEGER', true)
    await addColumn('response_format', 'TEXT', true)
    await addColumn('personality_objective', 'TEXT', true)
    await addColumn('agent_skills', 'TEXT', true)
    await addColumn('agent_function', 'TEXT', true)
    await addColumn('product_info', 'TEXT', true)
    await addColumn('restrictions', 'TEXT', true)
    await addColumn('vector_store_id', 'TEXT', true)
    
    console.log('\nCorreção concluída. Verificando estrutura final da tabela...')
    
    // Verificar novamente a estrutura da tabela
    const finalColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'agents'
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
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createSampleAgentSafe() {
  try {
    console.log('Verificando existência de agentes...')
    
    // Verificar se já existem agentes
    const existingAgents = await prisma.agent.count()
    
    if (existingAgents > 0) {
      console.log(`Já existem ${existingAgents} agentes no banco de dados. Não é necessário criar agentes de exemplo.`)
      return
    }
    
    console.log('Nenhum agente encontrado. Criando agentes de exemplo...')
    
    // Usar executeRaw para ter maior controle sobre a inserção
    await prisma.$executeRawUnsafe(`
      INSERT INTO "agents" (
        "id", "name", "description", "system_prompt", "createdAt", "updatedAt",
        "internal_name", "image_url", "initial_message", "voice_tone", "model", 
        "language", "timezone", "assistant_id", "company_name"
      ) VALUES (
        'AG001001', 'Assistente de Vendas', 'Agente especializado em atendimento e vendas', 
        'Você é um assistente de vendas amigável e profissional.', 
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
        'sales_assistant', '/avatars/01.png', 'Olá! Como posso ajudá-lo hoje?',
        'Amigável e profissional', 'gpt-4o', 'Português', 'America/Sao_Paulo',
        'asst_example', 'Empresa Exemplo'
      )
    `)
    
    console.log('Primeiro agente de exemplo criado com sucesso!')
    
    // Criar um segundo agente
    await prisma.$executeRawUnsafe(`
      INSERT INTO "agents" (
        "id", "name", "description", "system_prompt", "createdAt", "updatedAt",
        "internal_name", "image_url", "initial_message", "voice_tone", "model", 
        "language", "timezone", "assistant_id", "company_name"
      ) VALUES (
        'AG001002', 'Suporte Técnico', 'Especialista em suporte técnico', 
        'Você é um especialista em suporte técnico.', 
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
        'tech_support', '/avatars/02.png', 'Olá! Em que posso ajudar com suporte técnico hoje?',
        'Profissional e claro', 'gpt-4o', 'Português', 'America/Sao_Paulo',
        'asst_example2', 'Empresa Exemplo'
      )
    `)
    
    console.log('Segundo agente de exemplo criado com sucesso!')
    
    // Verificar se os agentes foram criados
    const agents = await prisma.agent.findMany()
    console.log(`\nTotal de agentes após inserção: ${agents.length}`)
    agents.forEach(agent => {
      console.log(`- ${agent.name} (ID: ${agent.id})`)
    })
    
  } catch (error) {
    console.error('Erro ao criar agentes de exemplo:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleAgentSafe() 
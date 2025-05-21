const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAgents() {
  try {
    console.log('Verificando tabela de agentes...')
    
    // Verificar se a tabela de agentes existe através de uma consulta
    const agents = await prisma.agent.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`Total de agentes encontrados: ${agents.length}`)
    
    if (agents.length === 0) {
      console.log('Nenhum agente encontrado no banco de dados.')
    } else {
      console.log('Agentes encontrados:')
      agents.forEach(agent => {
        console.log(`- ${agent.name} (ID: ${agent.id})`)
      })
    }
    
    // Verificar a estrutura da tabela
    console.log('\nEstrutura da tabela:')
    const firstAgent = agents[0]
    if (firstAgent) {
      console.log(Object.keys(firstAgent))
    } else {
      console.log('Não foi possível verificar a estrutura (nenhum agente encontrado)')
    }
    
  } catch (error) {
    console.error('Erro ao verificar agentes:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAgents() 
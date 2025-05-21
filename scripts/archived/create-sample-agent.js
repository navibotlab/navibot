const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createSampleAgent() {
  try {
    console.log('Criando agente de exemplo...')
    
    // Verificar se já existem agentes
    const existingAgents = await prisma.agent.count()
    
    if (existingAgents > 0) {
      console.log(`Já existem ${existingAgents} agentes no banco de dados. Não é necessário criar agentes de exemplo.`)
      return
    }
    
    // Criar agente de exemplo
    const sampleAgent = await prisma.agent.create({
      data: {
        name: "Assistente de Vendas",
        description: "Agente especializado em atendimento e vendas",
        internalName: "sales_assistant",
        imageUrl: "/avatars/01.png",
        initialMessage: "Olá! Como posso ajudá-lo hoje?",
        voiceTone: "Amigável e profissional",
        model: "gpt-4o",
        language: "Português",
        timezone: "America/Sao_Paulo",
        systemPrompt: "Você é um assistente de vendas amigável e profissional. Seu objetivo é ajudar os clientes a encontrar os produtos certos para suas necessidades.",
        assistantId: "asst_example",
        companyName: "Empresa Exemplo",
        companySector: "Tecnologia",
        companyWebsite: "https://exemplo.com",
        companyDescription: "Empresa especializada em soluções tecnológicas",
        temperature: 0.7,
        frequencyPenalty: 0.5,
        presencePenalty: 0.5,
        maxMessages: 100,
        maxTokens: 4000,
        responseFormat: "text",
        personalityObjective: "Ser prestativo, amigável e fornecer informações precisas sobre produtos",
        agentSkills: "Conhecimento de produtos, atendimento ao cliente, resolução de problemas",
        agentFunction: "Assistente de vendas online",
        productInfo: "Suporte a todos os produtos da empresa",
        restrictions: "Não pode fazer promessas de preços ou prazos específicos sem confirmação"
      }
    })
    
    console.log('Agente de exemplo criado com sucesso:', sampleAgent)
    
    // Criar um segundo agente de exemplo
    const sampleAgent2 = await prisma.agent.create({
      data: {
        name: "Suporte Técnico",
        description: "Especialista em suporte técnico e resolução de problemas",
        internalName: "tech_support",
        imageUrl: "/avatars/02.png",
        initialMessage: "Olá! Em que posso ajudar com suporte técnico hoje?",
        voiceTone: "Profissional e claro",
        model: "gpt-4o",
        language: "Português",
        timezone: "America/Sao_Paulo",
        systemPrompt: "Você é um especialista em suporte técnico. Seu objetivo é ajudar os clientes a resolver problemas técnicos com nossos produtos.",
        assistantId: "asst_example2",
        companyName: "Empresa Exemplo",
        companySector: "Tecnologia",
        companyWebsite: "https://exemplo.com",
        companyDescription: "Empresa especializada em soluções tecnológicas",
        temperature: 0.5,
        frequencyPenalty: 0.3,
        presencePenalty: 0.3,
        maxMessages: 100,
        maxTokens: 4000,
        responseFormat: "text",
        personalityObjective: "Ser objetivo, claro e eficiente na resolução de problemas técnicos",
        agentSkills: "Resolução de problemas, conhecimento técnico, análise de erros",
        agentFunction: "Suporte técnico",
        productInfo: "Suporte a todos os produtos técnicos da empresa",
        restrictions: "Não pode fazer promessas de tempo de resolução sem análise detalhada"
      }
    })
    
    console.log('Segundo agente de exemplo criado com sucesso:', sampleAgent2)
    
  } catch (error) {
    console.error('Erro ao criar agente de exemplo:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleAgent() 
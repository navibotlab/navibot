const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createSampleVectorStore() {
  try {
    console.log('Verificando se já existem vector stores...')
    
    // Verificar se já existe algum vector store
    const existingStores = await prisma.vectorStore.count()
    
    if (existingStores > 0) {
      console.log(`Já existem ${existingStores} vector stores no banco de dados.`)
      console.log('Vector stores existentes:')
      
      const stores = await prisma.vectorStore.findMany()
      stores.forEach(store => {
        console.log(`- ${store.name} (ID: ${store.id}, OpenAI ID: ${store.openaiId})`)
      })
      
      return
    }
    
    console.log('Criando vector store de exemplo...')
    
    // Criar um vector store de exemplo
    const sampleStore = await prisma.vectorStore.create({
      data: {
        id: 'vs_sample001',
        name: 'Base de Conhecimento Exemplo',
        description: 'Um armazenamento de vetores de exemplo para testes',
        openaiId: 'vs_sample_openai_001', // Normalmente seria um ID real da OpenAI
        files: { fileIds: [] }, // Array vazio de IDs de arquivos
        updatedAt: new Date()
      }
    })
    
    console.log('Vector store de exemplo criado com sucesso:', sampleStore)
    
  } catch (error) {
    console.error('Erro ao criar vector store de exemplo:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleVectorStore() 
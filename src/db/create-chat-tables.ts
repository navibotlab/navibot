import { prisma } from '@/lib/prisma';

async function createChatTables() {
  try {
    // Criar tabela de conversas
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          lead_id UUID NOT NULL REFERENCES leads(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Criar tabela de mensagens
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES conversations(id),
          content TEXT NOT NULL,
          sender VARCHAR(255) DEFAULT 'agent',
          read BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Criar índices
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations(lead_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)`;

    console.log('Tabelas de chat criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
  }
}

createChatTables(); 
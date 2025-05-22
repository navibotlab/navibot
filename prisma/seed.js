const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
  console.log('Iniciando seed...');

  try {
    // Verificar primeiro se o modelo plans existe
    const models = Object.keys(prisma);
    console.log('Modelos disponíveis:', models);
    
    if (!models.includes('plans')) {
      console.error('O modelo "plans" não está disponível no cliente Prisma');
      
      // Inserir diretamente usando executeRaw para contornar o problema
      await prisma.$executeRaw`
        INSERT INTO plans (id, name, description, price, "isActive", "createdAt", "updatedAt")
        VALUES ('plan_free', 'Plano Gratuito', 'Plano gratuito para novos usuários', 0, true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `;
      
      console.log('Plano gratuito inserido com sucesso via SQL raw');
      return;
    }
    
    // Verificar se já existe um plano gratuito
    const existingFreePlan = await prisma.plans.findFirst({
      where: {
        price: 0,
        isActive: true
      }
    });

    if (!existingFreePlan) {
      // Criar plano gratuito
      const freePlan = await prisma.plans.create({
        data: {
          id: 'plan_free',
          name: 'Plano Gratuito',
          description: 'Plano gratuito para novos usuários',
          price: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('Plano gratuito criado com sucesso:', freePlan);
    } else {
      console.log('Plano gratuito já existe:', existingFreePlan);
    }

    console.log('Seed concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')
const prisma = new PrismaClient()

async function createMultipleUsers() {
  try {
    // Array com dados dos 5 usuários a serem criados
    const usersToCreate = [
      {
        email: 'navibotautomacoes01@gmail.com',
        name: 'Priscilla Diniz',
        password: 'Navibotteste@beta01'
      },
      {
        email: 'navibotautomacoes02@gmail.com',
        name: 'Ana Cathalani',
        password: 'Navibotteste@beta02'
      },
      {
        email: 'navibotautomacoes03@gmail.com',
        name: 'Lucas Apulcro',
        password: 'Navibotteste@beta03'
      },
      {
        email: 'navibotautomacoes04@gmail.com',
        name: 'Junior Serejo',
        password: 'Navibotteste@beta04'
      },
      {
        email: 'navibotautomacoes05@gmail.com',
        name: 'Rapahel Andrad',
        password: 'Navibotteste@beta05'
      }
    ];

    // Permissões padrão para os usuários
    const userPermissions = {
      users: {
        view: true,
        create: true,
        update: true,
        delete: true,
        manage: true
      },
      leads: {
        view: true,
        create: true,
        update: true,
        delete: true
      },
      conversations: {
        view: true,
        reply: true,
        delete: true
      },
      agents: {
        view: true,
        create: true,
        update: true,
        delete: true
      },
      settings: {
        view: true,
        update: true
      },
      billing: {
        view: true,
        update: true
      }
    }

    // Criar cada usuário com seu próprio workspace
    for (const userData of usersToCreate) {
      // Verificar se o usuário já existe
      const existingUser = await prisma.users.findUnique({
        where: { email: userData.email }
      })

      if (existingUser) {
        console.log(`Usuário ${userData.email} já existe! Atualizando nome...`)
        
        // Atualizar apenas o nome do usuário existente
        await prisma.users.update({
          where: { email: userData.email },
          data: { 
            name: userData.name,
            updatedAt: new Date()
          }
        })
        
        console.log(`Nome do usuário ${userData.email} atualizado para: ${userData.name}`)
        continue
      }

      // Criar um workspace exclusivo para o usuário
      const workspaceId = uuidv4();
      const workspace = await prisma.workspaces.create({
        data: {
          id: workspaceId,
          name: `Workspace ${userData.name}`,
          subdomain: `navibot-${userData.name.toLowerCase().replace(/\s+/g, '-')}`,
          updatedAt: new Date()
        }
      })
      
      console.log(`Workspace criado para ${userData.name}:`, workspace.id)

      // Criptografar a senha
      const hashedPassword = await bcrypt.hash(userData.password, 10)

      // Gerar ID único para o usuário
      const userId = uuidv4()

      // Criar o usuário
      const user = await prisma.users.create({
        data: {
          id: userId,
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: 'owner', // Mudando para owner já que cada um terá seu próprio workspace
          workspaceId: workspace.id,
          status: 'active',
          updatedAt: new Date(),
          permissions: userPermissions
        }
      })

      console.log(`Usuário ${userData.name} criado com sucesso:`)
      console.log({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        workspaceId: user.workspaceId
      })
    }

    console.log('Criação de usuários concluída!')

  } catch (error) {
    console.error('Erro ao criar usuários:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar a função
createMultipleUsers() 
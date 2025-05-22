const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')
const prisma = new PrismaClient()

async function createOwnerUser() {
  try {
    // Definir dados do usuário
    const userData = {
      email: 'navibotautomacoes@gmail.com',
      name: 'Ivan Nogueira',
      password: 'Rafaelamota@2022'
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.users.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      console.log('Usuário já existe! Detalhes:')
      console.log({
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
        workspaceId: existingUser.workspaceId,
        status: existingUser.status
      })
      return
    }

    // Verificar se existe pelo menos um workspace
    let workspace = await prisma.workspaces.findFirst({
      orderBy: { createdAt: 'asc' }
    })

    if (!workspace) {
      console.log('Nenhum workspace encontrado! Criando um novo workspace...')
      
      // Criar um workspace para o usuário
      workspace = await prisma.workspaces.create({
        data: {
          id: uuidv4(),
          name: 'NaviBot Workspace',
          subdomain: 'navibot',
          updatedAt: new Date()
        }
      })
      
      console.log('Workspace criado com sucesso:', workspace.id)
    } else {
      console.log('Usando workspace existente:', workspace.id)
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // Gerar ID único para o usuário
    const userId = uuidv4()

    // Criar o usuário com role owner
    const user = await prisma.users.create({
      data: {
        id: userId,
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: 'owner',
        workspaceId: workspace.id,
        status: 'active', // Já está ativo, sem necessidade de verificação
        updatedAt: new Date()
      }
    })

    console.log('Usuário owner criado com sucesso:')
    console.log({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      workspaceId: user.workspaceId
    })

    // Adicionar permissões padrão para owner
    // Estas são baseadas nas permissões que vimos no código
    const ownerPermissions = {
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

    // Atualizar o usuário com as permissões de owner
    await prisma.users.update({
      where: { id: userId },
      data: {
        permissions: ownerPermissions
      }
    })

    console.log('Permissões de owner adicionadas com sucesso')
    console.log('Dados de acesso:')
    console.log('Email:', userData.email)
    console.log('Senha:', userData.password)
    console.log('Role:', 'owner')

  } catch (error) {
    console.error('Erro ao criar usuário owner:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar a função
createOwnerUser() 
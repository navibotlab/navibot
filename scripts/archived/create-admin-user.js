const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    // Verificar se o usuário já existe
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: 'ivancnogueira@gmail.com' }
    })

    if (existingAdmin) {
      console.log('O usuário administrador já existe!')
      return
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash('Rafaelamota@2022', 10)

    // Criar o usuário administrador
    const admin = await prisma.adminUser.create({
      data: {
        email: 'ivancnogueira@gmail.com',
        name: 'Ivan Nogueira',
        password: hashedPassword,
        role: 'admin'
      }
    })

    console.log('Usuário administrador criado com sucesso:')
    console.log({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    })
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser() 
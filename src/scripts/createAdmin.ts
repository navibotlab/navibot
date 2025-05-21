import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Verificar se o usuário já existe
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: 'ivancnogueira@gmail.com' }
    })

    if (existingAdmin) {
      console.log('Usuário administrador já existe.')
      return
    }

    // Hash da senha
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash('Rafaelamota@2022', saltRounds)

    // Criar o usuário administrador
    const admin = await prisma.adminUser.create({
      data: {
        email: 'ivancnogueira@gmail.com',
        name: 'Ivan Nogueira',
        password: hashedPassword,
        role: 'super_admin'
      }
    })

    console.log('Usuário administrador criado com sucesso:', admin.email)
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin() 
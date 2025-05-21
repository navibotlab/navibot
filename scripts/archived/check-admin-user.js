const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAdminUser() {
  try {
    // Buscar por um usuário específico pelo email
    const admin = await prisma.adminUser.findUnique({
      where: { email: 'ivancnogueira@gmail.com' }
    })

    if (admin) {
      console.log('Usuário encontrado:')
      console.log({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        createdAt: admin.createdAt
      })
    } else {
      console.log('Usuário não encontrado!')
      
      // Listar todos os usuários admin
      console.log('\nLista de todos os administradores:')
      const admins = await prisma.adminUser.findMany()
      
      if (admins.length === 0) {
        console.log('Nenhum administrador cadastrado.')
      } else {
        admins.forEach(admin => {
          console.log(`- ${admin.email} (${admin.name})`)
        })
      }
    }
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdminUser() 
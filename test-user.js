const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function findUser() {
  try {
    const users = await prisma.persons.findMany({
      where: {
        full_name: {
          contains: 'Wanderley Pinheiro',
          mode: 'insensitive'
        }
      },
      include: {
        user_accounts: true
      }
    })
    console.log('Usuários encontrados:', JSON.stringify(users, null, 2))
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findUser()

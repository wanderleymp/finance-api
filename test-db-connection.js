const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testDatabaseConnection() {
  try {
    console.log('Tentando conectar ao banco de dados...')
    const result = await prisma.persons.findMany({
      take: 1
    })
    console.log('Conexão bem-sucedida!')
    console.log('Primeiro registro:', result)
  } catch (error) {
    console.error('Erro na conexão:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseConnection()

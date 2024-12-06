const PrismaInstallmentRepository = require('./src/repositories/implementations/PrismaInstallmentRepository')

async function testInstallmentsRepository() {
  const repository = new PrismaInstallmentRepository()
  
  try {
    console.log('Iniciando busca de parcelas...')
    const result = await repository.findAll()
    console.log('Resultado:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('Erro completo:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details,
      sqlState: error.sqlState,
      meta: error.meta
    })
  }
}

testInstallmentsRepository()

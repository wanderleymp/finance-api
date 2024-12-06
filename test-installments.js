const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
})

async function testInstallments() {
  try {
    console.log('Iniciando busca de parcelas...')
    
    const query = `
      SELECT 
        m.movement_id,
        m.movement_date,
        m.movement_type_id,
        i.installment_id,
        i.due_date,
        i.balance,
        p.full_name,
        p.fantasy_name,
        i.installment_number,
        i.amount,
        i.status
      FROM installments i
      JOIN movement_payments mp ON i.payment_id = mp.payment_id
      JOIN movements m ON mp.movement_id = m.movement_id
      JOIN persons p ON m.person_id = p.person_id
      WHERE m.movement_status_id = 23
      ORDER BY i.due_date DESC
      LIMIT 5
    `
    
    console.log('Query a ser executada:\n', query)

    const result = await prisma.$queryRaw`
      SELECT 
        m.movement_id,
        m.movement_date,
        m.movement_type_id,
        i.installment_id,
        i.due_date,
        i.balance,
        p.full_name,
        p.fantasy_name,
        i.installment_number,
        i.amount,
        i.status
      FROM installments i
      JOIN movement_payments mp ON i.payment_id = mp.payment_id
      JOIN movements m ON mp.movement_id = m.movement_id
      JOIN persons p ON m.person_id = p.person_id
      WHERE m.movement_status_id = 23
      ORDER BY i.due_date DESC
      LIMIT 5
    `
    
    console.log('Total de parcelas encontradas:', result.length)
    console.log('Detalhes das parcelas:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('Erro detalhado:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details
    })
  } finally {
    await prisma.$disconnect()
  }
}

testInstallments()

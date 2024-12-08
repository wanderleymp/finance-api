const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class BoletoIntegrationService {
  /**
   * Gera boleto para um movimento específico
   * @param {number} movementId 
   * @returns {Promise<Object>} Boleto gerado
   */
  static async generateBoleto(movementId) {
    // Busca o movimento
    const movement = await prisma.movements.findUnique({
      where: { movement_id: movementId },
      include: {
        movement_payments: {
          include: {
            payment_methods: true
          }
        },
        persons: true
      }
    });

    if (!movement) {
      throw new Error(`Movimento ${movementId} não encontrado`);
    }

    // Lógica de geração de boleto (mock para teste)
    const boletoData = {
      movement_id: movementId,
      boleto_number: `BOLETO-${movementId}-${Date.now()}`,
      boleto_url: `https://exemplo.com/boleto/${movementId}`,
      amount: movement.total_amount,
      due_date: new Date(new Date().setDate(new Date().getDate() + 15)),
      person_id: movement.person_id
    };

    // Salva boleto no banco
    return prisma.boletos.create({
      data: boletoData
    });
  }
}

module.exports = BoletoIntegrationService;

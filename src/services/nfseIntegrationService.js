const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NfseIntegrationService {
  /**
   * Gera NFSe para um movimento específico
   * @param {number} movementId 
   * @returns {Promise<Object>} NFSe gerada
   */
  static async generateNfse(movementId) {
    // Busca o movimento
    const movement = await prisma.movements.findUnique({
      where: { movement_id: movementId },
      include: {
        persons: true,
        movement_items: {
          include: {
            items: true
          }
        }
      }
    });

    if (!movement) {
      throw new Error(`Movimento ${movementId} não encontrado`);
    }

    // Verifica se já existe NFSe
    const existingNfse = await prisma.nfse.findFirst({
      where: { movement_id: movementId }
    });

    if (existingNfse) {
      return existingNfse;
    }

    // Lógica de geração de NFSe (mock para teste)
    const nfseData = {
      movement_id: movementId,
      integration_nfse_id: `NFSE-${movementId}-${Date.now()}`,
      access_key: this.generateAccessKey(),
      pdf_url: `https://exemplo.com/nfse/${movementId}.pdf`,
      xml_url: `https://exemplo.com/nfse/${movementId}.xml`,
      total_value: movement.total_amount,
      issue_date: new Date()
    };

    // Salva NFSe no banco
    return prisma.nfse.create({
      data: nfseData
    });
  }

  /**
   * Gera uma chave de acesso fictícia para NFSe
   * @returns {string}
   */
  static generateAccessKey() {
    const randomPart = () => Math.random().toString(36).substring(2, 15);
    return `NFSe-${randomPart()}-${randomPart()}`.toUpperCase();
  }
}

module.exports = NfseIntegrationService;

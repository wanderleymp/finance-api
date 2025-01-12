const IBaseRepository = require('../../../repositories/base/IBaseRepository');

class INfseRepository extends IBaseRepository {
    /**
     * Busca NFSes por ID de invoice
     * @param {number} invoiceId - ID da invoice
     * @returns {Promise<Array>} Lista de NFSes
     */
    async findByInvoiceId(invoiceId) {
        throw new Error('Método findByInvoiceId deve ser implementado');
    }

    /**
     * Busca NFSes por ID de integração
     * @param {string} integrationNfseId - ID de integração da NFSE
     * @param {Object} options - Opções de busca
     * @returns {Promise<Array>} Lista de NFSes
     */
    async findByIntegrationId(integrationNfseId, options = {}) {
        throw new Error('Método findByIntegrationId deve ser implementado');
    }
}

module.exports = INfseRepository;

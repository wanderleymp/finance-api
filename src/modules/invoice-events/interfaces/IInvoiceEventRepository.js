const IBaseRepository = require('../../../repositories/base/IBaseRepository');

class IInvoiceEventRepository extends IBaseRepository {
    /**
     * Busca eventos por ID de invoice
     * @param {number} invoiceId - ID da invoice
     * @returns {Promise<Array>} Lista de eventos
     */
    async findByInvoiceId(invoiceId) {
        throw new Error('Método findByInvoiceId deve ser implementado');
    }

    /**
     * Busca eventos por tipo de evento
     * @param {string} eventType - Tipo do evento
     * @param {Object} options - Opções de busca
     * @returns {Promise<Array>} Lista de eventos
     */
    async findByEventType(eventType, options = {}) {
        throw new Error('Método findByEventType deve ser implementado');
    }
}

module.exports = IInvoiceEventRepository;

const IBaseRepository = require('../../../repositories/base/IBaseRepository');

/**
 * Interface para o repositório de faturas
 * @interface
 * @extends {IBaseRepository}
 */
class IInvoiceRepository extends IBaseRepository {
    /**
     * Busca faturas por referência
     * @param {string} referenceId - ID de referência da fatura
     * @returns {Promise<Array>} Lista de faturas
     */
    async findByReferenceId(referenceId) {
        throw new Error('Método não implementado');
    }

    /**
     * Busca faturas por status
     * @param {string} status - Status da fatura
     * @param {Object} options - Opções de busca
     * @returns {Promise<Array>} Lista de faturas
     */
    async findByStatus(status, options = {}) {
        throw new Error('Método não implementado');
    }
}

module.exports = IInvoiceRepository;

/**
 * Interface para o serviço de integrações
 */
class IIntegrationService {
    /**
     * Envia dados para integração
     * @param {string} integration - Nome da integração
     * @param {Object} data - Dados a serem enviados
     */
    async send(integration, data) {
        throw new Error('Method not implemented');
    }

    /**
     * Recebe dados da integração
     * @param {string} integration - Nome da integração
     * @param {Object} params - Parâmetros para recebimento
     */
    async receive(integration, params) {
        throw new Error('Method not implemented');
    }

    /**
     * Verifica status da integração
     * @param {string} integration - Nome da integração
     * @param {string} transactionId - ID da transação
     */
    async checkStatus(integration, transactionId) {
        throw new Error('Method not implemented');
    }

    /**
     * Cancela uma transação na integração
     * @param {string} integration - Nome da integração
     * @param {string} transactionId - ID da transação
     */
    async cancel(integration, transactionId) {
        throw new Error('Method not implemented');
    }
}

module.exports = IIntegrationService;

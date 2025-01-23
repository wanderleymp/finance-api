const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');
const INfseRepository = require('./interfaces/INfseRepository');
const { DatabaseError } = require('../../utils/errors');

class NfseRepository extends BaseRepository {
    constructor() {
        super('nfse', 'nfse_id');
    }

    /**
     * Busca uma NFSe por ID incluindo relacionamentos
     * @param {number} id - ID da NFSe
     * @returns {Promise<Object>} NFSe encontrada com dados da invoice
     */
    async findById(id) {
        try {
            const query = `
                SELECT 
                    n.nfse_id,
                    n.invoice_id,
                    n.integration_nfse_id,
                    n.service_value,
                    n.iss_value,
                    n.aliquota_service,
                    i.status as invoice_status
                FROM nfse n
                LEFT JOIN invoices i ON i.invoice_id = n.invoice_id
                WHERE n.nfse_id = $1
            `;
            
            const result = await this.pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }

            const nfse = result.rows[0];
            return {
                nfse_id: nfse.nfse_id,
                invoice_id: nfse.invoice_id,
                integration_nfse_id: nfse.integration_nfse_id,
                service_value: nfse.service_value,
                iss_value: nfse.iss_value,
                aliquota_service: nfse.aliquota_service,
                invoice: {
                    status: nfse.invoice_status
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar NFSe por ID no repositório', {
                error: error.message,
                id,
                method: 'findById',
                service: 'NfseRepository'
            });
            throw new Error('Erro ao buscar NFSe no banco de dados');
        }
    }

    /**
     * Busca NFSes por ID de invoice
     * @param {number} invoiceId - ID da invoice
     * @returns {Promise<Array>} Lista de NFSes
     */
    async findByInvoiceId(invoiceId) {
        try {
            const query = `
                SELECT * FROM ${this.tableName}
                WHERE invoice_id = $1
                ORDER BY nfse_id DESC
            `;
            
            const result = await this.pool.query(query, [invoiceId]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar NFSes por invoice ID', { error, invoiceId });
            throw new DatabaseError('Erro ao buscar NFSes por invoice ID', error);
        }
    }

    /**
     * Busca NFSes por ID de integração
     * @param {string} integrationNfseId - ID de integração da NFSE
     * @param {Object} options - Opções de busca
     * @returns {Promise<Array>} Lista de NFSes
     */
    async findByIntegrationId(integrationNfseId, options = {}) {
        try {
            const { page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            const query = `
                SELECT * FROM ${this.tableName}
                WHERE integration_nfse_id = $1
                ORDER BY nfse_id DESC
                LIMIT $2 OFFSET $3
            `;
            
            const result = await this.pool.query(query, [integrationNfseId, limit, offset]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar NFSes por ID de integração', { error, integrationNfseId });
            throw new DatabaseError('Erro ao buscar NFSes por ID de integração', error);
        }
    }

    /**
     * Busca NFSes por status
     * @param {string} status - Status para filtrar
     * @returns {Promise<Array>} Lista de NFSes
     */
    async findByStatus(status) {
        try {
            const query = `
                SELECT n.*, i.* 
                FROM ${this.tableName} n
                INNER JOIN invoices i ON i.invoice_id = n.invoice_id
                WHERE i.status = $1
                ORDER BY n.nfse_id DESC
            `;
            
            const result = await this.pool.query(query, [status]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar NFSes por status', { error, status });
            throw new DatabaseError('Erro ao buscar NFSes por status', error);
        }
    }

    /**
     * Atualiza o status da NFSe
     * @param {number} nfseId - ID da NFSe
     * @param {string} status - Novo status
     * @returns {Promise<Object>} NFSe atualizada
     */
    async updateStatus(nfseId, status) {
        try {
            const query = `
                UPDATE invoices i
                SET status = $1, updated_at = CURRENT_TIMESTAMP
                FROM ${this.tableName} n
                WHERE n.invoice_id = i.invoice_id
                AND n.nfse_id = $2
                RETURNING i.*, n.*
            `;
            
            const result = await this.pool.query(query, [status, nfseId]);
            
            if (result.rows.length === 0) {
                throw new Error('NFSe não encontrada');
            }
            
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar status da NFSe', { error, nfseId, status });
            throw new DatabaseError('Erro ao atualizar status da NFSe', error);
        }
    }
}

module.exports = NfseRepository;

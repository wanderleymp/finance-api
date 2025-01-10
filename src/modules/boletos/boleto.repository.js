const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');

class BoletoRepository extends BaseRepository {
    constructor() {
        super('boletos', 'boleto_id');
    }

    /**
     * Lista todos os boletos com paginação e filtros
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {object} filters - Filtros aplicados
     * @returns {Promise<object>} Lista paginada de boletos
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            logger.debug('Listando boletos', { page, limit, filters });
            return await super.findAll(page, limit, filters, { orderBy: 'boleto_id DESC' });
        } catch (error) {
            logger.error('Erro ao listar boletos', { error: error.message, filters });
            throw error;
        }
    }

    /**
     * Lista boletos com dados relacionados
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {object} filters - Filtros aplicados
     * @returns {Promise<object>} Lista paginada de boletos com dados relacionados
     */
    async findAllWithDetails(page = 1, limit = 10, filters = {}) {
        try {
            logger.debug('Listando boletos com detalhes', { page, limit, filters });
            
            const customQuery = `
                SELECT 
                    b.*,
                    i.due_date,
                    i.amount
                FROM boletos b
                JOIN installments i ON b.installment_id = i.installment_id
            `;

            return await super.findAll(page, limit, filters, { 
                customQuery,
                orderBy: 'i.due_date DESC'
            });
        } catch (error) {
            logger.error('Erro ao listar boletos com detalhes', { error: error.message, filters });
            throw error;
        }
    }

    /**
     * Busca um boleto por ID
     * @param {number} boletoId - ID do boleto
     * @returns {Promise<object>} Boleto encontrado
     */
    async findById(boletoId) {
        try {
            logger.debug('Buscando boleto por ID', { boletoId });
            const query = 'SELECT * FROM boletos WHERE boleto_id = $1';
            const result = await this.pool.query(query, [boletoId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar boleto por ID', { error: error.message, boletoId });
            throw error;
        }
    }

    /**
     * Busca um boleto por ID com dados relacionados
     * @param {number} boletoId - ID do boleto
     * @returns {Promise<object>} Boleto encontrado com dados relacionados
     */
    async findByIdWithDetails(boletoId) {
        try {
            logger.debug('Buscando boleto por ID com detalhes', { boletoId });
            const query = `
                SELECT 
                    b.*,
                    i.due_date,
                    i.amount
                FROM boletos b
                JOIN installments i ON b.installment_id = i.installment_id
                WHERE b.boleto_id = $1
            `;
            const result = await this.pool.query(query, [boletoId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar boleto por ID com detalhes', { error: error.message, boletoId });
            throw error;
        }
    }

    /**
     * Atualiza um boleto existente
     * @param {number} boletoId - ID do boleto
     * @param {object} data - Dados para atualização
     * @returns {Promise<object>} Boleto atualizado
     */
    async updateBoleto(boletoId, data) {
        try {
            logger.debug('Atualizando boleto', { boletoId, data });
            const query = 'UPDATE boletos SET status = $1, updated_at = NOW() WHERE boleto_id = $2 RETURNING *';
            const result = await this.pool.query(query, [data.status, boletoId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar boleto', { error: error.message, boletoId, data });
            throw error;
        }
    }

    /**
     * Cria um novo boleto
     * @param {object} data - Dados do boleto
     * @returns {Promise<object>} Boleto criado
     */
    async createBoleto(data) {
        try {
            logger.debug('Criando boleto', { data });
            const query = `
                INSERT INTO boletos (
                    installment_id,
                    status
                ) VALUES ($1, $2)
                RETURNING *
            `;
            const result = await this.pool.query(query, [
                data.installment_id,
                data.status || 'A_RECEBER'
            ]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar boleto', { error: error.message, data });
            throw error;
        }
    }

    /**
     * Busca boletos por ID do pagamento
     * @param {number} paymentId - ID do pagamento
     * @returns {Promise<Array>} Lista de boletos
     */
    async findByPaymentId(paymentId) {
        try {
            logger.info('Repository: Buscando boletos por payment ID', { paymentId });

            const query = `
                SELECT 
                    b.*,
                    i.due_date,
                    i.amount,
                    i.installment_number,
                    i.total_installments
                FROM boletos b
                JOIN installments i ON b.installment_id = i.installment_id
                WHERE i.payment_id = $1
                ORDER BY i.installment_number ASC
            `;

            const result = await this.pool.query(query, [paymentId]);
            
            logger.info('Repository: Boletos encontrados', { 
                paymentId,
                count: result.rows.length
            });

            return result.rows;
        } catch (error) {
            logger.error('Repository: Erro ao buscar boletos por payment ID', {
                error: error.message,
                paymentId
            });
            // Se a tabela não existir, retorna array vazio
            if (error.code === '42P01') {
                logger.warn('Repository: Tabela boletos não existe', { paymentId });
                return [];
            }
            throw error;
        }
    }
}

module.exports = BoletoRepository;

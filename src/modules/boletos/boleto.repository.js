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
    async update(boletoId, data) {
        try {
            const query = `
                UPDATE boletos 
                SET ${Object.keys(data).map((key, i) => `${key} = $${i + 2}`).join(', ')},
                    updated_at = NOW()
                WHERE boleto_id = $1
                RETURNING *
            `;
            
            const values = [boletoId, ...Object.values(data)];
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar boleto', { error: error.message, boletoId, data });
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
            const query = 'UPDATE boletos SET status = $1, updated_at = NOW() WHERE boleto_id = $2 RETURNING *';
            const result = await this.pool.query(query, [data.status, boletoId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar boleto', { error: error.message, boletoId, data });
            throw error;
        }
    }

    /**
     * Cria um novo boleto com dados externos
     * @param {object} data - Dados do boleto
     * @returns {Promise<object>} Boleto criado
     */
    async create(data) {
        try {
            const query = `
                INSERT INTO boletos (
                    installment_id,
                    status,
                    generated_at,
                    last_status_update,
                    external_data
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
            const result = await this.pool.query(query, [
                data.installment_id,
                data.status || 'A_EMITIR',
                data.generated_at || new Date(),
                data.last_status_update || new Date(),
                JSON.stringify(data.external_data || {})
            ]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar boleto com dados externos', { error: error.message, data });
            throw error;
        }
    }

    /**
     * Gera payload do boleto via função do Postgres
     * @param {number} installmentId - ID da parcela
     * @returns {Promise<object>} Payload do boleto
     */
    async generateBoletoJson(installmentId) {
        try {
            const query = 'SELECT public.fn_generate_boleto_json($1) as payload';
            const result = await this.pool.query(query, [installmentId]);
            return result.rows[0].payload;
        } catch (error) {
            logger.error('Erro ao gerar payload do boleto', { error: error.message, installmentId });
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
            
            return result.rows;
        } catch (error) {
            logger.error('Repository: Erro ao buscar boletos por payment ID', {
                error: error.message,
                paymentId
            });
            // Se a tabela não existir, retorna array vazio
            if (error.code === '42P01') {
                return [];
            }
            throw error;
        }
    }

    /**
     * Busca dados da parcela relacionada ao boleto
     * @param {number} boletoId - ID do boleto
     * @returns {Promise<object>} Dados da parcela
     */
    async findInstallmentByBoletoId(boletoId) {
        try {
            const query = `
                SELECT 
                    i.installment_id,
                    i.amount as valor,
                    i.due_date as data_vencimento,
                    p.pessoa_id
                FROM boletos b
                JOIN installments i ON b.installment_id = i.installment_id
                JOIN payments py ON i.payment_id = py.payment_id
                JOIN pessoas p ON py.pessoa_id = p.pessoa_id
                WHERE b.boleto_id = $1
            `;

            const result = await this.pool.query(query, [boletoId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar dados da parcela', { 
                error: error.message, 
                boletoId 
            });
            throw error;
        }
    }

    /**
     * Busca dados necessários para emissão do boleto
     * @param {number} boletoId - ID do boleto
     * @returns {Promise<object>} Dados para emissão
     */
    async findBoletoDataForEmission(boletoId) {
        try {
            const query = `
                SELECT 
                    b.boleto_id,
                    b.installment_id,
                    py.payment_id,
                    m.movement_id
                FROM boletos b
                JOIN installments i ON b.installment_id = i.installment_id
                JOIN movement_payments py ON i.payment_id = py.payment_id
                JOIN movements m ON py.movement_id = m.movement_id
                WHERE b.boleto_id = $1
            `;

            const result = await this.pool.query(query, [boletoId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar dados para emissão', { 
                error: error.message, 
                boletoId 
            });
            throw error;
        }
    }
}

module.exports = BoletoRepository;

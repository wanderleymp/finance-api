const { systemDatabase } = require('../config/database');
const PaginationHelper = require('../utils/paginationHelper');
const { ValidationError } = require('../utils/errors');
const { logger } = require('../middlewares/logger');

class MovementPaymentsRepository {
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const { limit: validLimit, offset } = PaginationHelper.getPaginationParams(page, limit);
            
            let query = `
                SELECT 
                    mp.payment_id, 
                    mp.movement_id, 
                    mp.payment_method_id, 
                    mp.total_amount, 
                    mp.status,
                    pm.method_name,
                    m.description as movement_description
                FROM movement_payments mp
                JOIN payment_methods pm ON mp.payment_method_id = pm.payment_method_id
                JOIN movements m ON mp.movement_id = m.movement_id
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            // Filtros dinâmicos
            if (filters.movement_id) {
                query += ` AND mp.movement_id = $${paramCount}`;
                params.push(filters.movement_id);
                paramCount++;
            }

            if (filters.payment_method_id) {
                query += ` AND mp.payment_method_id = $${paramCount}`;
                params.push(filters.payment_method_id);
                paramCount++;
            }

            if (filters.status) {
                query += ` AND mp.status = $${paramCount}`;
                params.push(filters.status);
                paramCount++;
            }

            // Consulta de contagem
            const countQuery = query.replace('mp.payment_id, mp.movement_id, mp.payment_method_id, mp.total_amount, mp.status, pm.method_name, m.description as movement_description', 'COUNT(*)');
            
            // Adicionar ordenação e paginação
            query += ` ORDER BY mp.payment_id DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(validLimit, offset);

            logger.info('Executando consulta findAll de movement_payments', { 
                query,
                params,
                page,
                limit: validLimit,
                offset,
                filters
            });

            const [dataResult, countResult] = await Promise.all([
                systemDatabase.query(query, params),
                systemDatabase.query(countQuery, params.slice(0, -2))
            ]);

            return {
                data: dataResult.rows,
                total: parseInt(countResult.rows[0].count)
            };
        } catch (error) {
            logger.error('Erro ao buscar movement_payments', { 
                errorMessage: error.message,
                stack: error.stack,
                filters
            });
            throw error;
        }
    }

    async findById(paymentId) {
        try {
            const query = `
                SELECT 
                    mp.payment_id, 
                    mp.movement_id, 
                    mp.payment_method_id, 
                    mp.total_amount, 
                    mp.status,
                    pm.method_name,
                    m.description as movement_description
                FROM movement_payments mp
                JOIN payment_methods pm ON mp.payment_method_id = pm.payment_method_id
                JOIN movements m ON mp.movement_id = m.movement_id
                WHERE mp.payment_id = $1
            `;

            logger.info('Buscando movement_payment por ID', { paymentId });

            const result = await systemDatabase.query(query, [paymentId]);

            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar movement_payment por ID', { 
                errorMessage: error.message,
                paymentId
            });
            throw error;
        }
    }

    async create(paymentData) {
        try {
            const query = `
                INSERT INTO movement_payments (
                    movement_id, 
                    payment_method_id, 
                    total_amount, 
                    status
                ) VALUES (
                    $1, $2, $3, $4
                ) RETURNING *
            `;

            const values = [
                paymentData.movement_id,
                paymentData.payment_method_id,
                paymentData.total_amount,
                paymentData.status || 'Pendente'
            ];

            logger.info('Criando novo movement_payment', { 
                movementId: paymentData.movement_id,
                paymentMethodId: paymentData.payment_method_id
            });

            const result = await systemDatabase.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar movement_payment', { 
                errorMessage: error.message,
                paymentData
            });
            
            // Tratamento de erros específicos do banco de dados
            if (error.code === '23503') {  // Violação de chave estrangeira
                throw new ValidationError('Movement ou Payment Method não encontrado');
            }
            
            throw error;
        }
    }

    async update(paymentId, updateData) {
        try {
            const updateFields = [];
            const values = [];
            let paramCount = 1;

            // Campos atualizáveis
            const updateableFields = [
                'movement_id', 
                'payment_method_id', 
                'total_amount', 
                'status'
            ];

            updateableFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    updateFields.push(`${field} = $${paramCount}`);
                    values.push(updateData[field]);
                    paramCount++;
                }
            });

            if (updateFields.length === 0) {
                throw new ValidationError('Nenhum campo para atualizar');
            }

            values.push(paymentId);

            const query = `
                UPDATE movement_payments 
                SET ${updateFields.join(', ')}
                WHERE payment_id = $${paramCount}
                RETURNING *
            `;

            logger.info('Atualizando movement_payment', { 
                paymentId, 
                updatedFields: updateFields 
            });

            const result = await systemDatabase.query(query, values);

            if (result.rows.length === 0) {
                throw new ValidationError('Movement Payment não encontrado');
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar movement_payment', { 
                errorMessage: error.message,
                paymentId,
                updateData
            });
            throw error;
        }
    }

    async delete(paymentId) {
        try {
            const query = `
                DELETE FROM movement_payments 
                WHERE payment_id = $1
                RETURNING *
            `;

            logger.info('Excluindo movement_payment', { paymentId });

            const result = await systemDatabase.query(query, [paymentId]);

            if (result.rows.length === 0) {
                throw new ValidationError('Movement Payment não encontrado');
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao excluir movement_payment', { 
                errorMessage: error.message,
                paymentId
            });
            throw error;
        }
    }
}

module.exports = new MovementPaymentsRepository();

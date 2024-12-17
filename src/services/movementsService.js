const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');
const { systemDatabase } = require('../config/database');

class MovementsService {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async create(movementData) {
        try {
            logger.info('Criando novo movimento', { data: movementData });

            const query = `
                INSERT INTO movements 
                (movement_type_id, description, total_amount, movement_date, person_id, license_id, total_items, movement_status_id) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                RETURNING *
            `;

            const values = [
                movementData.movement_type_id,
                movementData.description || null,
                movementData.total_amount || 0,
                movementData.movement_date || new Date(),
                movementData.person_id,
                movementData.license_id,
                movementData.total_items || 0,
                movementData.movement_status_id
            ];

            const result = await this.pool.query(query, values);

            logger.info('Movimento criado com sucesso', { 
                movementId: result.rows[0].movement_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar movimento', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async list(filters = {}, page = 1, limit = 10) {
        try {
            logger.info('Listando movimentos', { filters, page, limit });

            // Preparar parâmetros de paginação
            const { page: normalizedPage, limit: normalizedLimit } = 
                PaginationHelper.validateParams(page, limit);
            const { offset } = PaginationHelper.getPaginationParams(normalizedPage, normalizedLimit);

            // Construir query base
            let query = `
                SELECT m.* 
                FROM movements m
                WHERE 1=1
            `;
            const queryParams = [];
            let paramIndex = 1;

            // Adicionar filtros
            if (filters.movement_type_id) {
                query += ` AND m.movement_type_id = $${paramIndex}`;
                queryParams.push(filters.movement_type_id);
                paramIndex++;
            }

            // Adicionar ordenação e paginação
            query += ` ORDER BY m.movement_id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            queryParams.push(normalizedLimit, offset);

            // Query de contagem
            const countQuery = `
                SELECT COUNT(*) 
                FROM movements m 
                WHERE 1=1 
                ${filters.movement_type_id ? `AND m.movement_type_id = $1` : ''}
            `;

            // Executar queries
            const [dataResult, countResult] = await Promise.all([
                this.pool.query(query, queryParams),
                this.pool.query(
                    countQuery, 
                    filters.movement_type_id ? [filters.movement_type_id] : []
                )
            ]);

            const total = parseInt(countResult.rows[0].count);

            logger.info('Listagem de movimentos concluída', { 
                count: dataResult.rows.length,
                total 
            });

            return PaginationHelper.formatResponse(
                dataResult.rows, 
                total, 
                normalizedPage, 
                normalizedLimit
            );
        } catch (error) {
            logger.error('Erro ao listar movimentos', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async getById(id, movement_type_id = null) {
        try {
            logger.info('Buscando movimento por ID', { id, movement_type_id });

            let query = `
                SELECT m.* 
                FROM movements m
                WHERE m.movement_id = $1
            `;
            const queryParams = [id];

            // Adicionar filtro de tipo de movimento, se especificado
            if (movement_type_id) {
                query += ` AND m.movement_type_id = $2`;
                queryParams.push(movement_type_id);
            }

            const result = await this.pool.query(query, queryParams);

            if (result.rows.length === 0) {
                const error = new Error('Movimento não encontrado');
                error.status = 404;
                throw error;
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar movimento', {
                errorMessage: error.message,
                errorStack: error.stack,
                id
            });
            throw error;
        }
    }

    async update(id, updateData) {
        try {
            logger.info('Atualizando movimento', { id, data: updateData });

            const query = `
                UPDATE movements 
                SET 
                    movement_type_id = COALESCE($1, movement_type_id),
                    description = COALESCE($2, description),
                    value = COALESCE($3, value),
                    date = COALESCE($4, date)
                WHERE movement_id = $5
                RETURNING *
            `;

            const values = [
                updateData.movement_type_id || null,
                updateData.description || null,
                updateData.value || null,
                updateData.date || null,
                id
            ];

            const result = await this.pool.query(query, values);

            if (result.rows.length === 0) {
                const error = new Error('Movimento não encontrado');
                error.status = 404;
                throw error;
            }

            logger.info('Movimento atualizado com sucesso', { 
                movementId: result.rows[0].movement_id 
            });

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar movimento', {
                errorMessage: error.message,
                errorStack: error.stack,
                id
            });
            throw error;
        }
    }

    async delete(id, movement_type_id = null) {
        try {
            logger.info('Deletando movimento', { id, movement_type_id });

            let query = `
                DELETE FROM movements 
                WHERE movement_id = $1
            `;
            const queryParams = [id];

            // Adicionar filtro de tipo de movimento, se especificado
            if (movement_type_id) {
                query += ` AND movement_type_id = $2`;
                queryParams.push(movement_type_id);
            }

            query += ` RETURNING *`;

            const result = await this.pool.query(query, queryParams);

            if (result.rows.length === 0) {
                const error = new Error('Movimento não encontrado');
                error.status = 404;
                throw error;
            }

            logger.info('Movimento deletado com sucesso', { movementId: id });

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao deletar movimento', {
                errorMessage: error.message,
                errorStack: error.stack,
                id
            });
            throw error;
        }
    }
}

module.exports = MovementsService;

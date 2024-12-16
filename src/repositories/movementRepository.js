const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class MovementRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);
            const offset = (validPage - 1) * validLimit;

            let whereClause = 'WHERE 1=1';
            const queryParams = [];
            let paramCount = 1;

            // Adicionar filtros dinâmicos
            if (filters.person_id) {
                whereClause += ` AND m.person_id = $${paramCount}`;
                queryParams.push(filters.person_id);
                paramCount++;
            }

            if (filters.movement_type_id) {
                whereClause += ` AND m.movement_type_id = $${paramCount}`;
                queryParams.push(filters.movement_type_id);
                paramCount++;
            }

            if (filters.movement_status_id) {
                whereClause += ` AND m.movement_status_id = $${paramCount}`;
                queryParams.push(filters.movement_status_id);
                paramCount++;
            }

            if (filters.license_id) {
                whereClause += ` AND m.license_id = $${paramCount}`;
                queryParams.push(filters.license_id);
                paramCount++;
            }

            if (filters.start_date) {
                whereClause += ` AND m.movement_date >= $${paramCount}`;
                queryParams.push(filters.start_date);
                paramCount++;
            }

            if (filters.end_date) {
                whereClause += ` AND m.movement_date <= $${paramCount}`;
                queryParams.push(filters.end_date);
                paramCount++;
            }

            if (filters.min_amount) {
                whereClause += ` AND m.total_amount >= $${paramCount}`;
                queryParams.push(filters.min_amount);
                paramCount++;
            }

            if (filters.max_amount) {
                whereClause += ` AND m.total_amount <= $${paramCount}`;
                queryParams.push(filters.max_amount);
                paramCount++;
            }

            if (filters.is_template !== undefined) {
                whereClause += ` AND m.is_template = $${paramCount}`;
                queryParams.push(filters.is_template);
                paramCount++;
            }

            const countQuery = `
                SELECT COUNT(*) 
                FROM movements m
                LEFT JOIN persons p ON m.person_id = p.person_id
                LEFT JOIN movement_types mt ON m.movement_type_id = mt.movement_type_id
                LEFT JOIN movement_statuses ms ON m.movement_status_id = ms.movement_status_id
                ${whereClause}
            `;

            const dataQuery = `
                SELECT 
                    m.*,
                    p.full_name as person_name,
                    mt.type_name as movement_type_name,
                    ms.status_name as movement_status_name
                FROM movements m
                LEFT JOIN persons p ON m.person_id = p.person_id
                LEFT JOIN movement_types mt ON m.movement_type_id = mt.movement_type_id
                LEFT JOIN movement_statuses ms ON m.movement_status_id = ms.movement_status_id
                ${whereClause}
                ORDER BY m.movement_date DESC, m.movement_id DESC 
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;
            queryParams.push(validLimit, offset);

            logger.info('Executando consulta findAll paginada em movements', { 
                dataQuery,
                countQuery,
                params: queryParams,
                filters
            });

            const [dataResult, countResult] = await Promise.all([
                this.pool.query(dataQuery, queryParams),
                this.pool.query(countQuery, queryParams.slice(0, -2))
            ]);

            return {
                data: dataResult.rows,
                total: parseInt(countResult.rows[0].count)
            };
        } catch (error) {
            logger.error('Erro ao buscar movimentações', { 
                errorMessage: error.message,
                errorStack: error.stack,
                filters
            });
            throw error;
        }
    }

    async findById(movementId) {
        try {
            const query = `
                SELECT 
                    m.*,
                    p.full_name as person_name,
                    mt.type_name as movement_type_name,
                    ms.status_name as movement_status_name
                FROM movements m
                LEFT JOIN persons p ON m.person_id = p.person_id
                LEFT JOIN movement_types mt ON m.movement_type_id = mt.movement_type_id
                LEFT JOIN movement_statuses ms ON m.movement_status_id = ms.movement_status_id
                WHERE m.movement_id = $1
            `;
            const { rows } = await this.pool.query(query, [movementId]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao buscar movimentação por ID', { 
                errorMessage: error.message,
                errorStack: error.stack,
                movementId
            });
            throw error;
        }
    }

    async create(movementData) {
        const { 
            movement_date, 
            person_id, 
            total_amount, 
            license_id, 
            discount = 0, 
            addition = 0, 
            total_items = 0, 
            description, 
            movement_type_id, 
            movement_status_id, 
            is_template = false 
        } = movementData;

        try {
            const query = `
                INSERT INTO movements (
                    movement_date, 
                    person_id, 
                    total_amount, 
                    license_id, 
                    discount, 
                    addition, 
                    total_items, 
                    description, 
                    movement_type_id, 
                    movement_status_id, 
                    is_template
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;
            const { rows } = await this.pool.query(query, [
                movement_date, 
                person_id, 
                total_amount, 
                license_id, 
                discount, 
                addition, 
                total_items, 
                description, 
                movement_type_id, 
                movement_status_id, 
                is_template
            ]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao criar movimentação', {
                error: error.message,
                movementData
            });
            throw error;
        }
    }

    async update(movementId, movementData) {
        const { 
            movement_date, 
            person_id, 
            total_amount, 
            license_id, 
            discount, 
            addition, 
            total_items, 
            description, 
            movement_type_id, 
            movement_status_id, 
            is_template 
        } = movementData;

        try {
            const query = `
                UPDATE movements 
                SET 
                    movement_date = COALESCE($1, movement_date),
                    person_id = COALESCE($2, person_id),
                    total_amount = COALESCE($3, total_amount),
                    license_id = COALESCE($4, license_id),
                    discount = COALESCE($5, discount),
                    addition = COALESCE($6, addition),
                    total_items = COALESCE($7, total_items),
                    description = COALESCE($8, description),
                    movement_type_id = COALESCE($9, movement_type_id),
                    movement_status_id = COALESCE($10, movement_status_id),
                    is_template = COALESCE($11, is_template)
                WHERE movement_id = $12
                RETURNING *
            `;
            const { rows } = await this.pool.query(query, [
                movement_date, 
                person_id, 
                total_amount, 
                license_id, 
                discount, 
                addition, 
                total_items, 
                description, 
                movement_type_id, 
                movement_status_id, 
                is_template,
                movementId
            ]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar movimentação', {
                error: error.message,
                movementId,
                movementData
            });
            throw error;
        }
    }

    async delete(movementId) {
        try {
            const query = 'DELETE FROM movements WHERE movement_id = $1 RETURNING *';
            const result = await this.pool.query(query, [movementId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao excluir movimentação', {
                error: error.message,
                movementId
            });
            throw error;
        }
    }
}

module.exports = new MovementRepository();

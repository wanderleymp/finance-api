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

            let whereClause = '';
            const queryParams = [];
            let paramCount = 1;

            // Construir cláusula WHERE dinâmica
            const buildWhereClause = () => {
                const conditions = [];

                if (filters.movement_status_id) {
                    conditions.push(`m.movement_status_id = $${paramCount}`);
                    queryParams.push(filters.movement_status_id);
                    paramCount++;
                }

                if (filters.movement_type_id) {
                    conditions.push(`m.movement_type_id = $${paramCount}`);
                    queryParams.push(filters.movement_type_id);
                    paramCount++;
                }

                if (filters.person_id) {
                    conditions.push(`m.person_id = $${paramCount}`);
                    queryParams.push(filters.person_id);
                    paramCount++;
                }

                if (filters.start_date) {
                    conditions.push(`m.movement_date >= $${paramCount}`);
                    queryParams.push(filters.start_date);
                    paramCount++;
                }

                if (filters.end_date) {
                    conditions.push(`m.movement_date <= $${paramCount}`);
                    queryParams.push(filters.end_date);
                    paramCount++;
                }

                if (filters.search) {
                    conditions.push(`(
                        LOWER(m.description) LIKE LOWER($${paramCount}) OR 
                        EXISTS (
                            SELECT 1 FROM persons p 
                            WHERE p.person_id = m.person_id 
                            AND LOWER(p.full_name) LIKE LOWER($${paramCount})
                        )
                    )`);
                    queryParams.push(`%${filters.search.trim()}%`);
                    paramCount++;
                }

                return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            };

            whereClause = buildWhereClause();

            // Definir ordenação
            let orderClause = 'ORDER BY m.movement_date DESC';
            if (filters.order_by) {
                const [field, direction] = filters.order_by.split(':');
                orderClause = `ORDER BY ${field} ${direction || 'DESC'}`;
            }

            // Log de depuração
            console.log('Parâmetros de consulta:', {
                validPage,
                validLimit,
                offset,
                whereClause,
                orderClause,
                queryParams
            });

            const countQuery = `
                SELECT COUNT(*)
                FROM movements m
                ${whereClause}
            `;

            const dataQuery = `
                SELECT 
                    m.*,
                    p.full_name as person_name,
                    COALESCE(mt.type_name, 'Sem Tipo') as movement_type_name,
                    COALESCE(ms.status_name, 'Sem Status') as movement_status_name
                FROM movements m
                LEFT JOIN persons p ON m.person_id = p.person_id
                LEFT JOIN movement_types mt ON m.movement_type_id = mt.movement_type_id
                LEFT JOIN movement_statuses ms ON m.movement_status_id = ms.movement_status_id
                ${whereClause}
                ${orderClause}
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;
            queryParams.push(validLimit, offset);

            const [countResult, dataResult] = await Promise.all([
                this.pool.query(countQuery, queryParams.slice(0, -2)),
                this.pool.query(dataQuery, queryParams)
            ]);

            console.log('Detalhes da consulta:', {
                countQuery,
                dataQuery,
                countParams: queryParams.slice(0, -2),
                dataParams: queryParams,
                countResultRows: countResult.rows,
                countResultRowsLength: countResult.rows.length,
                countResultRowsFirstItem: countResult.rows[0]
            });

            const total = parseInt(countResult.rows[0].count, 10);

            console.log('Resultado da consulta:', {
                countQuery,
                dataQuery,
                countParams: queryParams.slice(0, -2),
                dataParams: queryParams,
                countResult: countResult.rows,
                dataResult: dataResult.rows
            });

            return {
                data: dataResult.rows,
                meta: {
                    current_page: validPage,
                    total_pages: Math.ceil(total / validLimit),
                    total_records: total,
                    page_size: validLimit
                }
            };
        } catch (error) {
            logger.error('Erro no repositório de movimentações', { 
                error: error.message, 
                stack: error.stack,
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

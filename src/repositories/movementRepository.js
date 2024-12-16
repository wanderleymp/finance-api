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

            let baseQuery = `
                SELECT 
                    m.movement_id, 
                    m.movement_date, 
                    m.person_id, 
                    m.total_amount, 
                    m.license_id, 
                    m.created_at, 
                    m.discount, 
                    m.addition, 
                    m.total_items, 
                    m.description, 
                    m.movement_type_id, 
                    m.movement_status_id, 
                    m.is_template,
                    p.full_name as person_name,
                    mt.type_name as movement_type_name,
                    ms.status_name as movement_status_name
                FROM movements m
                LEFT JOIN persons p ON m.person_id = p.person_id
                LEFT JOIN movement_types mt ON m.movement_type_id = mt.movement_type_id
                LEFT JOIN movement_statuses ms ON m.movement_status_id = ms.movement_status_id
                WHERE 1=1
            `;

            const queryParams = [];
            let paramCount = 1;

            // Adicionar filtros dinâmicos
            Object.keys(filters).forEach(key => {
                if (key === 'search') {
                    // Busca em múltiplos campos
                    baseQuery += ` AND (
                        p.full_name ILIKE $${paramCount} OR 
                        m.description ILIKE $${paramCount} OR 
                        CAST(m.movement_id AS TEXT) ILIKE $${paramCount} OR
                        mt.type_name ILIKE $${paramCount} OR
                        ms.status_name ILIKE $${paramCount}
                    )`;
                    queryParams.push(`%${filters[key]}%`);
                    paramCount++;
                } else if (key === 'movement_type_name') {
                    baseQuery += ` AND mt.type_name ILIKE $${paramCount}`;
                    queryParams.push(`%${filters[key]}%`);
                    paramCount++;
                } else if (key === 'movement_status_name') {
                    baseQuery += ` AND ms.status_name ILIKE $${paramCount}`;
                    queryParams.push(`%${filters[key]}%`);
                    paramCount++;
                } else if (key !== 'page' && key !== 'limit') {
                    if (filters[key] !== undefined && filters[key] !== null) {
                        // Tratamento especial para campos de data e valor
                        if (key === 'start_date') {
                            baseQuery += ` AND m.movement_date >= $${paramCount}`;
                        } else if (key === 'end_date') {
                            baseQuery += ` AND m.movement_date <= $${paramCount}`;
                        } else if (key === 'min_amount') {
                            baseQuery += ` AND m.total_amount >= $${paramCount}`;
                        } else if (key === 'max_amount') {
                            baseQuery += ` AND m.total_amount <= $${paramCount}`;
                        } else {
                            baseQuery += ` AND m.${key} = $${paramCount}`;
                        }
                        queryParams.push(filters[key]);
                        paramCount++;
                    }
                }
            });

            // Contar total de registros antes da paginação
            const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) AS filtered_movements`;
            const countResult = await this.pool.query(countQuery, queryParams);
            const totalRecords = parseInt(countResult.rows[0].total, 10);

            // Adicionar ordenação padrão e paginação
            baseQuery += ` ORDER BY m.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            queryParams.push(validLimit, offset);

            // Executar query principal
            const result = await this.pool.query(baseQuery, queryParams);

            return {
                data: result.rows,
                total: totalRecords
            };
        } catch (error) {
            logger.error('Erro ao buscar movimentações', { 
                error: error.message,
                filters,
                page,
                limit
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

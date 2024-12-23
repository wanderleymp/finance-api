const { systemDatabase } = require('../../config/database');
const { logger } = require('../../middlewares/logger');
const IMovementItemRepository = require('./interfaces/IMovementItemRepository');
const MovementItemDTO = require('./dto/movement-item.dto');

class MovementItemRepository extends IMovementItemRepository {
    constructor() {
        super();
        this.pool = systemDatabase.pool;
        this.tableName = 'movement_items';
    }

    async findAll(filters = {}, page = 1, limit = 10, order = {}) {
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT DISTINCT
                    mi.*,
                    i.name as item_name
                FROM ${this.tableName} mi
                LEFT JOIN items i ON mi.item_id = i.item_id
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            // Filtro por busca
            if (filters.search) {
                query += ` AND (
                    i.name ILIKE $${paramCount}
                    OR mi.description ILIKE $${paramCount}
                )`;
                params.push(`%${filters.search}%`);
                paramCount++;
            }

            // Filtro por movement_id
            if (filters.movementId) {
                query += ` AND mi.movement_id = $${paramCount}`;
                params.push(filters.movementId);
                paramCount++;
            }

            // Ordenação
            const orderField = order.field || 'movement_item_id';
            const orderDirection = order.direction || 'DESC';
            const validFields = ['movement_item_id', 'item_name', 'quantity', 'unit_price', 'total_price', 'created_at'];
            const validDirections = ['ASC', 'DESC'];
            
            if (!validFields.includes(orderField)) {
                throw new Error('Campo de ordenação inválido');
            }
            if (!validDirections.includes(orderDirection)) {
                throw new Error('Direção de ordenação inválida');
            }

            const orderByField = orderField === 'item_name' ? 'i.name' : `mi.${orderField}`;
            query += ` ORDER BY ${orderByField} ${orderDirection}`;

            // Paginação
            query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(limit, offset);

            // Executa a query principal
            const result = await this.pool.query(query, params);

            // Conta o total de registros
            const countQuery = `
                SELECT COUNT(DISTINCT mi.movement_item_id) as total
                FROM ${this.tableName} mi
                LEFT JOIN items i ON mi.item_id = i.item_id
                WHERE 1=1
                ${filters.search ? ` AND (
                    i.name ILIKE $1
                    OR mi.description ILIKE $1
                )` : ''}
                ${filters.movementId ? ` AND mi.movement_id = $${filters.search ? '2' : '1'}` : ''}
            `;
            const countParams = [];
            if (filters.search) countParams.push(`%${filters.search}%`);
            if (filters.movementId) countParams.push(filters.movementId);
            
            const countResult = await this.pool.query(countQuery, countParams);
            const total = parseInt(countResult.rows[0].total);

            return {
                data: result.rows.map(row => MovementItemDTO.fromDatabase(row)),
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar itens de movimentação:', error);
            throw error;
        }
    }

    async findById(id) {
        try {
            const query = `
                SELECT mi.*, i.name as item_name
                FROM ${this.tableName} mi
                LEFT JOIN items i ON mi.item_id = i.item_id
                WHERE mi.movement_item_id = $1
            `;
            const result = await this.pool.query(query, [id]);
            return result.rows[0] ? MovementItemDTO.fromDatabase(result.rows[0]) : null;
        } catch (error) {
            logger.error('Erro ao buscar item de movimentação:', error);
            throw error;
        }
    }

    async findByMovementId(movementId) {
        try {
            const query = `
                SELECT mi.*, i.name as item_name
                FROM ${this.tableName} mi
                LEFT JOIN items i ON mi.item_id = i.item_id
                WHERE mi.movement_id = $1
                ORDER BY mi.movement_item_id
            `;
            const result = await this.pool.query(query, [movementId]);
            return result.rows.map(row => MovementItemDTO.fromDatabase(row));
        } catch (error) {
            logger.error('Erro ao buscar itens da movimentação:', error);
            throw error;
        }
    }

    async create(data) {
        try {
            const query = `
                INSERT INTO ${this.tableName}
                (movement_id, item_id, quantity, unit_price, total_price, description)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;
            const values = [
                data.movement_id,
                data.item_id,
                data.quantity,
                data.unit_price,
                data.total_price,
                data.description
            ];

            const result = await this.pool.query(query, values);
            return MovementItemDTO.fromDatabase(result.rows[0]);
        } catch (error) {
            logger.error('Erro ao criar item de movimentação:', error);
            throw error;
        }
    }

    async update(id, data) {
        try {
            const fields = [];
            const values = [];
            let paramCount = 1;

            if (data.quantity !== undefined) {
                fields.push(`quantity = $${paramCount}`);
                values.push(data.quantity);
                paramCount++;
            }
            if (data.unit_price !== undefined) {
                fields.push(`unit_price = $${paramCount}`);
                values.push(data.unit_price);
                paramCount++;
            }
            if (data.description !== undefined) {
                fields.push(`description = $${paramCount}`);
                values.push(data.description);
                paramCount++;
            }

            if (fields.length === 0) {
                throw new Error('Nenhum campo para atualizar');
            }

            values.push(id);
            const query = `
                UPDATE ${this.tableName}
                SET ${fields.join(', ')}
                WHERE movement_item_id = $${paramCount}
                RETURNING *
            `;

            const result = await this.pool.query(query, values);
            return result.rows[0] ? MovementItemDTO.fromDatabase(result.rows[0]) : null;
        } catch (error) {
            logger.error('Erro ao atualizar item de movimentação:', error);
            throw error;
        }
    }

    async delete(id) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE movement_item_id = $1`;
            await this.pool.query(query, [id]);
        } catch (error) {
            logger.error('Erro ao excluir item de movimentação:', error);
            throw error;
        }
    }
}

module.exports = MovementItemRepository;

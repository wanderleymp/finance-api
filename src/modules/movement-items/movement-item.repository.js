const { systemDatabase } = require('../../config/database');
const { logger } = require('../../middlewares/logger');
const BaseRepository = require('../../repositories/base/BaseRepository');
const MovementItemDTO = require('./dto/movement-item.dto');

class MovementItemRepository extends BaseRepository {
    constructor() {
        super('movement_items', 'movement_item_id');
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

    async updateMovementTotal(movementId) {
        try {
            const query = `
                UPDATE movements m
                SET total_amount = (
                    SELECT COALESCE(SUM(total_price), 0)
                    FROM ${this.tableName} mi
                    WHERE mi.movement_id = $1
                )
                WHERE m.movement_id = $1
                RETURNING total_amount
            `;
            
            const result = await this.pool.query(query, [movementId]);
            return result.rows[0]?.total_amount || 0;
        } catch (error) {
            logger.error('Erro ao atualizar total do movimento:', error);
            throw error;
        }
    }

    async create(data) {
        try {
            const result = await super.create(data);
            await this.updateMovementTotal(data.movement_id);
            return MovementItemDTO.fromDatabase(result);
        } catch (error) {
            logger.error('Erro ao criar item de movimentação:', error);
            throw error;
        }
    }

    async update(id, data) {
        try {
            // Busca o item atual para pegar o movement_id
            const currentItem = await this.findById(id);
            if (!currentItem) {
                throw new Error('Item não encontrado');
            }

            const result = await super.update(id, data);
            await this.updateMovementTotal(currentItem.movement_id);
            return MovementItemDTO.fromDatabase(result);
        } catch (error) {
            logger.error('Erro ao atualizar item de movimentação:', error);
            throw error;
        }
    }

    async delete(id) {
        try {
            // Busca o item atual para pegar o movement_id
            const currentItem = await this.findById(id);
            if (!currentItem) {
                throw new Error('Item não encontrado');
            }

            const result = await super.delete(id);
            await this.updateMovementTotal(currentItem.movement_id);
            return MovementItemDTO.fromDatabase(result);
        } catch (error) {
            logger.error('Erro ao deletar item de movimentação:', error);
            throw error;
        }
    }

    /**
     * Busca itens de movimento com detalhes de serviço
     * @param {number} movementId - ID do movimento
     * @returns {Promise<Array>} Itens do movimento com detalhes de serviço
     */
    async findDetailedByMovementId(movementId) {
        try {
            const query = `
                SELECT 
                    mi.*,
                    vw.cnae,
                    vw.cod_tributacao,
                    vw.descricao_servico,
                    vw.aliquota_iss,
                    vw.valor_iss,
                    i.name as item_name
                FROM movement_items mi
                JOIN vw_services_details vw ON vw.item_id = mi.item_id
                LEFT JOIN items i ON mi.item_id = i.item_id
                WHERE mi.movement_id = $1
            `;

            const result = await this.pool.query(query, [movementId]);

            return result.rows.map(row => ({
                ...row,
                total_value: parseFloat(row.quantity) * parseFloat(row.unit_value),
                servico: {
                    cnae: row.cnae,
                    cod_tributacao: row.cod_tributacao,
                    descricao_servico: row.descricao_servico,
                    aliquota_iss: parseFloat(row.aliquota_iss),
                    valor_iss: parseFloat(row.valor_iss)
                }
            }));
        } catch (error) {
            logger.error('Erro ao buscar itens detalhados do movimento:', {
                movementId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = MovementItemRepository;

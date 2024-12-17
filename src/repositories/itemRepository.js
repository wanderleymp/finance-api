const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');
const { ValidationError } = require('../utils/errors');

class ItemRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const { limit: validLimit, offset } = PaginationHelper.getPaginationParams(page, limit);
            
            let query = `
                SELECT * 
                FROM items 
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            // Filtro por nome
            if (filters.name) {
                query += ` AND name ILIKE $${paramCount}`;
                params.push(`%${filters.name}%`);
                paramCount++;
            }

            // Filtro por categoria
            if (filters.category) {
                query += ` AND category = $${paramCount}`;
                params.push(filters.category);
                paramCount++;
            }

            // Filtro de preço
            if (filters.price) {
                if (filters.price.$gte !== undefined) {
                    query += ` AND price >= $${paramCount}`;
                    params.push(filters.price.$gte);
                    paramCount++;
                }
                
                if (filters.price.$lte !== undefined) {
                    query += ` AND price <= $${paramCount}`;
                    params.push(filters.price.$lte);
                    paramCount++;
                }
            }

            // Filtro de status ativo/inativo
            if (filters.is_active !== undefined) {
                query += ` AND is_active = $${paramCount}`;
                params.push(filters.is_active);
                paramCount++;
            }

            // Consulta de contagem
            const countQuery = query.replace('*', 'COUNT(*)');
            
            // Adicionar ordenação e paginação
            query += ` ORDER BY item_id DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(validLimit, offset);

            logger.info('Executando consulta findAll de items', { 
                query,
                params,
                page,
                limit: validLimit,
                offset,
                filters
            });

            const [dataResult, countResult] = await Promise.all([
                this.pool.query(query, params),
                this.pool.query(countQuery, params.slice(0, -2))
            ]);

            return {
                data: dataResult.rows,
                total: parseInt(countResult.rows[0].count)
            };
        } catch (error) {
            logger.error('Erro ao buscar items', { 
                errorMessage: error.message,
                stack: error.stack,
                filters
            });
            throw error;
        }
    }

    async findById(itemId) {
        try {
            const query = `
                SELECT * 
                FROM items 
                WHERE item_id = $1
            `;

            logger.info('Buscando item por ID', { itemId });

            const result = await this.pool.query(query, [itemId]);

            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar item por ID', { 
                errorMessage: error.message,
                itemId
            });
            throw error;
        }
    }

    async create(itemData) {
        try {
            const query = `
                INSERT INTO items 
                (name, description, category, price, stock_quantity, unit, is_active) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const values = [
                itemData.name,
                itemData.description || null,
                itemData.category || null,
                itemData.price,
                itemData.stock_quantity || 0,
                itemData.unit || null,
                itemData.is_active !== undefined ? itemData.is_active : true
            ];

            logger.info('Criando novo item', { 
                name: itemData.name,
                category: itemData.category
            });

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar item', { 
                errorMessage: error.message,
                itemData
            });
            
            // Tratamento de erros específicos do banco de dados
            if (error.code === '23505') {  // Violação de restrição única
                throw new ValidationError('Já existe um item com este nome');
            }
            
            throw error;
        }
    }

    async update(itemId, updateData) {
        try {
            const updateFields = [];
            const values = [];
            let paramCount = 1;

            // Construir campos dinâmicos para atualização
            const updateableFields = [
                'name', 'description', 'category', 
                'price', 'stock_quantity', 'unit', 'is_active'
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

            values.push(itemId);

            const query = `
                UPDATE items 
                SET ${updateFields.join(', ')}
                WHERE item_id = $${paramCount}
                RETURNING *
            `;

            logger.info('Atualizando item', { 
                itemId, 
                updatedFields: updateFields 
            });

            const result = await this.pool.query(query, values);

            if (result.rows.length === 0) {
                throw new ValidationError('Item não encontrado');
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar item', { 
                errorMessage: error.message,
                itemId,
                updateData
            });
            throw error;
        }
    }

    async delete(itemId) {
        try {
            const query = `
                DELETE FROM items 
                WHERE item_id = $1
                RETURNING *
            `;

            logger.info('Excluindo item', { itemId });

            const result = await this.pool.query(query, [itemId]);

            if (result.rows.length === 0) {
                throw new ValidationError('Item não encontrado');
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao excluir item', { 
                errorMessage: error.message,
                itemId
            });
            throw error;
        }
    }
}

module.exports = new ItemRepository();

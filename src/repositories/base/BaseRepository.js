const { systemDatabase } = require('../../config/database');
const { logger } = require('../../middlewares/logger');
const TransactionHelper = require('../../utils/transactionHelper');

class BaseRepository {
    constructor(tableName, primaryKey = 'id') {
        this.pool = systemDatabase.pool;
        this.tableName = tableName;
        this.primaryKey = primaryKey;
    }

    /**
     * Constrói cláusula WHERE com parâmetros
     * @param {Object} filters - Filtros a serem aplicados
     * @param {number} startParamCount - Número inicial para os parâmetros
     * @returns {Object} Objeto com whereClause e queryParams
     */
    buildWhereClause(filters, startParamCount = 1) {
        const conditions = [];
        const queryParams = [];
        let paramCount = startParamCount;

        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    conditions.push(`${key} = ANY($${paramCount})`);
                    queryParams.push(value);
                } else if (typeof value === 'object') {
                    if (value.operator && value.value) {
                        conditions.push(`${key} ${value.operator} $${paramCount}`);
                        queryParams.push(value.value);
                    }
                } else {
                    conditions.push(`${key} = $${paramCount}`);
                    queryParams.push(value);
                }
                paramCount++;
            }
        }

        const whereClause = conditions.length > 0 
            ? `WHERE ${conditions.join(' AND ')}` 
            : '';

        return { whereClause, queryParams, paramCount };
    }

    /**
     * Constrói cláusula ORDER BY
     * @param {Object} orderBy - Configuração de ordenação
     * @returns {string} Cláusula ORDER BY
     */
    buildOrderByClause(orderBy = {}) {
        if (!orderBy.column) return '';
        
        const direction = (orderBy.direction || 'ASC').toUpperCase();
        if (!['ASC', 'DESC'].includes(direction)) {
            throw new Error('Invalid sort direction');
        }

        return `ORDER BY ${orderBy.column} ${direction}`;
    }

    /**
     * Busca registro por ID
     * @param {number} id - ID do registro
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object>} Registro encontrado
     */
    async findById(id, client = this.pool) {
        try {
            const query = `
                SELECT *
                FROM ${this.tableName}
                WHERE ${this.primaryKey} = $1
            `;

            const result = await TransactionHelper.getClient(client)
                .query(query, [id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar registro por ID', {
                error: error.message,
                tableName: this.tableName,
                id
            });
            throw error;
        }
    }

    /**
     * Lista registros com paginação e filtros
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {Object} filters - Filtros a serem aplicados
     * @param {Object} orderBy - Configuração de ordenação
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object>} Lista paginada de registros
     */
    async findAll(page = 1, limit = 10, filters = {}, orderBy = {}, client = this.pool) {
        try {
            const { whereClause, queryParams, paramCount } = this.buildWhereClause(filters);
            const orderByClause = this.buildOrderByClause(orderBy);
            const offset = (page - 1) * limit;

            // Query principal
            const query = `
                SELECT *
                FROM ${this.tableName}
                ${whereClause}
                ${orderByClause}
                LIMIT $${paramCount}
                OFFSET $${paramCount + 1}
            `;

            // Query de contagem
            const countQuery = `
                SELECT COUNT(*)::integer
                FROM ${this.tableName}
                ${whereClause}
            `;

            const dbClient = TransactionHelper.getClient(client);
            const [resultQuery, countResult] = await Promise.all([
                dbClient.query(query, [...queryParams, limit, offset]),
                dbClient.query(countQuery, queryParams)
            ]);

            const totalItems = countResult.rows[0].count;
            const totalPages = Math.ceil(totalItems / limit);

            return {
                data: resultQuery.rows,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages
                }
            };
        } catch (error) {
            logger.error('Erro ao listar registros', {
                error: error.message,
                tableName: this.tableName,
                filters
            });
            throw error;
        }
    }

    /**
     * Cria um novo registro
     * @param {Object} data - Dados do registro
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object>} Registro criado
     */
    async create(data, client = this.pool) {
        try {
            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

            const query = `
                INSERT INTO ${this.tableName}
                (${columns.join(', ')})
                VALUES (${placeholders})
                RETURNING *
            `;

            const result = await TransactionHelper.getClient(client)
                .query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar registro', {
                error: error.message,
                tableName: this.tableName,
                data
            });
            throw error;
        }
    }

    /**
     * Atualiza um registro
     * @param {number} id - ID do registro
     * @param {Object} data - Dados para atualização
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object>} Registro atualizado
     */
    async update(id, data, client = this.pool) {
        try {
            const columns = Object.keys(data);
            const values = Object.values(data);
            const setClause = columns
                .map((col, i) => `${col} = $${i + 1}`)
                .join(', ');

            const query = `
                UPDATE ${this.tableName}
                SET ${setClause}
                WHERE ${this.primaryKey} = $${values.length + 1}
                RETURNING *
            `;

            const result = await TransactionHelper.getClient(client)
                .query(query, [...values, id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar registro', {
                error: error.message,
                tableName: this.tableName,
                id,
                data
            });
            throw error;
        }
    }

    /**
     * Remove um registro
     * @param {number} id - ID do registro
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object>} Registro removido
     */
    async delete(id, client = this.pool) {
        try {
            const query = `
                DELETE FROM ${this.tableName}
                WHERE ${this.primaryKey} = $1
                RETURNING *
            `;

            const result = await TransactionHelper.getClient(client)
                .query(query, [id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao remover registro', {
                error: error.message,
                tableName: this.tableName,
                id
            });
            throw error;
        }
    }

    /**
     * Cria vários registros em uma transação
     * @param {Object[]} records - Array de registros para criar
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object[]>} Registros criados
     */
    async createMany(records, client = this.pool) {
        try {
            const columns = Object.keys(records[0]);
            const values = records.map(Object.values);
            const placeholders = values[0]
                .map((_, i) => `$${i + 1}`)
                .join(', ');

            const query = `
                INSERT INTO ${this.tableName}
                (${columns.join(', ')})
                VALUES (${placeholders})
                RETURNING *
            `;

            const dbClient = TransactionHelper.getClient(client);
            const results = await Promise.all(
                values.map(row => dbClient.query(query, row))
            );

            return results.map(r => r.rows[0]);
        } catch (error) {
            logger.error('Erro ao criar múltiplos registros', {
                error: error.message,
                tableName: this.tableName,
                recordsCount: records.length
            });
            throw error;
        }
    }

    /**
     * Atualiza vários registros em uma transação
     * @param {Object[]} records - Array de registros para atualizar
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object[]>} Registros atualizados
     */
    async updateMany(records, client = this.pool) {
        try {
            const dbClient = TransactionHelper.getClient(client);
            const results = await Promise.all(
                records.map(record => 
                    this.update(record[this.primaryKey], record, dbClient)
                )
            );

            return results;
        } catch (error) {
            logger.error('Erro ao atualizar múltiplos registros', {
                error: error.message,
                tableName: this.tableName,
                recordsCount: records.length
            });
            throw error;
        }
    }

    /**
     * Remove vários registros em uma transação
     * @param {number[]} ids - Array de IDs para remover
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object[]>} Registros removidos
     */
    async deleteMany(ids, client = this.pool) {
        try {
            const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
            const query = `
                DELETE FROM ${this.tableName}
                WHERE ${this.primaryKey} IN (${placeholders})
                RETURNING *
            `;

            const result = await TransactionHelper.getClient(client)
                .query(query, ids);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao remover múltiplos registros', {
                error: error.message,
                tableName: this.tableName,
                ids
            });
            throw error;
        }
    }
}

module.exports = BaseRepository;

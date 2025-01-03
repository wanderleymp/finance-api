const { systemDatabase } = require('../../config/database');
const { logger } = require('../../middlewares/logger');

class BaseRepository {
    constructor(tableName, primaryKey = 'id') {
        this.tableName = tableName;
        this.primaryKey = primaryKey;
        this.pool = systemDatabase.pool;
    }

    /**
     * Lista todos os registros
     */
    async findAll(page = 1, limit = 10, filters = {}, options = {}) {
        try {
            logger.debug('BaseRepository findAll - input:', {
                page,
                limit,
                filters,
                tableName: this.tableName,
                primaryKey: this.primaryKey
            });

            // Garante que page e limit são números
            const parsedPage = parseInt(page) || 1;
            const parsedLimit = parseInt(limit) || 10;
            const offset = (parsedPage - 1) * parsedLimit;
            
            // Usa parâmetros personalizados ou prepara novos
            const originalQueryParams = options.queryParams || [];
            const queryParams = [...originalQueryParams];

            // Adiciona filtros de data ou outros filtros específicos
            const conditions = [];
            let paramCount = originalQueryParams.length + 1;

            // Adiciona parâmetros de paginação
            queryParams.push(parsedLimit, offset);

            // Usa query personalizada ou padrão
            const baseQuery = options.customQuery || `
                SELECT *
                FROM ${this.tableName}
                ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
            `;

            // Define orderBy
            const orderByClause = options.orderBy 
                ? `ORDER BY ${options.orderBy}` 
                : `ORDER BY created_at DESC`;

            // Query para buscar os dados
            const query = `
                WITH subquery AS (
                    ${baseQuery}
                )
                SELECT * 
                FROM subquery
                ${orderByClause}
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            // Query para contar o total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM (${baseQuery}) as count_subquery
            `;

            logger.debug('BaseRepository findAll - queries:', {
                query,
                countQuery,
                queryParams,
                paramCount
            });

            // Executa as queries
            const [data, countResult] = await Promise.all([
                this.pool.query(query, queryParams),
                this.pool.query(countQuery, originalQueryParams)
            ]);

            const totalItems = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(totalItems / parsedLimit);

            const result = {
                items: data.rows,
                meta: {
                    totalItems,
                    itemCount: data.rows.length,
                    itemsPerPage: parsedLimit,
                    totalPages,
                    currentPage: parsedPage
                }
            };

            logger.debug('BaseRepository findAll - result:', result);

            return result;
        } catch (error) {
            logger.error('BaseRepository - Erro ao listar registros', {
                error: error.message,
                tableName: this.tableName,
                filters,
                page,
                limit,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Busca registro por ID
     */
    async findById(id) {
        try {
            logger.debug('BaseRepository findById - input:', {
                id,
                tableName: this.tableName,
                primaryKey: this.primaryKey
            });

            const query = `
                SELECT *
                FROM ${this.tableName}
                WHERE ${this.primaryKey} = $1
            `;

            logger.debug('BaseRepository findById - query:', {
                query,
                id
            });

            const result = await this.pool.query(query, [id]);

            logger.debug('BaseRepository findById - result:', {
                result: result.rows[0]
            });

            return result.rows[0];
        } catch (error) {
            logger.error('BaseRepository - Erro ao buscar registro por ID', {
                error: error.message,
                tableName: this.tableName,
                id,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Busca um registro pelo ID
     * @param {number|string} id - ID do registro
     * @returns {Promise<Object|null>} Registro encontrado ou null
     */
    async findOne(id) {
        try {
            logger.debug('BaseRepository findOne - input:', {
                id,
                tableName: this.tableName,
                primaryKey: this.primaryKey
            });

            const query = `
                SELECT *
                FROM ${this.tableName}
                WHERE ${this.primaryKey} = $1
            `;

            const result = await this.pool.query(query, [id]);

            logger.debug('BaseRepository findOne - result:', {
                rowCount: result.rowCount,
                tableName: this.tableName
            });

            return result.rows[0] || null;
        } catch (error) {
            logger.error('BaseRepository findOne - error:', {
                error: error.message,
                tableName: this.tableName,
                id
            });
            throw error;
        }
    }

    /**
     * Cria um novo registro
     */
    async create(data) {
        try {
            logger.info('BaseRepository create - input:', {
                data,
                tableName: this.tableName
            });

            // Remover campos undefined ou null
            const cleanData = Object.fromEntries(
                Object.entries(data)
                    .filter(([_, value]) => value !== undefined && value !== null)
            );

            // Construir a query dinamicamente
            const columns = Object.keys(cleanData);
            const values = Object.values(cleanData);
            const placeholders = values.map((_, index) => `$${index + 1}`);

            const query = `
                INSERT INTO ${this.tableName} (${columns.join(', ')})
                VALUES (${placeholders.join(', ')})
                RETURNING *
            `;

            logger.info('BaseRepository create - query:', {
                query,
                values
            });

            const { rows } = await this.pool.query(query, values);
            return rows[0];
        } catch (error) {
            logger.error('BaseRepository - Erro ao criar registro', {
                error: error.message,
                tableName: this.tableName,
                data,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Cria um novo registro usando uma transação existente
     */
    async createWithClient(client, data) {
        try {
            logger.info('BaseRepository create - input:', {
                data,
                tableName: this.tableName
            });

            // Monta a query
            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, i) => `$${i + 1}`);

            const query = `
                INSERT INTO ${this.tableName} (${columns.join(', ')})
                VALUES (${placeholders})
                RETURNING *
            `;

            logger.info('BaseRepository create - query:', {
                query,
                values
            });

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Atualiza um registro
     */
    async update(id, data) {
        try {
            logger.debug('BaseRepository update - input:', {
                id,
                data,
                tableName: this.tableName
            });

            const updates = Object.entries(data)
                .map(([key, _], index) => `${key} = $${index + 1}`)
                .join(', ');

            const query = `
                UPDATE ${this.tableName}
                SET ${updates}
                WHERE ${this.primaryKey} = $${Object.keys(data).length + 1}
                RETURNING *
            `;

            logger.debug('BaseRepository update - query:', {
                query,
                values: [...Object.values(data), id]
            });

            const result = await this.pool.query(query, [...Object.values(data), id]);

            logger.debug('BaseRepository update - result:', {
                result: result.rows[0]
            });

            return result.rows[0];
        } catch (error) {
            logger.error('BaseRepository - Erro ao atualizar registro', {
                error: error.message,
                tableName: this.tableName,
                id,
                data,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Remove um registro
     */
    async delete(id) {
        try {
            logger.debug('BaseRepository delete - input:', {
                id,
                tableName: this.tableName
            });

            const query = `
                DELETE FROM ${this.tableName}
                WHERE ${this.primaryKey} = $1
                RETURNING *
            `;

            logger.debug('BaseRepository delete - query:', {
                query,
                id
            });

            const result = await this.pool.query(query, [id]);

            logger.debug('BaseRepository delete - result:', {
                result: result.rows[0]
            });

            return result.rows[0];
        } catch (error) {
            logger.error('BaseRepository - Erro ao remover registro', {
                error: error.message,
                tableName: this.tableName,
                id,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Executa uma transação de banco de dados
     * @param {Function} callback - Função que recebe o cliente de transação
     * @returns {Promise} Resultado da transação
     */
    async transaction(callback) {
        const client = await this.pool.connect();
        
        try {
            // Inicia a transação
            await client.query('BEGIN');
            
            // Executa o callback com o cliente de transação
            const result = await callback(client);
            
            // Confirma a transação
            await client.query('COMMIT');
            
            return result;
        } catch (error) {
            // Em caso de erro, faz rollback
            await client.query('ROLLBACK');
            
            logger.error('Erro em transação de banco', {
                error: error.message,
                stack: error.stack,
                tableName: this.tableName
            });
            
            throw error;
        } finally {
            // Sempre libera o cliente
            client.release();
        }
    }
}

module.exports = BaseRepository;

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
    async findAll(page, limit, filters = {}, options = {}) {
        try {
            // Parâmetros padrão
            const parsedPage = parseInt(page) || 1;
            const parsedLimit = parseInt(limit) || 10;
            const offset = (parsedPage - 1) * parsedLimit;

            // Usa parâmetros personalizados ou padrão
            const queryParams = options.queryParams || [];
            
            // Query personalizada ou padrão
            const query = options.customQuery || `
                SELECT * 
                FROM ${this.tableName}
                LIMIT $1 OFFSET $2
            `;

            // Parâmetros para a query
            const fullQueryParams = [
                ...(options.queryParams || []),
                parsedLimit,
                offset
            ];

            // Query de contagem
            const countQuery = options.countQuery || `
                SELECT COUNT(*) as total 
                FROM ${this.tableName}
            `;

            logger.debug('BaseRepository findAll - debug', {
                query,
                countQuery,
                fullQueryParams
            });

            // Executa as queries
            const [dataResult, countResult] = await Promise.all([
                this.pool.query(query, fullQueryParams),
                this.pool.query(countQuery, queryParams)
            ]);

            return {
                data: dataResult.rows,
                total: parseInt(countResult.rows[0]?.total || 0),
                page: parsedPage,
                limit: parsedLimit
            };
        } catch (error) {
            logger.error('Erro no BaseRepository findAll', { 
                error: error.message, 
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

            // Converte datas para o formato correto com mais precisão
            const processedData = Object.entries(data).reduce((acc, [key, value]) => {
                if (value instanceof Date) {
                    // Se for uma data, converte para ISO string em UTC
                    acc[key] = value.toISOString();
                } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
                    // Se for uma string de data, cria um novo Date às 15:00 no timezone de São Paulo
                    const date = new Date(value);
                    const saoPauloTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
                    saoPauloTime.setHours(15, 0, 0, 0);
                    acc[key] = saoPauloTime.toISOString();
                } else {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const updates = Object.entries(processedData)
                .map(([key, _], index) => `${key} = $${index + 1}`)
                .join(', ');

            const query = `
                UPDATE ${this.tableName}
                SET ${updates}
                WHERE ${this.primaryKey} = $${Object.keys(processedData).length + 1}
                RETURNING *
            `;

            logger.debug('BaseRepository update - query:', {
                query,
                values: [...Object.values(processedData), id],
                processedData
            });

            const result = await this.pool.query(query, [...Object.values(processedData), id]);

            logger.debug('BaseRepository update - result:', {
                result: result.rows[0],
                rowCount: result.rowCount
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

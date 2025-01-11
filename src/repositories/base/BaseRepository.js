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
            // Log detalhado de entrada
            logger.debug('BaseRepository.findAll - Entrada', {
                page,
                limit,
                filters: JSON.stringify(filters),
                tableName: this.tableName,
                customQuery: !!options.customQuery
            });

            // Parâmetros padrão
            const parsedPage = parseInt(page) || 1;
            const parsedLimit = parseInt(limit) || 10;
            const offset = (parsedPage - 1) * parsedLimit;

            // Preparar query e parâmetros
            let query, countQuery, queryParams;

            if (options.customQuery) {
                // Query personalizada
                query = options.customQuery;
                countQuery = options.countQuery;
                queryParams = options.queryParams || [];
                
                // Adicionar LIMIT e OFFSET
                const baseParamsLength = queryParams.length;
                query += ` LIMIT $${baseParamsLength + 1} OFFSET $${baseParamsLength + 2}`;
                
                // Adicionar parâmetros de paginação apenas para a query principal
                queryParams = [...queryParams, parsedLimit, offset];
            } else {
                // Query padrão
                const { whereClause, queryParams: baseQueryParams } = this.buildWhereClause(filters);
                queryParams = baseQueryParams;

                query = `
                    SELECT * 
                    FROM ${this.tableName}
                    ${whereClause}
                    LIMIT $${baseQueryParams.length + 1} OFFSET $${baseQueryParams.length + 2}
                `;

                countQuery = `
                    SELECT COUNT(*) as total 
                    FROM ${this.tableName}
                    ${whereClause}
                `;

                // Adicionar parâmetros de paginação apenas para a query principal
                queryParams = [...baseQueryParams, parsedLimit, offset];
            }

            // Log da query
            logger.debug('BaseRepository.findAll - Query', {
                query,
                countQuery,
                queryParams,
                countQueryParams: options.queryParams || []
            });

            // Executa as queries
            const [dataResult, countResult] = await Promise.all([
                this.pool.query(query, queryParams),
                this.pool.query(countQuery, queryParams.slice(0, -2)) // Remove os últimos dois parâmetros de paginação
            ]);

            // Log dos resultados
            logger.debug('BaseRepository.findAll - Resultados', {
                dataResultCount: dataResult.rows.length,
                totalItems: countResult.rows[0]?.total
            });

            return {
                data: dataResult.rows,
                total: parseInt(countResult.rows[0]?.total || 0),
                page: parsedPage,
                limit: parsedLimit
            };
        } catch (error) {
            logger.error('Erro no BaseRepository findAll', { 
                error: error.message, 
                stack: error.stack,
                tableName: this.tableName,
                options
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

    /**
     * Constrói uma cláusula WHERE dinâmica para consultas
     * @param {Object} filters - Filtros a serem aplicados
     * @returns {Object} Objeto com cláusula WHERE, parâmetros e contagem de parâmetros
     */
    buildWhereClause(filters = {}) {
        const whereConditions = [];
        const queryParams = [];
        let paramCount = 1;

        // Log detalhado dos filtros recebidos
        logger.debug('BaseRepository.buildWhereClause - Filtros recebidos', {
            filters: JSON.stringify(filters)
        });

        // Filtro de data com tratamento específico para due_date
        if (filters.start_date && filters.end_date) {
            // Converte para timestamps com início do dia e fim do dia
            const startDate = new Date(filters.start_date);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(filters.end_date);
            endDate.setHours(23, 59, 59, 999);
            
            whereConditions.push(`due_date >= $${paramCount} AND due_date <= $${paramCount + 1}`);
            queryParams.push(startDate.toISOString(), endDate.toISOString());
            
            logger.debug('BaseRepository.buildWhereClause - Filtro de Data', {
                startDateInput: filters.start_date,
                startDateConverted: startDate.toISOString(),
                endDateInput: filters.end_date,
                endDateConverted: endDate.toISOString()
            });
            
            paramCount += 2;
        }

        // Filtros dinâmicos para outros campos
        Object.keys(filters).forEach(key => {
            // Ignorar filtros de data e include
            if (key !== 'start_date' && key !== 'end_date' && key !== 'include') {
                whereConditions.push(`${key} = $${paramCount}`);
                queryParams.push(filters[key]);
                paramCount++;
            }
        });

        // Construção da cláusula WHERE
        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';

        logger.debug('BaseRepository.buildWhereClause - Resultado Final', {
            whereClause,
            queryParams,
            paramCount
        });

        return {
            whereClause,
            queryParams,
            paramCount: queryParams.length
        };
    }
}

module.exports = BaseRepository;

const { systemDatabase } = require('../../config/database');
const { logger } = require('../../middlewares/logger');

class BaseRepository {
    constructor(tableName, primaryKey = 'id') {
        this.tableName = tableName;
        this.primaryKey = primaryKey;
        this.pool = systemDatabase.pool;
    }

    /**
     * Lista todos os registros seguindo padrão RESTful
     * @param {number} page - Número da página
     * @param {number} limit - Quantidade de itens por página
     * @param {Object} filters - Filtros para busca
     * @param {Object} options - Opções adicionais para query
     * @returns {Promise<Object>} Resultado da busca no padrão RESTful
     */
    async findAll(page, limit, filters = {}, options = {}) {
        try {
            // Garantir que page e limit sejam números positivos
            const parsedPage = Math.max(1, Number(page) || 1);
            const parsedLimit = Math.max(1, Number(limit) || 10);
            const offset = (parsedPage - 1) * parsedLimit;

            // Log detalhado de entrada
            logger.debug('BaseRepository.findAll - Entrada', {
                page: parsedPage,
                limit: parsedLimit,
                filters: JSON.stringify(filters),
                tableName: this.tableName,
                customQuery: !!options.customQuery
            });

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
                const { whereClause, queryParams: baseQueryParams } = this.buildWhereClause(filters, options);
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

            // Calcular total de páginas
            const totalItems = parseInt(countResult.rows[0]?.total || 0);
            const totalPages = Math.ceil(totalItems / parsedLimit);

            // Construir links de paginação
            const baseUrl = `/${this.tableName}`; // Ajuste conforme necessário
            const links = {
                first: `${baseUrl}?page=1&limit=${parsedLimit}`,
                previous: parsedPage > 1 ? `${baseUrl}?page=${parsedPage - 1}&limit=${parsedLimit}` : null,
                next: parsedPage < totalPages ? `${baseUrl}?page=${parsedPage + 1}&limit=${parsedLimit}` : null,
                last: `${baseUrl}?page=${totalPages}&limit=${parsedLimit}`
            };

            // Log dos resultados
            logger.debug('BaseRepository.findAll - Resultados', {
                dataResultCount: dataResult.rows.length,
                totalItems: parseInt(countResult.rows[0]?.total || 0),
                query,
                queryParams,
                data: dataResult.rows
            });

            // Retornar resultado no padrão RESTful
            return {
                items: dataResult.rows,
                meta: {
                    currentPage: parsedPage,
                    itemCount: dataResult.rows.length,
                    itemsPerPage: parsedLimit,
                    totalItems,
                    totalPages
                },
                links
            };
        } catch (error) {
            logger.error('Erro ao buscar registros', { 
                error, 
                tableName: this.tableName, 
                page, 
                limit, 
                filters 
            });
            throw error;
        }
    }

    /**
     * Busca registro por ID
     */
    async findById(id) {
        try {
            logger.info('BaseRepository findById - Iniciando busca', {
                tableName: this.tableName,
                primaryKey: this.primaryKey,
                id: id,
                idType: typeof id
            });

            const query = `
                SELECT *
                FROM ${this.tableName}
                WHERE ${this.primaryKey} = $1
            `;

            logger.info('BaseRepository findById - Query preparada', {
                query,
                params: [id]
            });

            const result = await this.pool.query(query, [id]);

            logger.info('BaseRepository findById - Resultado da query', {
                rowCount: result.rowCount,
                rows: result.rows.length > 0 ? JSON.stringify(result.rows[0]) : null
            });

            return result.rows[0] || null;
        } catch (error) {
            logger.error('BaseRepository findById - Erro ao buscar registro', {
                error: error.message,
                tableName: this.tableName,
                primaryKey: this.primaryKey,
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

            // Primeiro, buscar os nomes das colunas da tabela
            const columnsQuery = `
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1
            `;
            const columnsResult = await this.pool.query(columnsQuery, [this.tableName]);
            const tableColumns = columnsResult.rows.map(row => row.column_name);

            // Filtrar apenas os dados que existem na tabela
            const cleanData = Object.fromEntries(
                Object.entries(data)
                    .filter(([key, value]) => 
                        tableColumns.includes(key) && 
                        value !== undefined && 
                        value !== null
                    )
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
     * @param {Object} options - Opções de busca
     * @returns {Object} Objeto com cláusula WHERE, parâmetros e contagem de parâmetros
     */
    buildWhereClause(filters = {}, options = {}) {
        let queryParams = [];
        let paramCount = 1;
        let whereClauses = [];

        // Opções de busca
        const exact = options.exact || false;
        const caseSensitive = options.caseSensitive || false;

        for (const [key, value] of Object.entries(filters)) {
            if (value === undefined || value === null) continue;

            let paramPlaceholder = `$${paramCount}`;
            let clause;

            if (typeof value === 'string') {
                if (exact) {
                    // Busca exata, considerando case-sensitive se necessário
                    clause = caseSensitive 
                        ? `${key} = ${paramPlaceholder}` 
                        : `UPPER(${key}) = UPPER(${paramPlaceholder})`;
                } else {
                    // Busca parcial, considerando case-sensitive se necessário
                    clause = caseSensitive 
                        ? `${key} LIKE ${paramPlaceholder}` 
                        : `UPPER(${key}) LIKE UPPER(${paramPlaceholder})`;
                    value = exact ? value : `%${value}%`;
                }
            } else if (Array.isArray(value)) {
                // Para arrays, usa IN
                paramPlaceholder = value.map((_, index) => `$${paramCount + index}`).join(', ');
                clause = `${key} IN (${paramPlaceholder})`;
                queryParams.push(...value);
                paramCount += value.length;
                continue;
            } else {
                // Para outros tipos, usa igualdade direta
                clause = `${key} = ${paramPlaceholder}`;
            }

            whereClauses.push(clause);
            queryParams.push(value);
            paramCount++;
        }

        // Constrói a cláusula WHERE
        const whereClause = whereClauses.length > 0 
            ? `WHERE ${whereClauses.join(' AND ')}` 
            : '';

        logger.debug('BaseRepository.buildWhereClause - Filtros recebidos', { filters });
        logger.debug('BaseRepository.buildWhereClause - Resultado Final', {
            whereClause,
            paramCount,
            queryParams
        });

        return { whereClause, queryParams, paramCount: queryParams.length };
    }
}

module.exports = BaseRepository;

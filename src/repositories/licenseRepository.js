const { systemDatabase } = require('../config/database');
const { DatabaseError } = require('../utils/errors');
const PaginationHelper = require('../utils/paginationHelper');
const { logger } = require('../middlewares/logger');

class LicenseRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            logger.info('REPOSITORY: Iniciando findAll no LicenseRepository', { 
                filters, 
                page, 
                limit,
                filtersType: typeof filters,
                pageType: typeof page,
                limitType: typeof limit
            });
            
            const { limit: validLimit, offset } = PaginationHelper.getPaginationParams(page, limit);
            
            logger.info('REPOSITORY: Parâmetros de paginação obtidos', {
                validLimit,
                offset,
                validLimitType: typeof validLimit,
                offsetType: typeof offset
            });
            
            let query = `
                SELECT 
                    l.license_id,
                    l.person_id,
                    l.license_name,
                    l.start_date,
                    l.end_date,
                    l.status,
                    l.timezone,
                    l.active,
                    p.full_name
                FROM licenses l
                LEFT JOIN persons p ON p.person_id = l.person_id
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            if (filters.search) {
                query += ` AND (
                    l.license_name ILIKE $${paramCount}
                    OR p.full_name ILIKE $${paramCount}
                )`;
                params.push(`%${filters.search}%`);
                paramCount++;
            }

            if (filters.status) {
                query += ` AND l.status = $${paramCount}`;
                params.push(filters.status);
                paramCount++;
            }

            if (filters.active !== undefined) {
                query += ` AND l.active = $${paramCount}`;
                params.push(filters.active);
                paramCount++;
            }

            if (filters.person_id) {
                query += ` AND l.person_id = $${paramCount}`;
                params.push(filters.person_id);
                paramCount++;
            }

            // Constrói a query de contagem usando os mesmos filtros
            const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
            
            // Adiciona ordenação e paginação
            query += ` ORDER BY l.license_id DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(validLimit, offset);

            logger.info('REPOSITORY: Query de licenças', { 
                query, 
                params,
                queryType: typeof query,
                paramsType: typeof params
            });

            const result = await this.pool.query(query, params);
            const countResult = await this.pool.query(countQuery, params.slice(0, -2));
            
            logger.info('REPOSITORY: Resultado da busca de licenças', { 
                rowCount: result.rowCount, 
                total: countResult.rows[0].count,
                resultRows: result.rows,
                countResultRows: countResult.rows
            });

            return {
                data: result.rows,
                total: parseInt(countResult.rows[0].count)
            };
        } catch (error) {
            logger.error('REPOSITORY: Erro ao buscar licenças', { 
                error: error.message,
                stack: error.stack,
                filters,
                page,
                limit,
                errorName: error.name,
                errorCode: error.code
            });
            throw new DatabaseError('Erro ao buscar licenças');
        }
    }

    async findById(id) {
        try {
            logger.info('REPOSITORY: Buscando licença por ID', { id });
            
            const query = `
                SELECT 
                    l.license_id,
                    l.person_id,
                    l.license_name,
                    l.start_date,
                    l.end_date,
                    l.status,
                    l.timezone,
                    l.active,
                    p.full_name
                FROM licenses l
                LEFT JOIN persons p ON p.person_id = l.person_id
                WHERE l.license_id = $1
            `;
            const result = await this.pool.query(query, [id]);
            
            logger.info('REPOSITORY: Resultado da busca por ID', { 
                rowCount: result.rowCount,
                resultRows: result.rows
            });

            return result.rowCount > 0 ? result.rows[0] : null;
        } catch (error) {
            logger.error('REPOSITORY: Erro ao buscar licença por ID', { 
                error: error.message,
                stack: error.stack,
                id,
                errorName: error.name,
                errorCode: error.code
            });
            throw new DatabaseError('Erro ao buscar licença');
        }
    }

    async findByPerson(personId) {
        try {
            logger.info('REPOSITORY: Buscando licenças por pessoa', { personId });
            
            const query = `
                SELECT 
                    l.license_id,
                    l.person_id,
                    l.license_name,
                    l.start_date,
                    l.end_date,
                    l.status,
                    l.timezone,
                    l.active,
                    p.full_name
                FROM licenses l
                LEFT JOIN persons p ON p.person_id = l.person_id
                WHERE l.person_id = $1
            `;
            const result = await this.pool.query(query, [personId]);
            
            logger.info('REPOSITORY: Resultado da busca por pessoa', { 
                rowCount: result.rowCount,
                resultRows: result.rows
            });

            return result.rows;
        } catch (error) {
            logger.error('REPOSITORY: Erro ao buscar licenças por pessoa', { 
                error: error.message,
                stack: error.stack,
                personId,
                errorName: error.name,
                errorCode: error.code
            });
            throw new DatabaseError('Erro ao buscar licenças');
        }
    }

    async create(data) {
        try {
            const query = `
                INSERT INTO licenses (
                    person_id, 
                    license_name, 
                    start_date, 
                    end_date, 
                    status, 
                    timezone,
                    active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            const values = [
                data.person_id,
                data.license_name,
                data.start_date,
                data.end_date || null,
                data.status,
                data.timezone,
                data.active !== undefined ? data.active : true
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar licença', { error, data });
            throw new DatabaseError('Erro ao criar licença');
        }
    }

    async update(id, data) {
        try {
            const query = `
                UPDATE licenses 
                SET 
                    license_name = COALESCE($1, license_name),
                    start_date = COALESCE($2, start_date),
                    end_date = COALESCE($3, end_date),
                    status = COALESCE($4, status),
                    timezone = COALESCE($5, timezone),
                    active = COALESCE($6, active),
                    updated_at = CURRENT_TIMESTAMP
                WHERE license_id = $7
                RETURNING *
            `;
            const values = [
                data.license_name,
                data.start_date,
                data.end_date,
                data.status,
                data.timezone,
                data.active,
                id
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar licença', { error, id, data });
            throw new DatabaseError('Erro ao atualizar licença');
        }
    }

    async delete(id) {
        try {
            const query = 'UPDATE licenses SET active = false WHERE license_id = $1 RETURNING *';
            const result = await this.pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao excluir licença', { error, id });
            throw new DatabaseError('Erro ao excluir licença');
        }
    }
}

module.exports = new LicenseRepository();

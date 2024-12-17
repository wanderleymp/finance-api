const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class ServiceLc116Repository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const { limit: validLimit, offset } = PaginationHelper.getPaginationParams(page, limit);
            
            let query = `
                SELECT * 
                FROM service_lc116 
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            if (filters.code) {
                query += ` AND code ILIKE $${paramCount}`;
                params.push(`%${filters.code}%`);
                paramCount++;
            }

            if (filters.description) {
                query += ` AND description ILIKE $${paramCount}`;
                params.push(`%${filters.description}%`);
                paramCount++;
            }

            if (filters.cnae) {
                query += ` AND cnae = $${paramCount}`;
                params.push(filters.cnae);
                paramCount++;
            }

            const countQuery = query.replace('*', 'COUNT(*)');
            query += ` ORDER BY service_lc116_id DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(validLimit, offset);

            logger.info('Executando consulta findAll paginada em service_lc116', { 
                query,
                params,
                page,
                limit: validLimit,
                offset
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
            logger.error('Erro ao buscar serviços LC116', { 
                errorMessage: error.message,
                filters,
                page,
                limit
            });
            throw error;
        }
    }

    async findById(id) {
        try {
            logger.info('Buscando serviço LC116 por ID', { id });
            
            const query = 'SELECT * FROM service_lc116 WHERE service_lc116_id = $1';
            const result = await this.pool.query(query, [id]);
            
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar serviço LC116 por ID', { 
                errorMessage: error.message,
                id 
            });
            throw error;
        }
    }

    async create(data) {
        try {
            logger.info('Criando novo serviço LC116', { data });
            
            const { code, description, cnae } = data;
            const query = `
                INSERT INTO service_lc116 
                (code, description, cnae) 
                VALUES ($1, $2, $3) 
                RETURNING *
            `;
            const result = await this.pool.query(query, [code, description, cnae]);
            
            logger.info('Serviço LC116 criado com sucesso', { 
                id: result.rows[0].service_lc116_id 
            });
            
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar serviço LC116', { 
                errorMessage: error.message,
                data 
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            logger.info('Atualizando serviço LC116', { id, data });
            
            const { code, description, cnae } = data;
            const query = `
                UPDATE service_lc116 
                SET code = $1, 
                    description = $2, 
                    cnae = $3
                WHERE service_lc116_id = $4 
                RETURNING *
            `;
            const result = await this.pool.query(query, [code, description, cnae, id]);
            
            if (result.rows.length === 0) {
                const error = new Error('Serviço LC116 não encontrado');
                error.status = 404;
                throw error;
            }
            
            logger.info('Serviço LC116 atualizado com sucesso', { 
                id: result.rows[0].service_lc116_id 
            });
            
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar serviço LC116', { 
                errorMessage: error.message,
                id,
                data 
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            logger.info('Deletando serviço LC116', { id });
            
            const query = `
                DELETE FROM service_lc116 
                WHERE service_lc116_id = $1 
                RETURNING *
            `;
            const result = await this.pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                const error = new Error('Serviço LC116 não encontrado');
                error.status = 404;
                throw error;
            }
            
            logger.info('Serviço LC116 deletado com sucesso', { id });
            
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao deletar serviço LC116', { 
                errorMessage: error.message,
                id 
            });
            throw error;
        }
    }
}

module.exports = ServiceLc116Repository;

const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class PersonContactRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const { limit: validLimit, offset } = PaginationHelper.getPaginationParams(page, limit);
            
            let query = 'SELECT pc.*, p.full_name as person_name FROM person_contacts pc ' +
                       'LEFT JOIN persons p ON p.person_id = pc.person_id WHERE 1=1';
            const params = [];
            let paramCount = 1;

            if (filters.person_id) {
                query += ` AND pc.person_id = $${paramCount}`;
                params.push(filters.person_id);
                paramCount++;
            }
            if (filters.contact_type) {
                query += ` AND pc.contact_type = $${paramCount}`;
                params.push(filters.contact_type);
                paramCount++;
            }
            if (filters.active !== undefined) {
                query += ` AND pc.active = $${paramCount}`;
                params.push(filters.active);
                paramCount++;
            }
            if (filters.is_main !== undefined) {
                query += ` AND pc.is_main = $${paramCount}`;
                params.push(filters.is_main);
                paramCount++;
            }
            if (filters.search) {
                query += ` AND (pc.contact_value ILIKE $${paramCount} OR pc.description ILIKE $${paramCount})`;
                params.push(`%${filters.search}%`);
                paramCount++;
            }

            const countQuery = query.replace('SELECT pc.*, p.full_name as person_name', 'SELECT COUNT(*)');
            query += ' ORDER BY pc.created_at DESC LIMIT $' + paramCount + ' OFFSET $' + (paramCount + 1);
            params.push(validLimit, offset);

            logger.info('Executando consulta findAll paginada em person_contacts', { 
                query,
                params,
                page,
                limit: validLimit,
                offset
            });

            const [dataResult, countResult] = await Promise.all([
                systemDatabase.query(query, params),
                systemDatabase.query(countQuery, params.slice(0, -2))
            ]);

            return {
                data: dataResult.rows,
                total: parseInt(countResult.rows[0].count)
            };
        } catch (error) {
            logger.error('Erro ao buscar contatos', { 
                errorMessage: error.message,
                errorStack: error.stack,
                errorCode: error.code,
                errorName: error.name,
                query: 'findAll'
            });
            throw error;
        }
    }

    async findById(contactId) {
        try {
            const query = 'SELECT pc.*, p.full_name as person_name FROM person_contacts pc ' +
                         'LEFT JOIN persons p ON p.person_id = pc.person_id ' +
                         'WHERE pc.contact_id = $1';
            const { rows } = await systemDatabase.query(query, [contactId]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao buscar contato por ID', { 
                errorMessage: error.message,
                errorStack: error.stack,
                contactId
            });
            throw error;
        }
    }

    async create(data) {
        try {
            const query = `
                INSERT INTO person_contacts (
                    person_id, contact_type, contact_value, description, is_main, active
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`;
            
            const params = [
                data.person_id,
                data.contact_type,
                data.contact_value,
                data.description,
                data.is_main || false,
                data.active !== undefined ? data.active : true
            ];

            const { rows } = await systemDatabase.query(query, params);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao criar contato', { 
                errorMessage: error.message,
                errorStack: error.stack,
                data
            });
            throw error;
        }
    }

    async update(contactId, data) {
        try {
            const setClauses = [];
            const params = [];
            let paramCount = 1;

            for (const [key, value] of Object.entries(data)) {
                if (value !== undefined) {
                    setClauses.push(`${key} = $${paramCount}`);
                    params.push(value);
                    paramCount++;
                }
            }

            params.push(contactId);
            const query = `
                UPDATE person_contacts 
                SET ${setClauses.join(', ')}, updated_at = NOW()
                WHERE contact_id = $${paramCount}
                RETURNING *`;

            const { rows } = await systemDatabase.query(query, params);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar contato', { 
                errorMessage: error.message,
                errorStack: error.stack,
                contactId,
                data
            });
            throw error;
        }
    }

    async delete(contactId) {
        try {
            const query = 'DELETE FROM person_contacts WHERE contact_id = $1 RETURNING *';
            const { rows } = await systemDatabase.query(query, [contactId]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao excluir contato', { 
                errorMessage: error.message,
                errorStack: error.stack,
                contactId
            });
            throw error;
        }
    }

    async unsetMainContact(personId, contactType, excludeId = null) {
        try {
            let query = `
                UPDATE person_contacts 
                SET is_main = false, updated_at = NOW()
                WHERE person_id = $1 
                AND contact_type = $2 
                AND is_main = true`;
            const params = [personId, contactType];

            if (excludeId) {
                query += ' AND contact_id != $3';
                params.push(excludeId);
            }

            await systemDatabase.query(query, params);
        } catch (error) {
            logger.error('Erro ao remover flag de contato principal', { 
                errorMessage: error.message,
                errorStack: error.stack,
                personId,
                contactType,
                excludeId
            });
            throw error;
        }
    }
}

module.exports = new PersonContactRepository();

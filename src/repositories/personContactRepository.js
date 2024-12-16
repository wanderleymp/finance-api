const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class PersonContactRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            let query = `
                SELECT 
                    pc.person_contact_id as id,
                    pc.person_id,
                    pc.contact_id,
                    p.full_name as person_name,
                    c.contact_type,
                    c.contact_value
                FROM person_contacts pc
                JOIN persons p ON p.person_id = pc.person_id
                JOIN contacts c ON c.contact_id = pc.contact_id
                WHERE 1=1
            `;
            const values = [];
            let paramCount = 1;

            if (filters.person_id) {
                query += ` AND pc.person_id = $${paramCount}`;
                values.push(filters.person_id);
                paramCount++;
            }

            if (filters.contact_type) {
                query += ` AND c.contact_type = $${paramCount}`;
                values.push(filters.contact_type);
                paramCount++;
            }

            query += ` ORDER BY pc.person_contact_id DESC`;

            const result = await this.pool.query(query, values);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar contatos de pessoas', {
                error: error.message,
                filters
            });
            throw error;
        }
    }

    async findById(id) {
        try {
            const query = `
                SELECT 
                    pc.person_contact_id as id,
                    pc.person_id,
                    pc.contact_id,
                    p.full_name as person_name,
                    c.contact_type,
                    c.contact_value
                FROM person_contacts pc
                JOIN persons p ON p.person_id = pc.person_id
                JOIN contacts c ON c.contact_id = pc.contact_id
                WHERE pc.person_contact_id = $1
            `;
            const result = await this.pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar contato de pessoa por ID', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async findByPersonId(personId) {
        try {
            const query = `
                SELECT 
                    pc.person_contact_id as id,
                    pc.person_id,
                    pc.contact_id,
                    c.contact_type,
                    c.contact_value
                FROM person_contacts pc
                JOIN contacts c ON c.contact_id = pc.contact_id
                WHERE pc.person_id = $1
                ORDER BY pc.person_contact_id
            `;
            const result = await this.pool.query(query, [personId]);
            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar contatos da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }

    async create(data) {
        try {
            const query = `
                INSERT INTO person_contacts (
                    person_id,
                    contact_id
                ) VALUES ($1, $2)
                RETURNING *
            `;
            
            const values = [
                data.person_id,
                data.contact_id
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar contato de pessoa', {
                error: error.message,
                data
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            const query = `
                UPDATE person_contacts
                SET 
                    updated_at = NOW()
                WHERE person_contact_id = $1
                RETURNING *
            `;
            
            const values = [
                id
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar contato de pessoa', {
                error: error.message,
                id,
                data
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            const query = 'DELETE FROM person_contacts WHERE person_contact_id = $1 RETURNING *';
            const result = await this.pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao excluir contato de pessoa', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async unsetMainContact(personId, contactType, excludeId = null) {
        try {
            let query = `
                UPDATE person_contacts 
                SET updated_at = CURRENT_TIMESTAMP
                WHERE person_id = $1 
                AND contact_type = $2`;
            const params = [personId, contactType];

            if (excludeId) {
                query += ' AND id != $3';
                params.push(excludeId);
            }

            await this.pool.query(query, params);
        } catch (error) {
            logger.error('Erro ao remover flag de contato principal', { 
                error: error.message,
                personId,
                contactType,
                excludeId
            });
            throw error;
        }
    }
}

module.exports = new PersonContactRepository();

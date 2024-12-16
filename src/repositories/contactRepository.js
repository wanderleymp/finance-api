const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');

class ContactRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const { limit: validLimit, offset } = PaginationHelper.getPaginationParams(page, limit);
            
            let query = `
                SELECT * 
                FROM contacts 
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            if (filters.contact_type) {
                query += ` AND contact_type = $${paramCount}`;
                params.push(filters.contact_type);
                paramCount++;
            }

            if (filters.contact_value) {
                query += ` AND contact_value ILIKE $${paramCount}`;
                params.push(`%${filters.contact_value}%`);
                paramCount++;
            }

            if (filters.search) {
                query += ` AND contact_value ILIKE $${paramCount}`;
                params.push(`%${filters.search}%`);
                paramCount++;
            }

            if (filters.active !== undefined) {
                query += ` AND active = $${paramCount}`;
                params.push(filters.active);
                paramCount++;
            }

            const countQuery = query.replace('*', 'COUNT(*)');
            query += ` ORDER BY contact_id DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(validLimit, offset);

            logger.info('Executando consulta findAll paginada em contacts', { 
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
            const query = 'SELECT * FROM contacts WHERE contact_id = $1';
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

    async findByValue(contactValue, contactType) {
        try {
            const query = `
                SELECT * 
                FROM contacts 
                WHERE contact_value = $1 AND contact_type = $2
            `;
            const { rows } = await systemDatabase.query(query, [contactValue, contactType]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao buscar contato por valor', {
                errorMessage: error.message,
                contactValue,
                contactType
            });
            throw error;
        }
    }

    async create(contactData) {
        const { contact_type, contact_value } = contactData;

        try {
            const query = `
                INSERT INTO contacts 
                (contact_type, contact_value) 
                VALUES ($1, $2) 
                RETURNING *
            `;
            const { rows } = await systemDatabase.query(query, [
                contact_type,
                contact_value
            ]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao criar contato', {
                error: error.message,
                contactData
            });
            throw error;
        }
    }

    async update(contactId, contactData) {
        const { contact_type, contact_value, description, active } = contactData;

        try {
            const query = `
                UPDATE contacts 
                SET contact_type = COALESCE($1, contact_type),
                    contact_value = COALESCE($2, contact_value),
                    description = COALESCE($3, description),
                    active = COALESCE($4, active),
                    updated_at = NOW()
                WHERE contact_id = $5
                RETURNING *
            `;
            const { rows } = await systemDatabase.query(query, [
                contact_type,
                contact_value,
                description,
                active,
                contactId
            ]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar contato', {
                error: error.message,
                contactId,
                contactData
            });
            throw error;
        }
    }

    async delete(contactId) {
        try {
            const query = 'DELETE FROM contacts WHERE contact_id = $1 RETURNING *';
            const { rows } = await systemDatabase.query(query, [contactId]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao deletar contato', {
                error: error.message,
                contactId
            });
            throw error;
        }
    }

    async identifyContactType(contactValue) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        const whatsappRegex = /^(\+?55)?\s?(\d{2})\s?9?\d{4}-?\d{4}$/;

        if (emailRegex.test(contactValue)) {
            return 'email';
        }

        if (whatsappRegex.test(contactValue)) {
            return 'whatsapp';
        }

        if (phoneRegex.test(contactValue)) {
            return 'telefone';
        }

        return 'outros';
    }
}

module.exports = new ContactRepository();

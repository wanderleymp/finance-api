const { pool } = require('../config/database');
const { logger } = require('../middlewares/logger');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { buildPaginationResult } = require('../utils/pagination');

class PersonContactService {
    async listContacts(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT pc.*, p.name as person_name 
                FROM person_contacts pc
                JOIN persons p ON p.id = pc.person_id
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
                query += ` AND pc.contact_type = $${paramCount}`;
                values.push(filters.contact_type);
                paramCount++;
            }

            if (filters.active !== undefined) {
                query += ` AND pc.active = $${paramCount}`;
                values.push(filters.active);
                paramCount++;
            }

            // Count total records
            const countResult = await pool.query(
                query.replace('pc.*, p.name as person_name', 'COUNT(*) as total'),
                values
            );
            const total = parseInt(countResult.rows[0].total);

            // Get paginated data
            query += ` ORDER BY pc.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            values.push(limit, offset);

            const result = await pool.query(query, values);

            return buildPaginationResult(result.rows, page, limit, total);
        } catch (error) {
            logger.error('Erro ao listar contatos', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async getContact(id) {
        try {
            const result = await pool.query(
                `SELECT pc.*, p.name as person_name 
                FROM person_contacts pc
                JOIN persons p ON p.id = pc.person_id
                WHERE pc.id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                throw new NotFoundError('Contato não encontrado');
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar contato', {
                errorMessage: error.message,
                errorStack: error.stack,
                contactId: id
            });
            throw error;
        }
    }

    async createContact(contactData) {
        try {
            // Verificar se a pessoa existe
            const personExists = await pool.query(
                'SELECT id FROM persons WHERE id = $1',
                [contactData.person_id]
            );

            if (personExists.rows.length === 0) {
                throw new ValidationError('Pessoa não encontrada');
            }

            // Se is_main for true, desativar outros contatos principais do mesmo tipo
            if (contactData.is_main) {
                await pool.query(
                    `UPDATE person_contacts 
                    SET is_main = false 
                    WHERE person_id = $1 
                    AND contact_type = $2 
                    AND is_main = true`,
                    [contactData.person_id, contactData.contact_type]
                );
            }

            const result = await pool.query(
                `INSERT INTO person_contacts 
                (person_id, contact_type, contact_value, description, is_main, active) 
                VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING *`,
                [
                    contactData.person_id,
                    contactData.contact_type,
                    contactData.contact_value,
                    contactData.description,
                    contactData.is_main,
                    contactData.active
                ]
            );

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar contato', {
                errorMessage: error.message,
                errorStack: error.stack,
                contactData
            });
            throw error;
        }
    }

    async updateContact(id, contactData) {
        try {
            // Verificar se o contato existe
            const existingContact = await this.getContact(id);

            // Se person_id foi alterado, verificar se a nova pessoa existe
            if (contactData.person_id && contactData.person_id !== existingContact.person_id) {
                const personExists = await pool.query(
                    'SELECT id FROM persons WHERE id = $1',
                    [contactData.person_id]
                );

                if (personExists.rows.length === 0) {
                    throw new ValidationError('Pessoa não encontrada');
                }
            }

            // Se is_main for true, desativar outros contatos principais do mesmo tipo
            if (contactData.is_main) {
                await pool.query(
                    `UPDATE person_contacts 
                    SET is_main = false 
                    WHERE person_id = $1 
                    AND contact_type = $2 
                    AND id != $3 
                    AND is_main = true`,
                    [
                        contactData.person_id || existingContact.person_id,
                        contactData.contact_type || existingContact.contact_type,
                        id
                    ]
                );
            }

            const updateFields = [];
            const values = [];
            let paramCount = 1;

            for (const [key, value] of Object.entries(contactData)) {
                if (value !== undefined) {
                    updateFields.push(`${key} = $${paramCount}`);
                    values.push(value);
                    paramCount++;
                }
            }

            if (updateFields.length === 0) {
                return existingContact;
            }

            values.push(id);
            const query = `
                UPDATE person_contacts 
                SET ${updateFields.join(', ')}, 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = $${paramCount} 
                RETURNING *
            `;

            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar contato', {
                errorMessage: error.message,
                errorStack: error.stack,
                contactId: id,
                contactData
            });
            throw error;
        }
    }

    async deleteContact(id) {
        try {
            const result = await pool.query(
                'DELETE FROM person_contacts WHERE id = $1 RETURNING *',
                [id]
            );

            if (result.rows.length === 0) {
                throw new NotFoundError('Contato não encontrado');
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao excluir contato', {
                errorMessage: error.message,
                errorStack: error.stack,
                contactId: id
            });
            throw error;
        }
    }

    async toggleActive(id) {
        try {
            const result = await pool.query(
                `UPDATE person_contacts 
                SET active = NOT active, 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = $1 
                RETURNING *`,
                [id]
            );

            if (result.rows.length === 0) {
                throw new NotFoundError('Contato não encontrado');
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao alternar status do contato', {
                errorMessage: error.message,
                errorStack: error.stack,
                contactId: id
            });
            throw error;
        }
    }

    async setMain(id) {
        try {
            const contact = await this.getContact(id);

            // Desativar outros contatos principais do mesmo tipo
            await pool.query(
                `UPDATE person_contacts 
                SET is_main = false 
                WHERE person_id = $1 
                AND contact_type = $2 
                AND id != $3 
                AND is_main = true`,
                [contact.person_id, contact.contact_type, id]
            );

            // Definir este contato como principal
            const result = await pool.query(
                `UPDATE person_contacts 
                SET is_main = true, 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = $1 
                RETURNING *`,
                [id]
            );

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao definir contato como principal', {
                errorMessage: error.message,
                errorStack: error.stack,
                contactId: id
            });
            throw error;
        }
    }
}

module.exports = new PersonContactService();

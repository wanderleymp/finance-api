const { systemDatabase } = require('../../config/database');
const { logger } = require('../../middlewares/logger');
const IPersonContactRepository = require('./interfaces/person-contact-repository.interface');

class PersonContactRepository extends IPersonContactRepository {
    constructor() {
        super();
        this.pool = systemDatabase.pool;
        this.tableName = 'person_contacts';
    }

    /**
     * Busca contatos de uma pessoa
     * @param {number} personId - ID da pessoa
     * @returns {Promise<Array>} Lista de contatos
     */
    async findByPersonId(personId) {
        try {
            const query = `
                SELECT * FROM ${this.tableName}
                WHERE person_id = $1
                ORDER BY is_main DESC, created_at DESC
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

    /**
     * Busca contato principal de uma pessoa
     * @param {number} personId - ID da pessoa
     * @returns {Promise<Object|null>} Contato principal ou null
     */
    async findMainContactByPersonId(personId) {
        try {
            const query = `
                SELECT * FROM ${this.tableName}
                WHERE person_id = $1 AND is_main = true
                LIMIT 1
            `;

            const result = await this.pool.query(query, [personId]);
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar contato principal da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }

    /**
     * Cria um novo contato para uma pessoa
     * @param {Object} contactData - Dados do contato
     * @returns {Promise<Object>} Contato criado
     */
    async create(contactData) {
        try {
            // Se definir como principal, remove principal anterior
            if (contactData.is_main) {
                await this.clearMainContact(contactData.person_id);
            }

            const query = `
                INSERT INTO ${this.tableName} (
                    person_id, 
                    type, 
                    contact, 
                    is_main
                ) VALUES (
                    $1, $2, $3, $4
                ) RETURNING *
            `;

            const values = [
                contactData.person_id,
                contactData.type,
                contactData.contact,
                contactData.is_main || false
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar contato', {
                error: error.message,
                contactData
            });
            throw error;
        }
    }

    /**
     * Atualiza um contato
     * @param {number} contactId - ID do contato
     * @param {Object} contactData - Dados atualizados
     * @returns {Promise<Object>} Contato atualizado
     */
    async update(contactId, contactData) {
        try {
            // Se definir como principal, remove principal anterior
            if (contactData.is_main) {
                const currentContact = await this.findById(contactId);
                await this.clearMainContact(currentContact.person_id);
            }

            const query = `
                UPDATE ${this.tableName}
                SET 
                    type = COALESCE($1, type),
                    contact = COALESCE($2, contact),
                    is_main = COALESCE($3, is_main),
                    updated_at = NOW()
                WHERE id = $4
                RETURNING *
            `;

            const values = [
                contactData.type || null,
                contactData.contact || null,
                contactData.is_main !== undefined ? contactData.is_main : null,
                contactId
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar contato', {
                error: error.message,
                contactId,
                contactData
            });
            throw error;
        }
    }

    /**
     * Remove um contato
     * @param {number} contactId - ID do contato
     * @returns {Promise<Object>} Contato removido
     */
    async delete(contactId) {
        try {
            const query = `
                DELETE FROM ${this.tableName}
                WHERE id = $1
                RETURNING *
            `;

            const result = await this.pool.query(query, [contactId]);
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao remover contato', {
                error: error.message,
                contactId
            });
            throw error;
        }
    }

    /**
     * Limpa contato principal de uma pessoa
     * @param {number} personId - ID da pessoa
     * @private
     */
    async clearMainContact(personId) {
        try {
            const query = `
                UPDATE ${this.tableName}
                SET is_main = false
                WHERE person_id = $1 AND is_main = true
            `;

            await this.pool.query(query, [personId]);
        } catch (error) {
            logger.error('Erro ao limpar contato principal', {
                error: error.message,
                personId
            });
            throw error;
        }
    }

    /**
     * Busca contato por ID
     * @param {number} contactId - ID do contato
     * @returns {Promise<Object|null>} Contato ou null
     */
    async findById(contactId) {
        try {
            const query = `
                SELECT * FROM ${this.tableName}
                WHERE id = $1
            `;

            const result = await this.pool.query(query, [contactId]);
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar contato por ID', {
                error: error.message,
                contactId
            });
            throw error;
        }
    }
}

module.exports = PersonContactRepository;

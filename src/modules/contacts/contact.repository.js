const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');
const ContactResponseDTO = require('./dto/contact-response.dto');

class ContactRepository extends BaseRepository {
    constructor() {
        super('contacts', 'contact_id');
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            logger.debug('Repository findAll - params:', {
                page,
                limit,
                filters
            });

            const result = await super.findAll(page, limit, filters);

            logger.debug('Repository findAll - base result:', {
                result
            });

            return {
                data: result.data.map(ContactResponseDTO.fromDatabase),
                pagination: result.pagination
            };
        } catch (error) {
            logger.error('Erro ao buscar contatos', {
                error: error.message,
                filters,
                page,
                limit
            });
            throw error;
        }
    }

    async findById(id) {
        try {
            const result = await super.findById(id);
            return result ? ContactResponseDTO.fromDatabase(result) : null;
        } catch (error) {
            logger.error('Erro ao buscar contato por ID', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async findByPersonId(personId) {
        try {
            const query = `
                SELECT c.*
                FROM contacts c
                INNER JOIN person_contacts pc ON c.contact_id = pc.contact_id
                WHERE pc.person_id = $1
                ORDER BY c.created_at DESC
            `;
            
            const result = await this.pool.query(query, [personId]);
            return result.rows.map(ContactResponseDTO.fromDatabase);
        } catch (error) {
            logger.error('Erro ao buscar contatos por pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }

    async create(data) {
        try {
            const result = await super.create(data);
            return ContactResponseDTO.fromDatabase(result);
        } catch (error) {
            logger.error('Erro ao criar contato', {
                error: error.message,
                data
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            const result = await super.update(id, data);
            return result ? ContactResponseDTO.fromDatabase(result) : null;
        } catch (error) {
            logger.error('Erro ao atualizar contato', {
                error: error.message,
                id,
                data
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            return await super.delete(id);
        } catch (error) {
            logger.error('Erro ao deletar contato', {
                error: error.message,
                id
            });
            throw error;
        }
    }
}

module.exports = ContactRepository;

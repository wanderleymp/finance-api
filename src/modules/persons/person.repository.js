const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');

class PersonRepository extends BaseRepository {
    constructor() {
        super('persons', 'person_id');
    }

    /**
     * Busca os contatos de uma pessoa
     */
    async findContacts(personId) {
        try {
            const query = `
                SELECT 
                    c.contact_id,
                    c.contact_type,
                    c.contact_value,
                    pc.is_main,
                    pc.active
                FROM contacts c
                JOIN person_contacts pc ON pc.contact_id = c.contact_id
                WHERE pc.person_id = $1
                ORDER BY pc.is_main DESC, c.contact_type
            `;

            const { rows } = await this.pool.query(query, [personId]);
            return rows;
        } catch (error) {
            logger.error('Erro ao buscar contatos da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }
}

module.exports = PersonRepository;

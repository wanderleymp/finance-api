const { logger } = require('../../middlewares/logger');

class PersonService {
    constructor({ personRepository }) {
        this.personRepository = personRepository;
    }

    async findById(id) {
        try {
            return await this.personRepository.findById(id);
        } catch (error) {
            logger.error('Erro ao buscar pessoa por ID', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async findContacts(personId) {
        try {
            return await this.personRepository.findContacts(personId);
        } catch (error) {
            logger.error('Erro ao buscar contatos da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }
}

module.exports = PersonService;

const { logger } = require('../../middlewares/logger');
const PersonContactRepository = require('./person-contact.repository');
const PersonContactResponseDTO = require('./dto/person-contact-response.dto');

class PersonContactService {
    constructor({ 
        personContactRepository = new PersonContactRepository(), 
    } = {}) {
        this.personContactRepository = personContactRepository;
    }

    /**
     * Lista todos os person-contacts com paginação
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const result = await this.personContactRepository.findAll(page, limit, filters);

            // Converte para DTO
            const dtoResult = {
                items: result.items.map(item => PersonContactResponseDTO.fromDatabase(item)),
                meta: result.meta || {
                    page,
                    limit,
                    total: result.items.length
                }
            };

            return dtoResult;
        } catch (error) {
            logger.error('Erro ao listar person-contacts', {
                error: error.message,
                page,
                limit,
                filters
            });
            throw error;
        }
    }

    /**
     * Busca um person-contact específico
     */
    async findById(id) {
        try {
            const result = await this.personContactRepository.findById(id);

            // Converte para DTO
            const dto = PersonContactResponseDTO.fromDatabase(result);

            return dto;
        } catch (error) {
            logger.error('Erro ao buscar person-contact', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    /**
     * Lista contatos de uma pessoa
     */
    async findByPersonId(personId) {
        try {
            const result = await this.personContactRepository.findByPersonId(personId);

            // Converte para DTO
            return {
                items: result.items.map(item => PersonContactResponseDTO.fromDatabase(item)),
                meta: {
                    totalItems: result.total,
                    itemCount: result.total,
                    itemsPerPage: result.total,
                    totalPages: 1,
                    currentPage: 1
                }
            };
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
            const mainContact = await this.personContactRepository.findMainContactByPersonId(personId);

            if (mainContact) {
                // Converte para DTO
                const dto = PersonContactResponseDTO.fromDatabase(mainContact);

                return dto;
            }

            return null;
        } catch (error) {
            logger.error('Erro ao buscar contato principal da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }

    /**
     * Busca um vínculo específico entre pessoa e contato
     */
    async findByPersonAndContact(personId, contactId, { client } = {}) {
        try {
            const result = await this.personContactRepository.findByPersonAndContact(personId, contactId, { client });

            if (result) {
                // Converte para DTO
                const dto = PersonContactResponseDTO.fromDatabase(result);

                return dto;
            }

            return null;
        } catch (error) {
            logger.error('Erro ao buscar vínculo pessoa-contato', {
                error: error.message,
                personId,
                contactId
            });
            throw error;
        }
    }

    /**
     * Cria uma nova associação entre pessoa e contato
     */
    async create(data, { client } = {}) {
        try {
            const result = await this.personContactRepository.create(data, { client });

            // Converte para DTO
            const dto = PersonContactResponseDTO.fromDatabase(result);

            return dto;
        } catch (error) {
            logger.error('Erro ao criar person-contact', {
                error: error.message,
                data
            });
            throw error;
        }
    }

    /**
     * Atualiza um contato
     * @param {number} contactId - ID do contato
     * @param {Object} contactData - Dados atualizados
     * @param {Object} req - Objeto de requisição (opcional)
     * @returns {Promise<Object>} Contato atualizado
     */
    async update(contactId, contactData, req = {}) {
        try {
            // Valida dados
            const validatedData = contactData;

            const updatedContact = await this.personContactRepository.update(contactId, validatedData);

            // Converte para DTO
            const dto = PersonContactResponseDTO.fromDatabase(updatedContact);

            logger.info('Contato atualizado', { 
                contactId, 
                personId: updatedContact.person_id,
                userContext: req.user?.id 
            });

            return dto;
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
     * Remove uma associação entre pessoa e contato
     */
    async delete(id) {
        try {
            const personContact = await this.personContactRepository.findById(id);
            if (!personContact) {
                return null;
            }

            const result = await this.personContactRepository.delete(id);

            // Converte para DTO
            const dto = PersonContactResponseDTO.fromDatabase(result);

            return dto;
        } catch (error) {
            logger.error('Erro ao deletar person-contact', {
                error: error.message,
                id
            });
            throw error;
        }
    }
}

module.exports = PersonContactService;

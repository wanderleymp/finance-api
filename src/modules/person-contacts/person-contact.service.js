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
            const cacheKey = `person-contacts:list:${JSON.stringify({page, limit, filters})}`;
            
            // Tenta buscar do cache
            if (cachedResult) {
                return cachedResult;
            }

            const result = await this.personContactRepository.findAll(page, limit, filters);

            // Converte para DTO
            const dtoResult = {
                items: result.items.map(item => PersonContactResponseDTO.fromDatabase(item)),
                meta: result.meta
            };

            // Salva no cache por 5 minutos

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
            const cacheKey = `person-contacts:${id}`;
            
            // Tenta buscar do cache
            if (cachedResult) {
                return cachedResult;
            }

            const result = await this.personContactRepository.findById(id);

            // Converte para DTO
            const dto = PersonContactResponseDTO.fromDatabase(result);

            // Salva no cache por 1 hora

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
     * Lista contatos de uma pessoa com paginação
     */
    async findByPersonId(personId, page = 1, limit = 10) {
        try {
            const cacheKey = `person-contacts:person:${personId}:${page}:${limit}`;
            
            // Tenta buscar do cache
            if (cachedResult) {
                return cachedResult;
            }

            const result = await this.personContactRepository.findByPersonId(personId, page, limit);

            // Converte para DTO
            const dtoResult = {
                items: result.items.map(item => PersonContactResponseDTO.fromDatabase(item)),
                meta: result.meta
            };

            // Salva no cache por 1 hora

            return dtoResult;
        } catch (error) {
            logger.error('Erro ao buscar contatos da pessoa', {
                error: error.message,
                personId,
                page,
                limit
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
            const cacheKey = `person-main-contact:${personId}`;
            
            // Tenta buscar do cache
            if (cachedMainContact) {
                return cachedMainContact;
            }

            const mainContact = await this.personContactRepository.findMainContactByPersonId(personId);

            if (mainContact) {
                // Converte para DTO
                const dto = PersonContactResponseDTO.fromDatabase(mainContact);

                // Salva no cache por 1 hora

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
            const cacheKey = `person-contacts:person:${personId}:contact:${contactId}`;
            
            // Se estamos em uma transação, não usa cache
            if (client) {
                return await this.personContactRepository.findByPersonAndContact(personId, contactId, { client });
            }

            // Tenta buscar do cache
            if (cachedResult) {
                return cachedResult;
            }

            const result = await this.personContactRepository.findByPersonAndContact(personId, contactId);

            if (result) {
                // Converte para DTO
                const dto = PersonContactResponseDTO.fromDatabase(result);

                // Salva no cache por 1 hora

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

            // Se não estamos em uma transação, invalida os caches
            if (!client) {
                await Promise.all([
                ]);
            }

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

            // Limpa cache de contatos da pessoa

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

            // Invalida caches
            await Promise.all([
            ]);

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

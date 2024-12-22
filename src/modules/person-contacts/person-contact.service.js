const { logger } = require('../../middlewares/logger');
const PersonContactRepository = require('./person-contact.repository');
const CacheService = require('../../services/cacheService');

class PersonContactService {
    constructor({ 
        personContactRepository = new PersonContactRepository(), 
        cacheService = CacheService 
    } = {}) {
        this.personContactRepository = personContactRepository;
        this.cacheService = cacheService;
    }

    /**
     * Lista todos os person-contacts com paginação
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const cacheKey = `person-contacts:list:${JSON.stringify({page, limit, filters})}`;
            
            // Tenta buscar do cache
            const cachedResult = await this.cacheService.get(cacheKey);
            if (cachedResult) {
                return cachedResult;
            }

            const result = await this.personContactRepository.findAll(page, limit, filters);

            // Salva no cache por 5 minutos
            await this.cacheService.set(cacheKey, result, 300);

            return result;
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
            const cachedResult = await this.cacheService.get(cacheKey);
            if (cachedResult) {
                return cachedResult;
            }

            const result = await this.personContactRepository.findById(id);

            if (result) {
                // Salva no cache por 1 hora
                await this.cacheService.set(cacheKey, result, 3600);
            }

            return result;
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
            const cachedResult = await this.cacheService.get(cacheKey);
            if (cachedResult) {
                return cachedResult;
            }

            const result = await this.personContactRepository.findByPersonId(personId, page, limit);

            // Salva no cache por 1 hora
            await this.cacheService.set(cacheKey, result, 3600);

            return result;
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
            const cachedMainContact = await this.cacheService.get(cacheKey);
            if (cachedMainContact) {
                return cachedMainContact;
            }

            const mainContact = await this.personContactRepository.findMainContactByPersonId(personId);

            if (mainContact) {
                // Salva no cache por 1 hora
                await this.cacheService.set(cacheKey, mainContact, 3600);
            }

            return mainContact;
        } catch (error) {
            logger.error('Erro ao buscar contato principal da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }

    /**
     * Cria uma nova associação entre pessoa e contato
     */
    async create(data) {
        try {
            const result = await this.personContactRepository.create({
                person_id: data.person_id,
                contact_id: data.contact_id
            });

            // Invalida caches
            await Promise.all([
                this.cacheService.del('person-contacts:list:*'),
                this.cacheService.del(`person-contacts:person:${data.person_id}:*`)
            ]);

            return result;
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

            // Limpa cache de contatos da pessoa
            await this.cacheService.delete(`person-contacts:${updatedContact.person_id}:*`);
            await this.cacheService.delete(`person-main-contact:${updatedContact.person_id}`);

            logger.info('Contato atualizado', { 
                contactId, 
                personId: updatedContact.person_id,
                userContext: req.user?.id 
            });

            return updatedContact;
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

            // Invalida caches
            await Promise.all([
                this.cacheService.del('person-contacts:list:*'),
                this.cacheService.del(`person-contacts:person:${personContact.person_id}:*`),
                this.cacheService.del(`person-contacts:${id}`)
            ]);

            return result;
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

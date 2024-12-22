const { logger } = require('../../middlewares/logger');
const PersonContactRepository = require('./person-contact.repository');
const CacheService = require('../../services/cacheService');
const CreatePersonContactDTO = require('./dto/create-person-contact.dto');
const UpdatePersonContactDTO = require('./dto/update-person-contact.dto');

class PersonContactService {
    constructor({ 
        personContactRepository = new PersonContactRepository(), 
        cacheService = CacheService 
    } = {}) {
        this.personContactRepository = personContactRepository;
        this.cacheService = cacheService;
    }

    /**
     * Busca contatos de uma pessoa
     * @param {number} personId - ID da pessoa
     * @returns {Promise<Array>} Lista de contatos
     */
    async findByPersonId(personId) {
        try {
            const cacheKey = `person-contacts:${personId}`;
            
            // Tenta buscar do cache
            const cachedContacts = await this.cacheService.get(cacheKey);
            if (cachedContacts) {
                return cachedContacts;
            }

            const contacts = await this.personContactRepository.findByPersonId(personId);

            // Salva no cache por 1 hora
            await this.cacheService.set(cacheKey, contacts, 3600);

            return contacts;
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
     * Cria um novo contato para uma pessoa
     * @param {Object} contactData - Dados do contato
     * @param {Object} req - Objeto de requisição (opcional)
     * @returns {Promise<Object>} Contato criado
     */
    async create(contactData, req = {}) {
        try {
            // Valida dados
            const validatedData = CreatePersonContactDTO.validate(contactData);

            const newContact = await this.personContactRepository.create(validatedData);

            // Limpa cache de contatos da pessoa
            await this.cacheService.delete(`person-contacts:${validatedData.person_id}`);
            await this.cacheService.delete(`person-main-contact:${validatedData.person_id}`);

            logger.info('Contato criado', { 
                contactId: newContact.id, 
                personId: validatedData.person_id,
                userContext: req.user?.id 
            });

            return newContact;
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
     * @param {Object} req - Objeto de requisição (opcional)
     * @returns {Promise<Object>} Contato atualizado
     */
    async update(contactId, contactData, req = {}) {
        try {
            // Valida dados
            const validatedData = UpdatePersonContactDTO.validate(contactData);

            const updatedContact = await this.personContactRepository.update(contactId, validatedData);

            // Limpa cache de contatos da pessoa
            await this.cacheService.delete(`person-contacts:${updatedContact.person_id}`);
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
     * Remove um contato
     * @param {number} contactId - ID do contato
     * @param {Object} req - Objeto de requisição (opcional)
     * @returns {Promise<Object>} Contato removido
     */
    async delete(contactId, req = {}) {
        try {
            const contactToDelete = await this.personContactRepository.findById(contactId);

            if (!contactToDelete) {
                throw new Error('Contato não encontrado');
            }

            const deletedContact = await this.personContactRepository.delete(contactId);

            // Limpa cache de contatos da pessoa
            await this.cacheService.delete(`person-contacts:${contactToDelete.person_id}`);
            await this.cacheService.delete(`person-main-contact:${contactToDelete.person_id}`);

            logger.info('Contato removido', { 
                contactId, 
                personId: contactToDelete.person_id,
                userContext: req.user?.id 
            });

            return deletedContact;
        } catch (error) {
            logger.error('Erro ao remover contato', {
                error: error.message,
                contactId
            });
            throw error;
        }
    }
}

module.exports = PersonContactService;

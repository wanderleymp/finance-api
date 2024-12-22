const { logger } = require('../../middlewares/logger');
const ContactRepository = require('./contact.repository');
const CacheService = require('../../services/cacheService');
const ContactValidator = require('./validators/contact.validator');
const CreateContactDTO = require('./dto/create-contact.dto');
const UpdateContactDTO = require('./dto/update-contact.dto');

class ContactService {
    constructor({ 
        contactRepository = new ContactRepository(), 
        cacheService = CacheService 
    } = {}) {
        this.contactRepository = contactRepository;
        this.cacheService = cacheService;
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const cacheKey = `contacts:list:${JSON.stringify(filters)}:page:${page}:limit:${limit}`;
            
            // Tenta buscar do cache
            const cachedResult = await this.cacheService.get(cacheKey);
            if (cachedResult) {
                logger.info('Retornando contatos do cache', { cacheKey });
                return cachedResult;
            }

            const result = await this.contactRepository.findAll(filters, page, limit);
            
            // Salva no cache
            await this.cacheService.set(cacheKey, result);

            return result;
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
            const cacheKey = `contact:${id}`;
            
            // Tenta buscar do cache
            const cachedContact = await this.cacheService.get(cacheKey);
            if (cachedContact) {
                logger.info('Retornando contato do cache', { cacheKey });
                return cachedContact;
            }

            const contact = await this.contactRepository.findById(id);
            
            if (!contact) {
                logger.warn('Contato não encontrado', { id });
                return null;
            }

            // Salva no cache
            await this.cacheService.set(cacheKey, contact);

            return contact;
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
            const cacheKey = `person:${personId}:contacts`;
            
            // Tenta buscar do cache
            const cachedContacts = await this.cacheService.get(cacheKey);
            if (cachedContacts) {
                logger.info('Retornando contatos da pessoa do cache', { cacheKey });
                return cachedContacts;
            }

            const contacts = await this.contactRepository.findByPersonId(personId);
            
            // Salva no cache
            await this.cacheService.set(cacheKey, contacts);

            return contacts;
        } catch (error) {
            logger.error('Erro ao buscar contatos da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }

    async findMainContactByPersonId(personId) {
        try {
            const cacheKey = `person:${personId}:main_contact`;
            
            // Tenta buscar do cache
            const cachedMainContact = await this.cacheService.get(cacheKey);
            if (cachedMainContact) {
                logger.info('Retornando contato principal da pessoa do cache', { cacheKey });
                return cachedMainContact;
            }

            const mainContact = await this.contactRepository.findMainContactByPersonId(personId);
            
            // Salva no cache
            if (mainContact) {
                await this.cacheService.set(cacheKey, mainContact);
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

    async create(contactData, req = {}) {
        try {
            // Valida e transforma os dados
            const createDTO = new CreateContactDTO(contactData);
            const { error } = createDTO.validate(require('./schemas/contact.schema'));
            
            if (error) {
                logger.warn('Dados de contato inválidos', { 
                    error: error.message,
                    data: contactData 
                });
                throw new Error(error.message);
            }

            // Valida tipo de contato
            ContactValidator.validateContactType(createDTO.type);

            // Validações específicas por tipo de contato
            switch(createDTO.type) {
                case 'email':
                    ContactValidator.validateEmail(createDTO.contact);
                    break;
                case 'phone':
                case 'whatsapp':
                    ContactValidator.validatePhoneNumber(createDTO.contact);
                    break;
            }

            // Verifica se já existe contato principal para a pessoa
            const existingMainContact = await this.findMainContactByPersonId(createDTO.person_id);
            
            // Se não existir contato principal, define o novo como principal
            if (!existingMainContact) {
                createDTO.is_main = true;
            }

            // Cria o contato
            const newContact = await this.contactRepository.create(createDTO);

            // Limpa cache relacionado
            await this.cacheService.delete(`person:${createDTO.person_id}:contacts`);
            
            logger.info('Contato criado com sucesso', { 
                contactId: newContact.id,
                personId: createDTO.person_id 
            });

            return newContact;
        } catch (error) {
            logger.error('Erro ao criar contato', {
                error: error.message,
                data: contactData
            });
            throw error;
        }
    }

    async update(id, contactData, req = {}) {
        try {
            // Primeiro, verifica se o contato existe
            const existingContact = await this.findById(id);
            
            if (!existingContact) {
                logger.warn('Tentativa de atualizar contato inexistente', { id });
                throw new Error('Contato não encontrado');
            }

            // Valida e transforma os dados
            const updateDTO = new UpdateContactDTO(contactData);
            const { error } = updateDTO.validate(require('./schemas/contact.schema'));
            
            if (error) {
                logger.warn('Dados de atualização de contato inválidos', { 
                    error: error.message,
                    data: contactData 
                });
                throw new Error(error.message);
            }

            // Valida tipo de contato, se fornecido
            if (updateDTO.type) {
                ContactValidator.validateContactType(updateDTO.type);
            }

            // Validações específicas por tipo de contato
            if (updateDTO.contact) {
                switch(updateDTO.type || existingContact.type) {
                    case 'email':
                        ContactValidator.validateEmail(updateDTO.contact);
                        break;
                    case 'phone':
                    case 'whatsapp':
                        ContactValidator.validatePhoneNumber(updateDTO.contact);
                        break;
                }
            }

            // Atualiza o contato
            const updatedContact = await this.contactRepository.update(id, updateDTO);

            // Limpa cache relacionado
            await Promise.all([
                this.cacheService.delete(`contact:${id}`),
                this.cacheService.delete(`person:${existingContact.person_id}:contacts`),
                this.cacheService.delete(`person:${existingContact.person_id}:main_contact`)
            ]);

            logger.info('Contato atualizado com sucesso', { 
                contactId: id,
                personId: existingContact.person_id 
            });

            return updatedContact;
        } catch (error) {
            logger.error('Erro ao atualizar contato', {
                error: error.message,
                id,
                data: contactData
            });
            throw error;
        }
    }

    async delete(id, req = {}) {
        try {
            // Primeiro, verifica se o contato existe
            const existingContact = await this.findById(id);
            
            if (!existingContact) {
                logger.warn('Tentativa de deletar contato inexistente', { id });
                throw new Error('Contato não encontrado');
            }

            // Impede deleção do contato principal
            if (existingContact.is_main) {
                logger.warn('Tentativa de deletar contato principal', { id });
                throw new Error('Não é possível deletar o contato principal');
            }

            // Deleta o contato
            const deletedContact = await this.contactRepository.delete(id);

            // Limpa cache relacionado
            await Promise.all([
                this.cacheService.delete(`contact:${id}`),
                this.cacheService.delete(`person:${existingContact.person_id}:contacts`),
                this.cacheService.delete(`person:${existingContact.person_id}:main_contact`)
            ]);

            logger.info('Contato deletado com sucesso', { 
                contactId: id,
                personId: existingContact.person_id 
            });

            return deletedContact;
        } catch (error) {
            logger.error('Erro ao deletar contato', {
                error: error.message,
                id
            });
            throw error;
        }
    }
}

module.exports = ContactService;

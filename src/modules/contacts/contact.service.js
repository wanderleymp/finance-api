const { logger } = require('../../middlewares/logger');
const ContactRepository = require('./contact.repository');
const cacheService = require('../../services/cacheService');
const ContactValidator = require('./validators/contact.validator');
const CreateContactDTO = require('./dto/create-contact.dto');
const UpdateContactDTO = require('./dto/update-contact.dto');
const { ValidationError } = require('../../utils/errors');

class ContactService {
    constructor({ 
        contactRepository = new ContactRepository(), 
        cacheService 
    } = {}) {
        this.contactRepository = contactRepository;
        this.cacheService = cacheService || require('../../services/cacheService');
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            logger.debug('Service findAll - params:', {
                page,
                limit,
                filters
            });

            // Garante que page e limit são números
            const parsedPage = parseInt(page) || 1;
            const parsedLimit = parseInt(limit) || 10;

            // Gera uma chave única para o cache
            const cacheKey = `contacts:list:${JSON.stringify({
                page: parsedPage,
                limit: parsedLimit,
                filters
            })}`;
            
            // Tenta buscar do cache
            try {
                const cachedResult = await this.cacheService.get(cacheKey);
                if (cachedResult) {
                    logger.info('Retornando contatos do cache', { cacheKey });
                    return cachedResult;
                }
            } catch (cacheError) {
                logger.warn('Falha ao buscar do cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }
            
            const result = await this.contactRepository.findAll(
                parsedPage,
                parsedLimit,
                filters
            );

            logger.debug('Service findAll - result:', {
                result
            });

            // Salva no cache com TTL reduzido
            try {
                await this.cacheService.set(cacheKey, result, 300); // 5 minutos
            } catch (cacheError) {
                logger.warn('Falha ao salvar no cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

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
            logger.debug('Service findById - params:', {
                id
            });

            const cacheKey = `contact:${id}`;
            
            // Tenta buscar do cache
            try {
                const cachedContact = await this.cacheService.get(cacheKey);
                if (cachedContact) {
                    logger.info('Retornando contato do cache', { cacheKey });
                    return cachedContact;
                }
            } catch (cacheError) {
                logger.warn('Falha ao buscar do cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            const contact = await this.contactRepository.findById(id);
            
            if (!contact) {
                throw new ValidationError('Contato não encontrado', 404);
            }

            // Salva no cache
            try {
                await this.cacheService.set(cacheKey, contact, 3600); // 1 hora
            } catch (cacheError) {
                logger.warn('Falha ao salvar no cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            logger.debug('Service findById - result:', {
                contact
            });

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
            logger.debug('Service findByPersonId - params:', {
                personId
            });

            const cacheKey = `person:${personId}:contacts`;
            
            // Tenta buscar do cache
            try {
                const cachedContacts = await this.cacheService.get(cacheKey);
                if (cachedContacts) {
                    logger.info('Retornando contatos da pessoa do cache', { cacheKey });
                    return cachedContacts;
                }
            } catch (cacheError) {
                logger.warn('Falha ao buscar do cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            const contacts = await this.contactRepository.findByPersonId(personId);
            
            // Salva no cache
            try {
                await this.cacheService.set(cacheKey, contacts, 1800); // 30 minutos
            } catch (cacheError) {
                logger.warn('Falha ao salvar no cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            logger.debug('Service findByPersonId - result:', {
                contacts
            });

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
            logger.debug('Service findMainContactByPersonId - params:', {
                personId
            });

            const cacheKey = `person:${personId}:main_contact`;
            
            // Tenta buscar do cache
            try {
                const cachedContact = await this.cacheService.get(cacheKey);
                if (cachedContact) {
                    logger.info('Retornando contato principal do cache', { cacheKey });
                    return cachedContact;
                }
            } catch (cacheError) {
                logger.warn('Falha ao buscar do cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            const contact = await this.contactRepository.findMainContactByPersonId(personId);
            
            // Salva no cache
            try {
                await this.cacheService.set(cacheKey, contact, 1800); // 30 minutos
            } catch (cacheError) {
                logger.warn('Falha ao salvar no cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            logger.debug('Service findMainContactByPersonId - result:', {
                contact
            });

            return contact;
        } catch (error) {
            logger.error('Erro ao buscar contato principal da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }

    async create(contactData) {
        try {
            logger.debug('Service create - params:', {
                contactData
            });

            // Valida os dados
            const createDTO = new CreateContactDTO(contactData);
            const validationResult = await ContactValidator.validateCreate(createDTO);

            if (!validationResult.isValid) {
                throw new ValidationError('Dados inválidos', 400, validationResult.errors);
            }

            // Verifica se já existe um contato principal para a pessoa
            if (createDTO.is_main) {
                await this.unsetMainContact(createDTO.person_id);
            }

            // Cria o contato
            const newContact = await this.contactRepository.create(createDTO);

            // Invalida caches relacionados
            try {
                await Promise.all([
                    this.cacheService.delete(`person:${createDTO.person_id}:contacts`),
                    this.cacheService.delete(`person:${createDTO.person_id}:main_contact`)
                ]);
            } catch (cacheError) {
                logger.warn('Falha ao invalidar cache', { 
                    error: cacheError.message,
                    personId: createDTO.person_id 
                });
            }

            logger.debug('Service create - result:', {
                newContact
            });

            logger.info('Contato criado com sucesso', { 
                contactId: newContact.id,
                personId: createDTO.person_id 
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

    async update(id, contactData) {
        try {
            logger.debug('Service update - params:', {
                id,
                contactData
            });

            // Busca o contato existente
            const existingContact = await this.findById(id);
            
            if (!existingContact) {
                throw new ValidationError('Contato não encontrado', 404);
            }

            // Valida os dados
            const updateDTO = new UpdateContactDTO({
                ...existingContact,
                ...contactData
            });

            const validationResult = await ContactValidator.validateUpdate(updateDTO);

            if (!validationResult.isValid) {
                throw new ValidationError('Dados inválidos', 400, validationResult.errors);
            }

            // Se está definindo como principal, remove o principal anterior
            if (updateDTO.is_main && !existingContact.is_main) {
                await this.unsetMainContact(existingContact.person_id);
            }

            // Atualiza o contato
            const updatedContact = await this.contactRepository.update(id, updateDTO);

            // Invalida caches relacionados
            try {
                await Promise.all([
                    this.cacheService.delete(`contact:${id}`),
                    this.cacheService.delete(`person:${existingContact.person_id}:contacts`),
                    this.cacheService.delete(`person:${existingContact.person_id}:main_contact`)
                ]);
            } catch (cacheError) {
                logger.warn('Falha ao invalidar cache', { 
                    error: cacheError.message,
                    contactId: id,
                    personId: existingContact.person_id 
                });
            }

            logger.debug('Service update - result:', {
                updatedContact
            });

            logger.info('Contato atualizado com sucesso', { 
                contactId: id,
                personId: existingContact.person_id 
            });

            return updatedContact;
        } catch (error) {
            logger.error('Erro ao atualizar contato', {
                error: error.message,
                id,
                contactData
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            logger.debug('Service delete - params:', {
                id
            });

            // Primeiro, verifica se o contato existe
            const existingContact = await this.findById(id);
            
            if (!existingContact) {
                throw new ValidationError('Contato não encontrado', 404);
            }

            // Não permite deletar o contato principal
            if (existingContact.is_main) {
                throw new ValidationError('Não é possível excluir o contato principal', 400);
            }

            // Deleta o contato
            const deletedContact = await this.contactRepository.delete(id);

            // Invalida caches relacionados
            try {
                await Promise.all([
                    this.cacheService.delete(`contact:${id}`),
                    this.cacheService.delete(`person:${existingContact.person_id}:contacts`),
                    this.cacheService.delete(`person:${existingContact.person_id}:main_contact`)
                ]);
            } catch (cacheError) {
                logger.warn('Falha ao invalidar cache', { 
                    error: cacheError.message,
                    contactId: id,
                    personId: existingContact.person_id 
                });
            }

            logger.debug('Service delete - result:', {
                deletedContact
            });

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

    async unsetMainContact(personId) {
        try {
            const query = `
                UPDATE ${this.contactRepository.tableName}
                SET is_main = false
                WHERE person_id = $1 AND is_main = true
            `;

            await this.contactRepository.pool.query(query, [personId]);
        } catch (error) {
            logger.error('Erro ao remover contato principal', {
                error: error.message,
                personId
            });
            throw error;
        }
    }
}

module.exports = ContactService;

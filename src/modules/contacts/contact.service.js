const { logger } = require('../../middlewares/logger');
const ContactRepository = require('./contact.repository');
const ContactValidator = require('./validators/contact.validator');
const { ValidationError } = require('../../utils/errors');

class ContactService {
    constructor({ 
        contactRepository = new ContactRepository(), 
    } = {}) {
        this.contactRepository = contactRepository;
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
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

            // Salva no cache por 5 minutos
            try {
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
                query: filters
            });
            throw error;
        }
    }

    async findById(id) {
        try {
            const cacheKey = `contacts:${id}`;
            
            try {
                if (cachedResult) {
                    logger.info('Retornando contato do cache', { cacheKey });
                    return cachedResult;
                }
            } catch (cacheError) {
                logger.warn('Falha ao buscar do cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            const result = await this.contactRepository.findById(id);
            
            if (result) {
                try {
                } catch (cacheError) {
                    logger.warn('Falha ao salvar no cache', { 
                        error: cacheError.message,
                        cacheKey 
                    });
                }
            }

            return result;
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
            const cacheKey = `contacts:person:${personId}`;
            
            try {
                if (cachedResult) {
                    logger.info('Retornando contatos da pessoa do cache', { cacheKey });
                    return cachedResult;
                }
            } catch (cacheError) {
                logger.warn('Falha ao buscar do cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            const result = await this.contactRepository.findByPersonId(personId);
            
            try {
            } catch (cacheError) {
                logger.warn('Falha ao salvar no cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            return result;
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
            const result = await this.contactRepository.create({
                contact_value: data.value || data.contact_value,
                contact_name: data.name || data.contact_name,
                contact_type: data.type || data.contact_type
            });

            // Invalida cache de listagem
            try {
            } catch (cacheError) {
                logger.warn('Falha ao invalidar cache', { 
                    error: cacheError.message
                });
            }

            return result;
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
            const result = await this.contactRepository.update(id, {
                contact_value: data.value,
                contact_name: data.name,
                contact_type: data.type
            });

            if (result) {
                // Invalida caches
                try {
                } catch (cacheError) {
                    logger.warn('Falha ao invalidar cache', { 
                        error: cacheError.message
                    });
                }
            }

            return result;
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
            const result = await this.contactRepository.delete(id);

            if (result) {
                // Invalida caches
                try {
                } catch (cacheError) {
                    logger.warn('Falha ao invalidar cache', { 
                        error: cacheError.message
                    });
                }
            }

            return result;
        } catch (error) {
            logger.error('Erro ao deletar contato', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async findByValueAndType(value, type, options = {}) {
        try {
            return await this.contactRepository.findByValueAndType(value, type, options);
        } catch (error) {
            logger.error('Erro ao buscar contato por valor e tipo', {
                error: error.message,
                value,
                type
            });
            throw error;
        }
    }
}

module.exports = ContactService;

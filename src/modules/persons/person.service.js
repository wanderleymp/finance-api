const { logger } = require('../../middlewares/logger');
const PersonRepository = require('./person.repository');
const CacheService = require('../../services/cacheService');
const PersonValidator = require('./validators/person.validator');
const CreatePersonDTO = require('./dto/create-person.dto');
const UpdatePersonDTO = require('./dto/update-person.dto');

class PersonService {
    constructor({ 
        personRepository = new PersonRepository(), 
        cacheService = CacheService 
    } = {}) {
        this.personRepository = personRepository;
        this.cacheService = cacheService;
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const cacheKey = `persons:list:${JSON.stringify(filters)}:page:${page}:limit:${limit}`;
            
            // Tenta buscar do cache
            const cachedResult = await this.cacheService.get(cacheKey);
            if (cachedResult) {
                logger.info('Retornando pessoas do cache', { cacheKey });
                return cachedResult;
            }

            const result = await this.personRepository.findAll(filters, page, limit);
            
            // Salva no cache
            await this.cacheService.set(cacheKey, result, 3600); // 1 hora

            return result;
        } catch (error) {
            logger.error('Erro ao buscar pessoas', {
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
            const cacheKey = `person:${id}`;
            
            // Tenta buscar do cache
            const cachedPerson = await this.cacheService.get(cacheKey);
            if (cachedPerson) {
                logger.info('Retornando pessoa do cache', { cacheKey });
                return cachedPerson;
            }

            const person = await this.personRepository.findById(id);
            
            if (!person) {
                logger.warn('Pessoa não encontrada', { id });
                return null;
            }

            // Salva no cache
            await this.cacheService.set(cacheKey, person, 3600); // 1 hora

            return person;
        } catch (error) {
            logger.error('Erro ao buscar pessoa por ID', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async findByDocument(document) {
        try {
            const cacheKey = `person:document:${document}`;
            
            // Tenta buscar do cache
            const cachedPerson = await this.cacheService.get(cacheKey);
            if (cachedPerson) {
                logger.info('Retornando pessoa por documento do cache', { cacheKey });
                return cachedPerson;
            }

            // Valida o documento
            PersonValidator.validateDocument(document);

            const person = await this.personRepository.findByDocument(document);
            
            if (!person) {
                logger.warn('Pessoa não encontrada pelo documento', { document });
                return null;
            }

            // Salva no cache
            await this.cacheService.set(cacheKey, person, 3600); // 1 hora

            return person;
        } catch (error) {
            logger.error('Erro ao buscar pessoa por documento', {
                error: error.message,
                document
            });
            throw error;
        }
    }

    async findPersonWithDetails(id) {
        try {
            const cacheKey = `person:details:${id}`;
            
            // Tenta buscar do cache
            const cachedPersonDetails = await this.cacheService.get(cacheKey);
            if (cachedPersonDetails) {
                logger.info('Retornando detalhes da pessoa do cache', { cacheKey });
                return cachedPersonDetails;
            }

            const personDetails = await this.personRepository.findPersonWithDetails(id);
            
            if (!personDetails) {
                logger.warn('Detalhes da pessoa não encontrados', { id });
                return null;
            }

            // Salva no cache
            await this.cacheService.set(cacheKey, personDetails, 3600); // 1 hora

            return personDetails;
        } catch (error) {
            logger.error('Erro ao buscar detalhes da pessoa', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async create(personData, req = {}) {
        try {
            // Valida e transforma os dados
            const createDTO = new CreatePersonDTO(personData);
            const { error } = createDTO.validate();
            
            if (error) {
                logger.warn('Dados de pessoa inválidos', { 
                    error: error.message,
                    data: personData 
                });
                throw new Error(error.message);
            }

            // Valida documento
            PersonValidator.validateDocument(createDTO.document);

            // Verifica se já existe pessoa com o mesmo documento
            const existingPerson = await this.findByDocument(createDTO.document);
            if (existingPerson) {
                logger.warn('Tentativa de criar pessoa com documento duplicado', { 
                    document: createDTO.document 
                });
                throw new Error('Já existe uma pessoa cadastrada com este documento');
            }

            // Valida email se fornecido
            if (createDTO.email) {
                PersonValidator.validateEmail(createDTO.email);
            }

            // Cria a pessoa
            const newPerson = await this.personRepository.create(createDTO);

            // Limpa cache relacionado
            await this.cacheService.delete('persons:list:*');
            
            logger.info('Pessoa criada com sucesso', { 
                personId: newPerson.id 
            });

            return newPerson;
        } catch (error) {
            logger.error('Erro ao criar pessoa', {
                error: error.message,
                data: personData
            });
            throw error;
        }
    }

    async update(id, personData, req = {}) {
        try {
            // Primeiro, verifica se a pessoa existe
            const existingPerson = await this.findById(id);
            
            if (!existingPerson) {
                logger.warn('Tentativa de atualizar pessoa inexistente', { id });
                throw new Error('Pessoa não encontrada');
            }

            // Valida e transforma os dados
            const updateDTO = new UpdatePersonDTO(personData);
            const { error } = updateDTO.validate();
            
            if (error) {
                logger.warn('Dados de atualização de pessoa inválidos', { 
                    error: error.message,
                    data: personData 
                });
                throw new Error(error.message);
            }

            // Valida documento se fornecido
            if (updateDTO.document) {
                PersonValidator.validateDocument(updateDTO.document);

                // Verifica se o novo documento já está em uso
                const personWithDocument = await this.findByDocument(updateDTO.document);
                if (personWithDocument && personWithDocument.id !== id) {
                    logger.warn('Tentativa de atualizar documento para um já existente', { 
                        document: updateDTO.document 
                    });
                    throw new Error('Documento já está em uso por outra pessoa');
                }
            }

            // Valida email se fornecido
            if (updateDTO.email) {
                PersonValidator.validateEmail(updateDTO.email);
            }

            // Atualiza a pessoa
            const updatedPerson = await this.personRepository.update(id, updateDTO);

            // Limpa cache relacionado
            await Promise.all([
                this.cacheService.delete(`person:${id}`),
                this.cacheService.delete(`person:details:${id}`),
                this.cacheService.delete('persons:list:*')
            ]);

            logger.info('Pessoa atualizada com sucesso', { 
                personId: id 
            });

            return updatedPerson;
        } catch (error) {
            logger.error('Erro ao atualizar pessoa', {
                error: error.message,
                id,
                data: personData
            });
            throw error;
        }
    }

    async delete(id, req = {}) {
        try {
            // Primeiro, verifica se a pessoa existe
            const existingPerson = await this.findById(id);
            
            if (!existingPerson) {
                logger.warn('Tentativa de deletar pessoa inexistente', { id });
                throw new Error('Pessoa não encontrada');
            }

            // Verifica se a pessoa tem dependências (endereços, contatos, etc)
            const personDetails = await this.findPersonWithDetails(id);
            if (personDetails && (personDetails.addresses.length > 0 || personDetails.contacts.length > 0)) {
                logger.warn('Tentativa de deletar pessoa com dependências', { 
                    personId: id,
                    addressCount: personDetails.addresses.length,
                    contactCount: personDetails.contacts.length
                });
                throw new Error('Não é possível deletar pessoa com endereços ou contatos vinculados');
            }

            // Deleta a pessoa
            const deletedPerson = await this.personRepository.delete(id);

            // Limpa cache relacionado
            await Promise.all([
                this.cacheService.delete(`person:${id}`),
                this.cacheService.delete(`person:details:${id}`),
                this.cacheService.delete('persons:list:*')
            ]);

            logger.info('Pessoa deletada com sucesso', { 
                personId: id 
            });

            return deletedPerson;
        } catch (error) {
            logger.error('Erro ao deletar pessoa', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    /**
     * Adiciona um endereço a uma pessoa
     * @param {number} personId - ID da pessoa
     * @param {Object} addressData - Dados do endereço
     * @returns {Promise<Object>}
     */
    async addAddress(personId, addressData) {
        try {
            // Verifica se a pessoa existe
            const person = await this.findById(personId);
            if (!person) {
                throw new Error('Pessoa não encontrada');
            }

            // Valida dados do endereço
            if (!addressData.street || !addressData.number || !addressData.city || !addressData.state || !addressData.zip_code) {
                throw new Error('Dados de endereço incompletos');
            }

            const newAddress = await this.personRepository.addAddress(personId, addressData);

            // Limpa cache de detalhes da pessoa
            await this.cacheService.delete(`person:details:${personId}`);

            logger.info('Endereço adicionado à pessoa', { 
                personId, 
                addressId: newAddress.id 
            });

            return newAddress;
        } catch (error) {
            logger.error('Erro ao adicionar endereço à pessoa', {
                error: error.message,
                personId,
                addressData
            });
            throw error;
        }
    }

    /**
     * Adiciona um contato a uma pessoa
     * @param {number} personId - ID da pessoa
     * @param {Object} contactData - Dados do contato
     * @returns {Promise<Object>}
     */
    async addContact(personId, contactData) {
        try {
            // Verifica se a pessoa existe
            const person = await this.findById(personId);
            if (!person) {
                throw new Error('Pessoa não encontrada');
            }

            // Valida dados do contato
            if (!contactData.type || !contactData.contact) {
                throw new Error('Dados de contato incompletos');
            }

            // Valida tipo de contato
            const validContactTypes = ['phone', 'email', 'whatsapp', 'telegram'];
            if (!validContactTypes.includes(contactData.type)) {
                throw new Error(`Tipo de contato inválido. Tipos válidos: ${validContactTypes.join(', ')}`);
            }

            const newContact = await this.personRepository.addContact(personId, contactData);

            // Limpa cache de detalhes da pessoa
            await this.cacheService.delete(`person:details:${personId}`);

            logger.info('Contato adicionado à pessoa', { 
                personId, 
                contactId: newContact.id 
            });

            return newContact;
        } catch (error) {
            logger.error('Erro ao adicionar contato à pessoa', {
                error: error.message,
                personId,
                contactData
            });
            throw error;
        }
    }

    /**
     * Remove um endereço de uma pessoa
     * @param {number} addressId - ID do endereço
     * @returns {Promise<Object|null>}
     */
    async removeAddress(addressId) {
        try {
            const removedAddress = await this.personRepository.removeAddress(addressId);

            if (removedAddress) {
                // Limpa cache de detalhes da pessoa
                await this.cacheService.delete(`person:details:${removedAddress.person_id}`);

                logger.info('Endereço removido', { 
                    addressId, 
                    personId: removedAddress.person_id 
                });
            }

            return removedAddress;
        } catch (error) {
            logger.error('Erro ao remover endereço', {
                error: error.message,
                addressId
            });
            throw error;
        }
    }

    /**
     * Remove um contato de uma pessoa
     * @param {number} contactId - ID do contato
     * @returns {Promise<Object|null>}
     */
    async removeContact(contactId) {
        try {
            const removedContact = await this.personRepository.removeContact(contactId);

            if (removedContact) {
                // Limpa cache de detalhes da pessoa
                await this.cacheService.delete(`person:details:${removedContact.person_id}`);

                logger.info('Contato removido', { 
                    contactId, 
                    personId: removedContact.person_id 
                });
            }

            return removedContact;
        } catch (error) {
            logger.error('Erro ao remover contato', {
                error: error.message,
                contactId
            });
            throw error;
        }
    }

    /**
     * Verifica se uma pessoa tem dependências antes de deletar
     * @param {number} personId - ID da pessoa
     * @returns {Promise<boolean>}
     */
    async checkPersonDependencies(personId) {
        try {
            return await this.personRepository.hasDependencies(personId);
        } catch (error) {
            logger.error('Erro ao verificar dependências da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }
}

module.exports = PersonService;

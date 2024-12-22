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

    async findAll(filters = {}, page = 1, limit = 10, order = {}) {
        try {
            const cacheKey = `persons:list:${JSON.stringify(filters)}:page:${page}:limit:${limit}:order:${JSON.stringify(order)}`;
            
            // Tenta buscar do cache
            const cachedPersons = await this.cacheService.get(cacheKey);
            if (cachedPersons) {
                logger.info('Retornando pessoas do cache', { cacheKey });
                return cachedPersons;
            }

            // Se não estiver no cache, busca do banco
            const result = await this.personRepository.findAll(filters, page, limit, order);

            // Salva no cache
            if (result && result.data) {
                await this.cacheService.set(cacheKey, result, 3600); // 1 hora
            }

            return result;
        } catch (error) {
            logger.error('Erro ao listar pessoas', { error: error.message, page, limit, filters, order });
            throw error;
        }
    }

    async findAllWithDetails(page = 1, limit = 10, filters = {}, order = {}) {
        try {
            // Busca as pessoas
            const persons = await this.findAll(filters, page, limit, order);
            
            if (!persons || !persons.data) {
                return {
                    data: [],
                    pagination: {
                        total: 0,
                        page: parseInt(page),
                        limit: parseInt(limit)
                    }
                };
            }

            // Para cada pessoa, busca seus relacionamentos
            const personsWithDetails = await Promise.all(
                persons.data.map(async (person) => {
                    const [documents, contacts, addresses] = await Promise.all([
                        this.findDocuments(person.id),
                        this.findContacts(person.id),
                        this.findAddresses(person.id)
                    ]);

                    // Usa o DTO de detalhes
                    const { PersonDetailsResponseDTO } = require('./dto/person-response.dto');
                    return PersonDetailsResponseDTO.fromDatabase({
                        ...person,
                        documents: documents.data,
                        contacts: contacts.data,
                        addresses: addresses.data
                    });
                })
            );

            return {
                data: personsWithDetails,
                pagination: persons.pagination
            };
        } catch (error) {
            logger.error('Erro ao listar pessoas com detalhes', { error: error.message, page, limit, filters, order });
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
            // Verifica se a pessoa existe
            const person = await this.findById(id);
            if (!person) {
                throw new Error('Pessoa não encontrada');
            }

            // Busca os relacionamentos
            const [documents, contacts, addresses] = await Promise.all([
                this.findDocuments(id),
                this.findContacts(id),
                this.findAddresses(id)
            ]);

            // Usa o DTO de detalhes
            const { PersonDetailsResponseDTO } = require('./dto/person-response.dto');
            return PersonDetailsResponseDTO.fromDatabase({
                ...person,
                documents: documents.data,
                contacts: contacts.data,
                addresses: addresses.data
            });
        } catch (error) {
            logger.error('Erro ao buscar detalhes da pessoa', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async findDocuments(personId) {
        try {
            // Verifica se a pessoa existe
            const person = await this.findById(personId);
            if (!person) {
                throw new Error('Pessoa não encontrada');
            }

            // Usa o serviço de documentos para buscar
            const PersonDocumentService = require('../person-documents/person-document.service');
            const documentService = new PersonDocumentService();
            
            const result = await documentService.findAll(1, 100, { person_id: personId });
            return {
                data: result.data,
                meta: result.meta
            };
        } catch (error) {
            logger.error('Erro ao buscar documentos da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }

    async findContacts(personId) {
        try {
            // Verifica se a pessoa existe
            const person = await this.findById(personId);
            if (!person) {
                throw new Error('Pessoa não encontrada');
            }

            // Usa o serviço de contatos para buscar
            const PersonContactService = require('../person-contacts/person-contact.service');
            const contactService = new PersonContactService();
            
            const result = await contactService.findAll(1, 100, { person_id: personId });
            return {
                data: result.data,
                meta: result.meta
            };
        } catch (error) {
            logger.error('Erro ao buscar contatos da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }

    async findAddresses(personId) {
        try {
            // Verifica se a pessoa existe
            const person = await this.findById(personId);
            if (!person) {
                throw new Error('Pessoa não encontrada');
            }

            // Usa o serviço de endereços para buscar
            const AddressService = require('../addresses/address.service');
            const addressService = new AddressService();
            
            const result = await addressService.findAll(1, 100, { person_id: personId });
            return {
                data: result.data,
                meta: result.meta
            };
        } catch (error) {
            logger.error('Erro ao buscar endereços da pessoa', {
                error: error.message,
                personId
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
            await this.cacheService.del('persons:list:*');
            
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
                this.cacheService.del(`person:${id}`),
                this.cacheService.del(`person:details:${id}`),
                this.cacheService.del('persons:list:*')
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

    async delete(id) {
        try {
            await this.findById(id);
            await this.personRepository.delete(id);
            
            // Limpa cache relacionado
            await this.cacheService.del(`person:${id}`);
            await this.cacheService.del(`person:details:${id}`);
            
            const keys = await this.cacheService.keys('persons:*');
            if (keys && keys.length > 0) {
                await Promise.all(keys.map(key => this.cacheService.del(key)));
            }
        } catch (error) {
            logger.error('Erro ao deletar pessoa', { error: error.message, id });
            throw error;
        }
    }

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
            await this.cacheService.del(`person:details:${personId}`);

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
            await this.cacheService.del(`person:details:${personId}`);

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

    async removeAddress(addressId) {
        try {
            const removedAddress = await this.personRepository.removeAddress(addressId);

            if (removedAddress) {
                // Limpa cache de detalhes da pessoa
                await this.cacheService.del(`person:details:${removedAddress.person_id}`);

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

    async removeContact(contactId) {
        try {
            const removedContact = await this.personRepository.removeContact(contactId);

            if (removedContact) {
                // Limpa cache de detalhes da pessoa
                await this.cacheService.del(`person:details:${removedContact.person_id}`);

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

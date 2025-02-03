const { logger } = require('../../middlewares/logger');
const PersonRepository = require('./person.repository');
const AddressRepository = require('../addresses/address.repository');
const ContactService = require('../contacts/contact.service');
const PersonContactService = require('../person-contacts/person-contact.service');
const CnpjService = require('../../services/cnpjService');
const PersonValidator = require('./validators/person.validator');
const CreatePersonDTO = require('./dto/create-person.dto');
const UpdatePersonDTO = require('./dto/update-person.dto');
const { systemDatabase } = require('../../config/database');
const personAddressRepository = require('../../repositories/personAddressRepository');

class PersonService {
    constructor({ 
        personRepository = new PersonRepository(), 
        contactService = new ContactService(),
        personContactService = new PersonContactService()
    } = {}) {
        this.personRepository = personRepository;
        this.contactService = contactService;
        this.personContactService = personContactService;
        this.pool = systemDatabase.pool;
    }

    async findAll(filters = {}, page = 1, limit = 10, order = {}) {
        try {
            return await this.personRepository.findAll(filters, page, limit, order);
        } catch (error) {
            logger.error('Erro ao listar pessoas', { error: error.message, page, limit, filters, order });
            throw error;
        }
    }

    async findAllWithDetails(page = 1, limit = 10, filters = {}, order = {}) {
        try {
            logger.info('Iniciando busca de pessoas com detalhes', { page, limit, filters, order });

            // Busca as pessoas
            const persons = await this.findAll(filters, page, limit, order);
            
            logger.info('Resultado da busca de pessoas', { 
                personsCount: persons.items ? persons.items.length : 'N/A', 
                meta: persons.meta 
            });

            // Garante que persons.items seja sempre um array
            const personItems = persons.items || [];
            
            if (personItems.length === 0) {
                logger.warn('Nenhuma pessoa encontrada');
                return {
                    items: [],
                    meta: {
                        totalItems: 0,
                        itemCount: 0,
                        itemsPerPage: parseInt(limit),
                        totalPages: 0,
                        currentPage: parseInt(page)
                    }
                };
            }

            logger.error('DEBUG findAllWithDetails FULL', { 
                personItems: JSON.stringify(personItems),
                personItemsLength: personItems.length,
                personItemsType: typeof personItems
            });

            logger.error('DEBUG findAllWithDetails', { 
                persons: JSON.stringify(persons),
                personsType: typeof persons,
                personsKeys: Object.keys(persons),
                personItems: persons.items ? JSON.stringify(persons.items) : 'undefined'
            });

            // Para cada pessoa, busca seus relacionamentos
            const personsWithDetails = await Promise.all(
                persons.items.map(async (person) => {
                    logger.info('Buscando detalhes para pessoa', { personId: person.person_id });

                    const [documents, contacts, addresses] = await Promise.all([
                        this.findDocuments(person.person_id),
                        this.findContacts(person.person_id),
                        personAddressRepository.findByPersonId(person.person_id)
                    ]);

                    logger.info('Detalhes encontrados', { 
                        personId: person.person_id,
                        documentsCount: documents.items ? documents.items.length : 'N/A',
                        contactsCount: contacts.length,
                        addressesCount: addresses ? addresses.length : 'N/A',
                        addressesRaw: JSON.stringify(addresses)
                    });

                    logger.error('DEBUG findAllWithDetails', { 
                        personId: person.person_id,
                        documents: JSON.stringify(documents),
                        contacts: JSON.stringify(contacts),
                        addresses: JSON.stringify(personAddressRepository.findByPersonId(person.person_id))
                    });

                    // Usa o DTO de detalhes
                    const { PersonDetailsResponseDTO } = require('./dto/person-response.dto');
                    return PersonDetailsResponseDTO.fromDatabase({
                        ...person,
                        documents: documents.items || [],
                        contacts: contacts || [],
                        addresses: addresses || []
                    });
                })
            );

            return {
                items: personsWithDetails,
                meta: persons.meta
            };
        } catch (error) {
            logger.error('Erro ao listar pessoas com detalhes', { 
                error: error.message, 
                page, 
                limit, 
                filters, 
                order,
                stack: error.stack 
            });
            throw error;
        }
    }

    async findById(id) {
        try {
            return await this.personRepository.findById(id);
        } catch (error) {
            logger.error('Erro ao buscar pessoa por ID', { error: error.message, id });
            throw error;
        }
    }

    async findByDocument(document) {
        try {
            const cacheKey = `person:document:${document}`;
            
            // Tenta buscar do cache
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

            return person;
        } catch (error) {
            logger.error('Erro ao buscar pessoa por documento', {
                error: error.message,
                document
            });
            throw error;
        }
    }

    async findByCnpj(cnpj) {
        try {
            logger.debug('Service findByCnpj - params:', {
                cnpj
            });

            // Limpa o CNPJ para busca
            const cleanCnpj = cnpj.replace(/[^\d]/g, '');

            // Gera uma chave única para o cache
            const cacheKey = `person:cnpj:${cleanCnpj}`;
            
            // Tenta buscar do cache
            try {
                if (cachedPerson) {
                    logger.info('Retornando pessoa do cache', { cacheKey });
                    return cachedPerson;
                }
            } catch (cacheError) {
                logger.warn('Falha ao buscar do cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            // Busca a pessoa pelo CNPJ
            const person = await this.personRepository.findByCnpj(cleanCnpj);
            
            // Se encontrou, salva no cache
            if (person) {
                try {
                } catch (cacheError) {
                    logger.warn('Falha ao salvar no cache', { 
                        error: cacheError.message,
                        cacheKey 
                    });
                }
            }

            logger.debug('Service findByCnpj - result:', {
                person
            });

            return person;
        } catch (error) {
            logger.error('Erro ao buscar pessoa por CNPJ', {
                error: error.message,
                cnpj
            });
            throw error;
        }
    }

    async findPersonWithDetails(id) {
        try {
            // Busca a pessoa
            const person = await this.findById(id);
            if (!person) {
                throw new Error('Pessoa não encontrada');
            }

            logger.info('DEBUG findPersonDetails - Pessoa base', { person });

            // Busca relacionamentos em paralelo com tratamento de erros
            const [documentsResult, contactsResult, addressesResult] = await Promise.allSettled([
                this.findDocuments(person.person_id),
                this.findContacts(person.person_id),
                this.personRepository.findAddressesByPersonId(person.person_id)
            ]);

            logger.info('DEBUG findPersonDetails - Documentos', { documentsResult });
            logger.info('DEBUG findPersonDetails - Contatos', { contactsResult });
            logger.info('DEBUG findPersonDetails - Endereços', { addressesResult });

            // Usa o DTO de detalhes
            const { PersonDetailsResponseDTO } = require('./dto/person-response.dto');
            const result = PersonDetailsResponseDTO.fromDatabase({
                ...person,
                documents: documentsResult.status === 'fulfilled' ? documentsResult.value.items || [] : [],
                contacts: contactsResult.status === 'fulfilled' ? contactsResult.value || [] : [],
                addresses: addressesResult.status === 'fulfilled' ? addressesResult.value || [] : []
            });

            logger.info('DEBUG findPersonDetails - Resultado final', { result });

            return result;
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
            const documents = await this.personRepository.findDocumentsByPersonId(personId);
            
            logger.info('DEBUG findDocuments - Documentos brutos', { 
                personId, 
                documentsCount: documents.length,
                documentsDetails: documents 
            });
            
            logger.info('DEBUG findDocuments - Documentos detalhados', { 
                personId, 
                documentsCount: documents.length,
                documentsDetails: JSON.stringify(documents) 
            });
            
            return {
                items: documents,
                total: documents.length
            };
        } catch (error) {
            logger.error('Erro ao buscar documentos da pessoa', {
                error: error.message,
                personId,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async findContacts(personId) {
        try {
            const contacts = await this.personContactService.findByPersonId(personId);
            // Retorna apenas os items sem paginação
            return contacts.items;
        } catch (error) {
            logger.error('Erro ao buscar contatos da pessoa no serviço de pessoas', {
                error: error.message,
                personId
            });
            return [];
        }
    }

    async findAddresses(personId) {
        try {
            // Verifica se a pessoa existe
            const person = await this.findById(personId);
            if (!person) {
                throw new Error('Pessoa não encontrada');
            }

            const result = await personAddressRepository.findByPersonId(personId);
            return {
                items: result,
                total: result.length
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

            // Cria a pessoa
            const newPerson = await this.personRepository.create(createDTO);

            // Limpa cache relacionado
            
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

            logger.info('Pessoa deletada com sucesso', { id });
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

            let existingAddress = null;

            // Verifica se já existe um endereço igual
            const AddressRepository = require('../addresses/address.repository');
            const addressRepository = new AddressRepository();
            const existingAddresses = await addressRepository.findByPersonId(personId);

            // Log adicional para debug
            logger.info('Debug: Endereços existentes', { 
                personId, 
                existingAddresses,
                addressData 
            });

            // Limpa o CEP para comparação
            const cleanPostalCode = addressData.postal_code?.replace(/[^\d]/g, '');

            // Verifica se já existe um endereço com os mesmos dados
            existingAddress = existingAddresses.length > 0 ? existingAddresses.find(address => {
                // Normaliza os dados para comparação
                const existingPostalCode = address.postal_code?.replace(/[^\d]/g, '');
                const existingStreet = address.street?.trim().toUpperCase();
                const newStreet = addressData.street?.trim().toUpperCase();
                const existingNumber = String(address.number).trim();
                const newNumber = String(addressData.number).trim();
                const existingComplement = address.complement?.trim().toUpperCase();
                const newComplement = addressData.complement?.trim().toUpperCase();

                return (
                    existingPostalCode === cleanPostalCode &&
                    existingStreet === newStreet &&
                    existingNumber === newNumber &&
                    existingComplement === newComplement
                );
            }) : null;

            // Se já existe um endereço igual, retorna ele
            if (existingAddress) {
                logger.info('Endereço já existe para a pessoa', { 
                    personId, 
                    addressId: existingAddress.id 
                });
                return existingAddress;
            }

            // Adiciona o endereço
            const newAddress = await this.personRepository.addAddress(personId, addressData);

            // Limpa cache de detalhes da pessoa

            logger.info('Endereço adicionado à pessoa', { 
                personId, 
                addressId: newAddress.id 
            });

            return newAddress;
        } catch (error) {
            logger.error('Erro ao adicionar endereço à pessoa', {
                error: error.message,
                personId,
                addressData,
                // Adiciona mais detalhes do erro
                errorStack: error.stack
            });
            throw error;
        }
    }

    async addContact(personId, contactData) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');

            // Verifica se a pessoa existe
            const person = await this.findById(personId);
            if (!person) {
                throw new Error('Pessoa não encontrada');
            }

            let contactId = contactData.contact_id;
            let contact;

            // Se não tem contact_id, procura ou cria o contato
            if (!contactId) {
                if (!contactData.value || !contactData.type) {
                    throw new Error('Dados de contato incompletos. Forneça value e type ou um contact_id existente');
                }

                // Procura contato existente com mesmo valor e tipo
                contact = await this.contactService.findByValueAndType(
                    contactData.value,
                    contactData.type,
                    { client }
                );

                // Se não existe, cria novo contato
                if (!contact) {
                    contact = await this.contactService.create({
                        name: contactData.name,
                        value: contactData.value,
                        type: contactData.type
                    }, { client });
                }
                
                contactId = contact.id;
            }

            // Verifica se já existe vínculo
            const existingLink = await this.personContactService.findByPersonAndContact(
                personId,
                contactId,
                { client }
            );

            if (existingLink) {
                await client.query('ROLLBACK');
                return existingLink;
            }

            // Cria o vínculo person-contact
            const personContact = await this.personContactService.create({
                person_id: personId,
                contact_id: contactId,
                description: contactData.description
            }, { client });

            await client.query('COMMIT');

            // Limpa cache

            logger.info('Contato vinculado à pessoa com sucesso', {
                personId,
                contactId,
                personContactId: personContact.id
            });

            return personContact;

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro ao vincular contato à pessoa', {
                error: error.message,
                personId,
                contactData
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async addDocument(personId, documentData) {
        try {
            // Verifica se a pessoa existe
            const person = await this.findById(personId);
            if (!person) {
                throw new Error('Pessoa não encontrada');
            }

            // Adiciona o documento
            const newDocument = await this.personRepository.addDocument(personId, documentData);

            // Limpa cache de detalhes da pessoa

            logger.info('Documento adicionado à pessoa', { 
                personId, 
                documentId: newDocument.id 
            });

            return newDocument;
        } catch (error) {
            logger.error('Erro ao adicionar documento à pessoa', {
                error: error.message,
                personId,
                documentData
            });
            throw error;
        }
    }

    async removeAddress(addressId) {
        try {
            const removedAddress = await this.personRepository.removeAddress(addressId);

            if (removedAddress) {
                // Limpa cache de detalhes da pessoa

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

    async createOrUpdateFromCnpj(cnpj) {
        try {
            logger.info('Service: Iniciando criação/atualização de pessoa por CNPJ', { cnpj });

            // Busca dados do CNPJ
            const cnpjData = await CnpjService.findByCnpj(cnpj);
            logger.info('Service: Dados do CNPJ obtidos', { cnpjData });

            // Busca pessoa existente pelo CNPJ usando o serviço de documentos
            const PersonDocumentService = require('../person-documents/person-document.service');
            const personDocumentService = new PersonDocumentService();

            // Busca por CNPJ
            let existingPerson;
            const existingDocument = await personDocumentService.findByDocumentValue('CNPJ', cnpjData.cnpj);
            logger.info('Service: Verificação de documento existente', { existingDocument });

            if (existingDocument) {
                // Busca direto do banco, sem cache
                existingPerson = await this.personRepository.findById(existingDocument.person_id);
                logger.info('Service: Pessoa encontrada por documento', { existingPerson });
            }

            // Prepara os dados da pessoa
            const personData = {
                full_name: cnpjData.razao_social,
                fantasy_name: cnpjData.fantasia || '',
                person_type: 'PJ',
                birth_date: cnpjData.data_abertura,
                active: true
            };

            let person;
            if (existingPerson) {
                logger.info('Service: Atualizando pessoa existente', { 
                    person_id: existingPerson.id 
                });
                // Atualiza direto no banco
                person = await this.personRepository.update(existingPerson.person_id, personData);
                
                // Verifica se a atualização foi bem-sucedida
                if (!person) {
                    logger.error('Service: Falha ao atualizar pessoa existente', { 
                        person_id: existingPerson.person_id,
                        personData
                    });
                    throw new Error('Não foi possível atualizar a pessoa');
                }
                
                // Adiciona o documento CNPJ se não existir
                if (!existingDocument) {
                    logger.info('Service: Adicionando documento CNPJ à pessoa existente', { 
                        person_id: person.person_id,
                        cnpj: cnpjData.cnpj
                    });
                    const document = await personDocumentService.create(person.person_id, {
                        document_type: 'CNPJ',
                        document_value: cnpjData.cnpj
                    });
                    logger.info('Service: Documento CNPJ adicionado', { document });
                }
            } else {
                logger.info('Service: Criando nova pessoa');
                // Cria direto no banco
                person = await this.personRepository.create(personData);

                // Adiciona o documento para nova pessoa
                logger.info('Service: Adicionando documento CNPJ à nova pessoa', { 
                    person_id: person.person_id,
                    cnpj: cnpjData.cnpj
                });
                const document = await personDocumentService.create(person.person_id, {
                    document_type: 'CNPJ',
                    document_value: cnpjData.cnpj
                });
                logger.info('Service: Documento CNPJ adicionado', { document });
            }

            // Adiciona o endereço
            if (cnpjData.endereco) {
                const addressData = {
                    street: cnpjData.endereco.logradouro,
                    number: cnpjData.endereco.numero,
                    complement: cnpjData.endereco.complemento,
                    neighborhood: cnpjData.endereco.bairro,
                    city: cnpjData.endereco.cidade,
                    state: cnpjData.endereco.estado,
                    postal_code: cnpjData.endereco.cep,
                    country: 'Brasil',
                    reference: null,
                    ibge: cnpjData.endereco.ibge
                };

                // Tenta adicionar o endereço, se já existir vai retornar o existente
                const address = await this.addAddress(person.person_id, addressData);
                logger.info('Service: Endereço adicionado/atualizado', { address });
            }

            // Limpa cache

            return person;
        } catch (error) {
            logger.error('Service: Erro ao criar/atualizar pessoa por CNPJ', { 
                cnpj, 
                error: error.message 
            });
            throw error;
        }
    }
}

module.exports = PersonService;

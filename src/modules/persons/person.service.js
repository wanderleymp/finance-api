const { logger } = require('../../middlewares/logger');
const PersonRepository = require('./person.repository');
const AddressService = require('../addresses/address.service');
const CnpjService = require('../../services/cnpjService');
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
            return await this.personRepository.findAll(filters, page, limit, order);
        } catch (error) {
            logger.error('Erro ao listar pessoas', { error: error.message, page, limit, filters, order });
            throw error;
        }
    }

    async findAllWithDetails(page = 1, limit = 10, filters = {}, order = {}) {
        try {
            // Busca as pessoas
            const persons = await this.findAll(filters, page, limit, order);
            
            if (!persons || !persons.items || persons.items.length === 0) {
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

            // Para cada pessoa, busca seus relacionamentos
            const personsWithDetails = await Promise.all(
                persons.items.map(async (person) => {
                    const [documents, contacts, addresses] = await Promise.all([
                        this.findDocuments(person.person_id),
                        this.findContacts(person.person_id),
                        this.findAddresses(person.person_id)
                    ]);

                    // Usa o DTO de detalhes
                    const { PersonDetailsResponseDTO } = require('./dto/person-response.dto');
                    return PersonDetailsResponseDTO.fromDatabase({
                        ...person,
                        documents: documents.items,
                        contacts: contacts.items,
                        addresses: addresses.items
                    });
                })
            );

            return {
                items: personsWithDetails,
                meta: persons.meta
            };
        } catch (error) {
            logger.error('Erro ao listar pessoas com detalhes', { error: error.message, page, limit, filters, order });
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
                const cachedPerson = await this.cacheService.get(cacheKey);
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
                    await this.cacheService.set(cacheKey, person, 3600); // 1 hora
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
                documents: documents.items,
                contacts: contacts.items,
                addresses: addresses.items
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
            return result;
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
            return result;
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
            return result;
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

            // Verifica se já existe um endereço igual
            const AddressService = require('../addresses/address.service');
            const addressService = new AddressService();
            const existingAddresses = await addressService.findByPersonId(personId);

            // Limpa o CEP para comparação
            const cleanPostalCode = addressData.postal_code?.replace(/[^\d]/g, '');

            // Verifica se já existe um endereço com os mesmos dados
            const existingAddress = existingAddresses.find(address => {
                // Normaliza os dados para comparação
                const existingPostalCode = address.postal_code?.replace(/[^\d]/g, '');
                const existingStreet = address.street?.trim().toUpperCase();
                const newStreet = addressData.street?.trim().toUpperCase();
                const existingNumber = String(address.number).trim();
                const newNumber = String(addressData.number).trim();
                const existingComplement = address.complement?.trim().toUpperCase() || '';
                const newComplement = addressData.complement?.trim().toUpperCase() || '';
                const existingNeighborhood = address.neighborhood?.trim().toUpperCase();
                const newNeighborhood = addressData.neighborhood?.trim().toUpperCase();
                const existingCity = address.city?.trim().toUpperCase();
                const newCity = addressData.city?.trim().toUpperCase();
                const existingState = address.state?.trim().toUpperCase();
                const newState = addressData.state?.trim().toUpperCase();

                // Compara todos os campos normalizados
                return existingStreet === newStreet &&
                    existingNumber === newNumber &&
                    existingComplement === newComplement &&
                    existingNeighborhood === newNeighborhood &&
                    existingCity === newCity &&
                    existingState === newState &&
                    existingPostalCode === cleanPostalCode;
            });

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
            await this.cacheService.del(`person:details:${personId}`);

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
            } else {
                // Se não encontrou por CNPJ, busca por razão social direto do banco
                const personsByName = await this.personRepository.findAll({ full_name: cnpjData.razao_social });
                logger.info('Service: Pessoas encontradas por nome', { 
                    razao_social: cnpjData.razao_social,
                    total: personsByName?.data?.length || 0,
                    persons: personsByName?.data || []
                });

                // Só usa a pessoa encontrada se tiver exatamente uma
                if (personsByName?.data?.length === 1) {
                    existingPerson = personsByName.data[0];
                    logger.info('Service: Pessoa encontrada por nome', { existingPerson });
                } else if (personsByName?.data?.length > 1) {
                    logger.warn('Service: Múltiplas pessoas encontradas com o mesmo nome, ignorando busca por nome', {
                        razao_social: cnpjData.razao_social,
                        total: personsByName.data.length
                    });
                }
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
                person = await this.personRepository.update(existingPerson.id, personData);
                
                // Adiciona o documento CNPJ se não existir
                if (!existingDocument) {
                    logger.info('Service: Adicionando documento CNPJ à pessoa existente', { 
                        person_id: person.id,
                        cnpj: cnpjData.cnpj
                    });
                    const document = await personDocumentService.create(person.id, {
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
            await this.cacheService.del(`person:details:${person.person_id}`);

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

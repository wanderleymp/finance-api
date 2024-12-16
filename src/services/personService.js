const logger = require('../middlewares/logger').logger;
const { systemDatabase } = require('../config/database');
const personRepository = require('../repositories/personRepository');
const personContactRepository = require('../repositories/personContactRepository');
const personDocumentRepository = require('../repositories/personDocumentRepository');
const personAddressRepository = require('../repositories/personAddressRepository');
const personRelationService = require('./personRelationService');
const { ValidationError } = require('../utils/errors');
const PaginationHelper = require('../utils/paginationHelper');
const PersonUpdateDto = require('../dtos/personUpdateDto');
const personLicenseRepository = require('../repositories/personLicenseRepository');
const userLicenseRepository = require('../repositories/userLicenseRepository');
const cnpjService = require('../services/cnpjService');
const cepService = require('../services/cepService');
const personAddressService = require('./personAddressService');

class PersonService {
    constructor() {
        console.error('🔍 CONSTRUCTOR: Inicializando PersonService');
        
        // Log detalhado de métodos
        const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
            .filter(prop => typeof this[prop] === 'function' && prop !== 'constructor');
        
        console.error('🔍 CONSTRUCTOR: Métodos disponíveis:', methodNames);

        // Bind explícito de TODOS os métodos
        methodNames.forEach(methodName => {
            console.error(`🔍 CONSTRUCTOR: Binding método ${methodName}`);
            this[methodName] = this[methodName].bind(this);
        });

        console.error('🔍 CONSTRUCTOR: Finalizado');
    }

    async listPersons(page, limit, search) {
        try {
            // Valida e normaliza parâmetros de paginação
            const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);

            // Busca pessoas com repositório
            const result = await personRepository.findAll(validPage, validLimit, search);
            console.log('Resultado do personRepository:', JSON.stringify(result, null, 2));

            if (!result || !result.data || result.total === undefined) {
                console.error('Resultado inválido do repositório:', result);
                throw new Error('Resultado inválido do repositório de pessoas');
            }

            // Busca relacionamentos para cada pessoa em lote
            const personsWithRelations = await Promise.all(result.data.map(async (person) => {
                const relations = await personRelationService.findPersonRelations(person.person_id);

                return {
                    ...person,
                    ...relations
                };
            }));

            // Usa o PaginationHelper para formatar a resposta
            return PaginationHelper.formatResponse(
                personsWithRelations, 
                result.total, 
                validPage, 
                validLimit
            );
        } catch (error) {
            logger.error('Erro ao listar pessoas', { 
                error: error.message, 
                stack: error.stack,
                page,
                limit,
                search 
            });
            throw error;
        }
    }

    async getPerson(personId) {
        const { data, total } = await personRepository.findById(personId);
        
        logger.info('Detalhes da busca de pessoa', { 
            personId, 
            data, 
            total 
        });

        if (!data || total === 0) {
            throw new ValidationError('Pessoa não encontrada', 404);
        }
        const relations = await personRelationService.findPersonRelations(personId);

        return {
            ...data,
            ...relations
        };
    }

    async getPersonDocuments(personId) {
        // Verifica se a pessoa existe
        await this.getPerson(personId);
        const { documents } = await personRelationService.findPersonRelations(personId);
        return documents || [];
    }

    async getPersonContacts(personId) {
        // Verifica se a pessoa existe
        await this.getPerson(personId);
        const { contacts } = await personRelationService.findPersonRelations(personId);
        return { contacts, total: contacts.length };
    }

    async getPersonAddresses(personId, client = null) {
        try {
            const dbClient = client || systemDatabase;
            const addresses = await personAddressRepository.findAll({ person_id: personId });
            return addresses.data || [];
        } catch (error) {
            console.error('Erro ao buscar endereços da pessoa', {
                personId,
                error: error.message,
                stack: error.stack
            });
            return [];
        }
    }

    async createPerson(personData, req, client = null) {
        try {
            console.error('🚨 CRIANDO PESSOA - INÍCIO COMPLETO', { 
                personDataRaw: JSON.stringify(personData, null, 2),
                personDataKeys: Object.keys(personData),
                personDataTypes: Object.entries(personData).reduce((acc, [key, value]) => {
                    acc[key] = typeof value;
                    return acc;
                }, {}),
                clientProvided: !!client 
            });

            // Validar dados da pessoa
            const validatedData = await this.validatePersonData(personData);

            console.error('🚨 DADOS VALIDADOS', { 
                validatedData: JSON.stringify(validatedData, null, 2),
                validatedDataTypes: Object.entries(validatedData).reduce((acc, [key, value]) => {
                    acc[key] = typeof value;
                    return acc;
                }, {})
            });

            // Formatar nomes
            validatedData.full_name = this.formatName(validatedData.full_name);
            validatedData.fantasy_name = this.formatName(validatedData.fantasy_name);

            // Usar o cliente de transação ou o padrão
            const dbClient = client || systemDatabase;

            // Criar pessoa no banco de dados
            const result = await personRepository.create(validatedData, dbClient);
            const personId = result.person_id;

            console.error('🚨 PESSOA CRIADA', { 
                personId,
                result: JSON.stringify(result, null, 2)
            });

            // Adicionar documentos, se existirem
            if (personData.documents) {
                console.error('🚨 SALVANDO DOCUMENTOS', { 
                    documents: JSON.stringify(personData.documents, null, 2)
                });
                await this.savePersonDocuments(personId, personData.documents, dbClient);
            }

            // Adicionar contatos, se existirem
            if (personData.contacts) {
                console.error('🚨 SALVANDO CONTATOS', { 
                    contacts: JSON.stringify(personData.contacts, null, 2)
                });
                await this.addPersonContacts(personId, personData.contacts, dbClient);
            }

            // Adicionar endereços, se existirem
            if (personData.addresses) {
                console.error('🚨 SALVANDO ENDEREÇOS', { 
                    addresses: JSON.stringify(personData.addresses, null, 2)
                });
                await this.addPersonAddresses(personId, personData.addresses, dbClient);
            }

            // Adicionar licenças do usuário
            const userLicenses = await this.addPersonLicenses(personId, req, dbClient);

            // Recuperar pessoa completa
            const person = await personRepository.findPersonById(personId, dbClient);
            person.licenses = userLicenses;

            console.error('🚨 PESSOA COMPLETA', { 
                person: JSON.stringify(person, null, 2)
            });

            return person;

        } catch (error) {
            console.error('🚨 ERRO AO CRIAR PESSOA', { 
                errorMessage: error.message,
                errorStack: error.stack,
                personData: JSON.stringify(personData, null, 2)
            });
            throw error;
        }
    }

    async updatePerson(personId, personData) {
        try {
            logger.info('Iniciando atualização de pessoa', { 
                personId, 
                personData: JSON.stringify(personData) 
            });

            // Preparar dados básicos da pessoa
            const { 
                full_name, 
                fantasy_name, 
                birth_date, 
                person_type, 
                active 
            } = personData;

            logger.info('Dados básicos extraídos', { 
                full_name, 
                fantasy_name, 
                birth_date, 
                person_type, 
                active 
            });

            // Atualizar dados básicos da pessoa
            const updatedPerson = await personRepository.update(personId, {
                full_name,
                fantasy_name,
                birth_date,
                person_type,
                active,
                updated_at: new Date()
            });

            logger.info('Dados básicos da pessoa atualizados', { updatedPerson });

            // Processa endereços
            if (personData.addresses && personData.addresses.length > 0) {
                console.log('🌍 Endereços a serem salvos:', JSON.stringify(personData.addresses, null, 2));
                logger.info('Preparando para salvar endereços', { 
                    addressCount: personData.addresses.length,
                    personId 
                });
                
                const processedAddresses = await this.addPersonAddresses(personId, personData.addresses);
                
                console.log('✅ Endereços processados:', JSON.stringify(processedAddresses, null, 2));
                logger.info('Endereços processados com sucesso', { processedAddresses });
            } else {
                logger.info('Nenhum endereço para processar');
            }

            // Processar documentos
            if (personData.documents && personData.documents.length > 0) {
                const processedDocuments = await this.addPersonDocuments(personId, personData.documents);
                logger.info('Documentos processados', { processedDocuments });
            }

            // Processar contatos
            if (personData.contacts && personData.contacts.length > 0) {
                const processedContacts = await this.addPersonContacts(personId, personData.contacts);
                logger.info('Contatos processados', { processedContacts });
            }

            // Buscar pessoa atualizada com todos os dados relacionados
            const updatedPersonWithDetails = await this.findPersonById(personId);
            logger.info('Pessoa atualizada com detalhes', { updatedPersonWithDetails });

            return updatedPersonWithDetails;

        } catch (error) {
            logger.error('Erro ao atualizar pessoa', { 
                personId, 
                personData: JSON.stringify(personData),
                error: error.message,
                stack: error.stack 
            });
            throw error;
        }
    }

    async deletePerson(personId) {
        await this.getPerson(personId);
        await personRepository.delete(personId);
    }

    async listPersonsWithRelations(page, limit, search = '') {
        const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);
        const { data, total } = await personRepository.findAll(validPage, validLimit, search);

        // Buscar documentos, contatos e endereços para todas as pessoas
        const personsWithRelations = await Promise.all(
            data.map(async (person) => {
                const documents = await personDocumentRepository.findByPersonId(person.person_id);
                const contacts = await personContactRepository.findByPersonId(person.person_id);
                const addresses = await personAddressRepository.findByPersonId(person.person_id);
                return {
                    ...person,
                    documents,
                    contacts,
                    addresses
                };
            })
        );

        return PaginationHelper.formatResponse(personsWithRelations, total, validPage, validLimit);
    }

    validatePersonData(personData) {
        logger.error('VALIDANDO DADOS DA PESSOA', { personData });

        const { full_name, person_type } = personData;

        logger.error('DADOS PARA VALIDAÇÃO', { full_name, person_type });

        if (!full_name || full_name.trim() === '') {
            throw new ValidationError('Nome completo é obrigatório');
        }

        const validPersonTypes = ['PF', 'PJ', 'PR', 'OT'];
        if (person_type && !validPersonTypes.includes(person_type)) {
            throw new ValidationError('Tipo de pessoa inválido');
        }

        logger.error('DADOS VALIDADOS COM SUCESSO');
        return personData;
    }

    // Método para formatar nome com primeira letra maiúscula
    formatName(name) {
        if (!name) return name;
        
        // Divide o nome em palavras, capitaliza cada palavra e junta novamente
        return name
            .trim()
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async createOrUpdatePersonByCnpj(cnpj) {
        const cnpjService = require('../services/cnpjService');
        
        try {
            logger.info('Iniciando criação/atualização de pessoa por CNPJ', { 
                reqParams: { cnpj } 
            });

            // Validar e limpar o CNPJ
            const cleanCnpj = await cnpjService.validateCnpj(cnpj);
            logger.info('CNPJ validado', { cleanCnpj });

            // Buscar dados da empresa na API da Receita
            const companyData = await cnpjService.findCnpjData(cleanCnpj);
            logger.info('Dados da empresa obtidos', { companyData });

            // Preparar dados da pessoa
            const personData = {
                full_name: companyData.nome,
                fantasy_name: companyData.fantasia,
                person_type: 'PJ',
                active: true,
                documents: [{
                    document_type: 'CNPJ',
                    document_value: cleanCnpj
                }],
                contacts: [],
                addresses: []
            };

            // Adicionar endereço se disponível
            if (companyData.logradouro || companyData.cep) {
                const address = {
                    street: companyData.logradouro || '',
                    number: companyData.numero || '',
                    complement: companyData.complemento || '',
                    neighborhood: companyData.bairro || '',
                    city: companyData.municipio || '',
                    state: companyData.uf || '',
                    postal_code: (companyData.cep || '').replace(/\D/g, ''),
                    country: 'Brasil'
                };
                personData.addresses.push(address);
                console.log('🏠 Endereço preparado:', JSON.stringify(address, null, 2));
            } else {
                console.log('❌ Nenhum endereço disponível para a empresa');
            }

            // Adicionar contatos se disponíveis
            if (companyData.email) {
                personData.contacts.push({
                    contact_type: 'EMAIL',
                    contact_value: companyData.email
                });
            }

            if (companyData.telefone) {
                // Remover caracteres não numéricos do telefone
                const cleanPhone = companyData.telefone.replace(/\D/g, '');
                if (cleanPhone) {
                    personData.contacts.push({
                        contact_type: 'PHONE',
                        contact_value: cleanPhone
                    });
                }
            }

            // Buscar pessoa existente pelo CNPJ
            const existingPerson = await this.findPersonByCnpj(cleanCnpj);

            let savedPerson;
            if (existingPerson) {
                // Atualizar pessoa existente
                savedPerson = await this.updatePerson(existingPerson.person_id, personData);
            } else {
                // Criar nova pessoa
                savedPerson = await this.createPerson(personData);
            }

            return savedPerson;

        } catch (error) {
            logger.error('Erro ao criar/atualizar pessoa por CNPJ', { 
                cnpj, 
                error: error.message,
                stack: error.stack 
            });
            throw error;
        }
    }

    // Método para buscar pessoa por nome completo
    async findPersonByFullName(fullName) {
        try {
            const result = await personRepository.findAll(1, 1, fullName);
            return result.data[0] || null;
        } catch (error) {
            logger.warn('Erro ao buscar pessoa por nome completo', {
                fullName,
                errorMessage: error.message
            });
            return null;
        }
    }

    async preparePersonData(cnpj) {
        try {
            logger.error('PREPARANDO DADOS DA PESSOA - INÍCIO', { cnpj });
            const companyData = await this.fetchCompanyData(cnpj);

            logger.error('PREPARANDO DADOS DA PESSOA - DADOS DA EMPRESA', { companyData });

            if (!companyData) {
                throw new ValidationError('Dados da empresa não encontrados');
            }

            // Preparar contatos
            const contacts = [];
            if (companyData.email) {
                contacts.push({
                    contact_type: 'email',
                    contact_value: companyData.email
                });
            }
            if (companyData.telefone) {
                contacts.push({
                    contact_type: 'phone',
                    contact_value: companyData.telefone.replace(/\D/g, '')
                });
            }

            // Preparar endereços
            const addresses = [{
                street: companyData.logradouro || '',
                number: companyData.numero || '',
                complement: companyData.complemento || '',
                neighborhood: companyData.bairro || '',
                city: companyData.municipio || '',
                state: companyData.uf || '',
                zip_code: companyData.cep ? companyData.cep.replace(/\D/g, '') : '',
                country: 'Brasil'
            }];

            logger.error('PREPARANDO DADOS DA PESSOA - ENDEREÇOS PREPARADOS', { addresses });

            // Mapeamento de campos
            const personData = {
                full_name: companyData.razao_social,
                fantasy_name: companyData.fantasia,
                birth_date: companyData.data_abertura ? new Date(companyData.data_abertura) : null,
                person_type: 'PJ',
                contacts,
                addresses,
                additional_data: {
                    cnpj: companyData.cnpj || cnpj,
                    situation: companyData.situacao || '',
                    legal_nature: companyData.natureza_juridica || '',
                    company_size: companyData.porte || '',
                    social_capital: parseFloat(companyData.capital_social) || 0,
                    main_activity: companyData.atividade_principal 
                        ? companyData.atividade_principal[0]?.text || ''
                        : '',
                    last_update: companyData.ultima_atualizacao || new Date()
                }
            };

            logger.error('PREPARANDO DADOS DA PESSOA - DADOS FINAIS', { personData });

            return personData;
        } catch (error) {
            logger.error('Erro ao preparar dados da pessoa', {
                cnpj,
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async fetchCompanyData(cnpj) {
        try {
            logger.error('PREPARANDO DADOS DA PESSOA - INÍCIO', { cnpj });
            const companyData = await this.fetchCompanyData(cnpj);

            logger.error('PREPARANDO DADOS DA PESSOA - DADOS DA EMPRESA', { companyData });

            if (!companyData) {
                throw new ValidationError('Dados da empresa não encontrados');
            }

            // Preparar contatos
            const contacts = [];
            if (companyData.email) {
                contacts.push({
                    contact_type: 'email',
                    contact_value: companyData.email
                });
            }
            if (companyData.telefone) {
                contacts.push({
                    contact_type: 'phone',
                    contact_value: companyData.telefone.replace(/\D/g, '')
                });
            }

            // Preparar endereços
            const addresses = [{
                street: companyData.logradouro || '',
                number: companyData.numero || '',
                complement: companyData.complemento || '',
                neighborhood: companyData.bairro || '',
                city: companyData.municipio || '',
                state: companyData.uf || '',
                zip_code: companyData.cep ? companyData.cep.replace(/\D/g, '') : '',
                country: 'Brasil'
            }];

            logger.error('PREPARANDO DADOS DA PESSOA - ENDEREÇOS PREPARADOS', { addresses });

            // Mapeamento de campos
            const personData = {
                full_name: companyData.razao_social,
                fantasy_name: companyData.fantasia,
                birth_date: companyData.data_abertura ? new Date(companyData.data_abertura) : null,
                person_type: 'PJ',
                contacts,
                addresses,
                additional_data: {
                    cnpj: companyData.cnpj || cnpj,
                    situation: companyData.situacao || '',
                    legal_nature: companyData.natureza_juridica || '',
                    company_size: companyData.porte || '',
                    social_capital: parseFloat(companyData.capital_social) || 0,
                    main_activity: companyData.atividade_principal 
                        ? companyData.atividade_principal[0]?.text || ''
                        : '',
                    last_update: companyData.ultima_atualizacao || new Date()
                }
            };

            logger.error('PREPARANDO DADOS DA PESSOA - DADOS FINAIS', { personData });

            return personData;
        } catch (error) {
            logger.error('Erro ao preparar dados da pessoa', {
                cnpj,
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async findPersonByCnpj(cnpj) {
        try {
            // Garantir que o CNPJ seja uma string limpa
            const cleanCnpj = String(cnpj).replace(/[^\d]/g, '');

            console.error('🔍 FIND PERSON BY CNPJ', { 
                originalCnpj: cnpj, 
                cleanCnpj,
                cleanCnpjType: typeof cleanCnpj 
            });

            const query = `
                SELECT p.* 
                FROM persons p
                JOIN person_documents pd ON p.person_id = pd.person_id
                WHERE pd.document_type = 'CNPJ' 
                AND pd.document_value = $1
            `;
            
            const { rows } = await systemDatabase.query(query, [cleanCnpj]);
            
            console.error('🔍 FIND PERSON BY CNPJ RESULT', { 
                rowsCount: rows.length,
                rows 
            });

            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            logger.error('Erro ao buscar pessoa por CNPJ', {
                cnpj,
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async savePersonDocuments(personId, documents, client = null) {
        try {
            const dbClient = client || systemDatabase;
            logger.info('Salvando documentos da pessoa', { personId, documents });

            if (!documents || documents.length === 0) {
                return true;
            }

            for (const document of documents) {
                // Verificar se já existe um documento do mesmo tipo para esta pessoa
                const existingDocument = await personDocumentRepository.findAll({
                    person_id: personId,
                    document_type: document.document_type
                }, 1, 1);

                if (existingDocument.length > 0) {
                    // Se o documento já existe, fazer update
                    await personDocumentRepository.update(
                        existingDocument[0].person_document_id, 
                        {
                            document_type: document.document_type,
                            document_value: document.document_value
                        }
                    );
                } else {
                    // Se o documento não existe, criar novo
                    await personDocumentRepository.create({
                        person_id: personId,
                        document_type: document.document_type,
                        document_value: document.document_value
                    });
                }
            }

            return true;
        } catch (error) {
            logger.error('Erro ao salvar documentos da pessoa', { 
                errorMessage: error.message,
                errorStack: error.stack,
                personId,
                documents
            });
            throw error;
        }
    }

    // Método para buscar pessoa por documento
    async findPersonByDocument(documentValue) {
        try {
            const personDocumentRepository = require('../repositories/personDocumentRepository');
            
            // Buscar o documento primeiro
            const documents = await personDocumentRepository.findAll({
                document_value: documentValue
            });

            // Se encontrar documento, retornar a pessoa
            if (documents.length > 0) {
                const personId = documents[0].person_id;
                return await personRepository.findById(personId);
            }

            return null;
        } catch (error) {
            logger.error('Erro ao buscar pessoa por documento', { 
                documentValue, 
                error: error.message 
            });
            return null;
        }
    }

    // Método para buscar pessoa por nome
    async findPersonByName(fullName) {
        try {
            const result = await personRepository.findAll(1, 1, fullName);
            return result.data.length > 0 ? result.data[0] : null;
        } catch (error) {
            logger.error('Erro ao buscar pessoa por nome', { 
                fullName, 
                error: error.message 
            });
            return null;
        }
    }

    async addPersonDocuments(personId, documents) {
        try {
            console.log('🔍 PERSON SERVICE: Adicionando documentos', { 
                personId, 
                documents,
                personIdType: typeof personId 
            });

            // Validar personId
            const validPersonId = Number(personId);
            if (isNaN(validPersonId) || validPersonId <= 0) {
                throw new Error('Invalid person ID');
            }

            // Filtrar e validar documentos
            const validDocuments = documents.filter(doc => 
                doc.document_type && 
                doc.document_value && 
                typeof doc.document_type === 'string' &&
                typeof doc.document_value === 'string'
            );

            if (validDocuments.length === 0) {
                console.warn('🚨 PERSON SERVICE: Nenhum documento válido para adicionar');
                return [];
            }

            const addedDocuments = [];

            for (const doc of validDocuments) {
                try {
                    const result = await this.personDocumentRepository.create({
                        person_id: validPersonId,
                        document_type: doc.document_type,
                        document_value: doc.document_value
                    });
                    addedDocuments.push(result);
                } catch (docError) {
                    console.error('🚨 PERSON SERVICE: Erro ao adicionar documento individual', {
                        personId: validPersonId,
                        document: doc,
                        error: docError.message
                    });
                }
            }

            return addedDocuments;
        } catch (error) {
            console.error('🚨 PERSON SERVICE: Erro ao adicionar documentos', {
                personId,
                documents,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async addPersonAddresses(personId, addresses, client = null) {
        const personAddressRepository = require('../repositories/personAddressRepository');
        const cepService = require('../services/cepService');
        
        console.log('🏠 INÍCIO - Processamento de Endereços', { 
            personId, 
            addressCount: addresses.length,
            addressDetails: JSON.stringify(addresses, null, 2)
        });

        try {
            // Usar o cliente de transação ou o padrão
            const dbClient = client || systemDatabase;

            // Buscar endereços existentes
            console.log('🔍 Buscando endereços existentes para pessoa');
            const existingAddresses = await personAddressRepository.findByPersonId(personId);
            console.log('📋 Endereços existentes:', JSON.stringify(existingAddresses, null, 2));

            // Mapear endereços existentes por identificadores únicos
            const addressMap = new Map(
                existingAddresses.map(addr => [
                    this.generateAddressKey(addr), 
                    addr
                ])
            );

            // Processar cada endereço recebido
            for (const address of addresses) {
                console.log('🌐 PROCESSANDO ENDEREÇO', { addressInput: address });
                
                const addressKey = this.generateAddressKey(address);
                console.log('🔑 CHAVE DE ENDEREÇO', { addressKey });
                
                // Verificar se o endereço já existe
                const existingAddress = addressMap.get(addressKey);
                console.log('🏘️ ENDEREÇO EXISTENTE', { existingAddress });

                // Verificar se precisa buscar dados do CEP
                let addressData = { ...address };
                if ((!address.ibge || address.ibge.trim() === '') && address.postal_code) {
                    console.log('🔎 Buscando informações de CEP', { cep: address.postal_code });
                    try {
                        const cepInfo = await cepService.findAddressByCep(address.postal_code);
                        if (cepInfo && cepInfo.ibge) {
                            addressData.ibge = cepInfo.ibge;
                            console.log('✅ Informações de CEP encontradas', { cepInfo });
                        }
                    } catch (cepError) {
                        console.warn('❗ Erro ao consultar CEP', { 
                            cep: address.postal_code,
                            error: cepError.message 
                        });
                    }
                }

                if (existingAddress) {
                    // Atualizar endereço existente
                    console.log('🔄 Atualizando endereço existente', { 
                        existingAddressId: existingAddress.id,
                        addressData 
                    });
                    const updatedAddress = await personAddressRepository.update(
                        existingAddress.id, 
                        {
                            street: addressData.street,
                            number: addressData.number,
                            complement: addressData.complement,
                            neighborhood: addressData.neighborhood,
                            city: addressData.city,
                            state: addressData.state,
                            postal_code: addressData.postal_code || addressData.zip_code,
                            country: addressData.country || 'Brasil',
                            reference: addressData.reference,
                            ibge: addressData.ibge
                        }
                    );
                    console.log('✅ ENDEREÇO ATUALIZADO', { updatedAddress });
                    
                    // Remover da lista de mapeamento para não ser deletado
                    addressMap.delete(addressKey);
                } else {
                    // Criar novo endereço
                    console.log('➕ Criando novo endereço', { 
                        personId,
                        addressData 
                    });
                    const newAddress = await personAddressRepository.create({
                        person_id: personId,
                        street: addressData.street,
                        number: addressData.number,
                        complement: addressData.complement,
                        neighborhood: addressData.neighborhood,
                        city: addressData.city,
                        state: addressData.state,
                        postal_code: addressData.postal_code || addressData.zip_code,
                        country: addressData.country || 'Brasil',
                        reference: addressData.reference,
                        ibge: addressData.ibge
                    });
                    console.log('✅ NOVO ENDEREÇO CRIADO', { newAddress });
                }
            }

            // Remover endereços que não foram atualizados
            for (const [, addressToDelete] of addressMap) {
                const deletedAddress = await personAddressRepository.delete(addressToDelete.id);
                console.log('❌ ENDEREÇO DELETADO', { deletedAddress });
            }

        } catch (error) {
            console.error('❌ Erro ao processar endereços da pessoa', { 
                personId, 
                addresses,
                error: error.message 
            });
            logger.error('Erro ao adicionar endereços', { 
                personId, 
                addresses,
                error: error.message 
            });
            throw error;
        }
    }

    // Método auxiliar para gerar chave única de endereço
    generateAddressKey(address) {
        // Remove espaços e converte para minúsculas para comparação
        const normalize = (str) => str ? str.trim().toLowerCase() : '';

        const addressKey = [
            normalize(address.street),
            normalize(address.number),
            normalize(address.complement),
            normalize(address.neighborhood),
            normalize(address.city),
            normalize(address.state),
            normalize(address.postal_code || address.zip_code)
        ].join('|');

        console.log('🔑 Gerando chave de endereço:', {
            originalAddress: address,
            addressKey
        });

        return addressKey;
    }

    // Método para adicionar contatos
    async addPersonContacts(personId, contacts, client = null) {
        const personContactRepository = require('../repositories/personContactRepository');
        
        try {
            logger.info(' Adicionando contatos da pessoa', { personId, contacts });

            // Usar o cliente de transação ou o padrão
            const dbClient = client || systemDatabase;

            for (const contact of contacts) {
                await personContactRepository.createPersonContact({
                    person_id: personId,
                    ...contact
                }, dbClient);
            }
        } catch (error) {
            logger.error(' Erro ao adicionar contatos da pessoa', { 
                personId, 
                contacts,
                error: error.message 
            });
            throw error;
        }
    }

    // Método para adicionar licenças de pessoa
    async addPersonLicenses(personId, req, client = null) {
        const userRepository = require('../repositories/userRepository');
        const personLicenseRepository = require('../repositories/personLicenseRepository');
        
        try {
            logger.info(' Adicionando licenças da pessoa', { personId });

            // Usar o cliente de transação ou o padrão
            const dbClient = client || systemDatabase;

            // Buscar licenças do usuário
            const userLicenses = await userRepository.getUserLicenses(req.user.user_id, dbClient);
            
            // Se existir licença, adicionar à pessoa
            if (userLicenses.total > 0) {
                const licenseId = userLicenses.data[0].license_id;
                
                await personLicenseRepository.createPersonLicense({
                    person_id: personId,
                    license_id: licenseId
                }, dbClient);
            }

            return userLicenses;
        } catch (error) {
            // Se o erro for de associação já existente, não faz nada
            if (error.message === 'Associação pessoa-licença já existe') {
                logger.info('Associação pessoa-licença já existe', { 
                    personId, 
                    userId: req.user.user_id 
                });
                return;
            }

            logger.error(' Erro ao adicionar licenças da pessoa', { 
                personId, 
                userId: req.user.user_id,
                error: error.message 
            });
            
            // Não lança erro para não interromper o fluxo de criação/atualização
        }
    }

    async preparePersonData(personData, personId = null) {
        logger.info('Preparando dados da pessoa', { personData, personId });

        // Extrair dados básicos da pessoa
        const { 
            full_name, 
            fantasy_name, 
            birth_date, 
            person_type = 'PF', 
            active = true 
        } = personData;

        logger.info('Dados básicos extraídos', { 
            full_name, 
            fantasy_name, 
            birth_date, 
            person_type, 
            active 
        });

        // Preparar objeto de dados da pessoa
        const personDataToSave = {
            full_name,
            fantasy_name,
            birth_date,
            person_type,
            active
        };

        logger.info('Dados da pessoa para salvar', { personDataToSave });

        // Processar documentos
        if (personData.documents && personData.documents.length > 0) {
            const processedDocuments = await this.processPersonDocuments(personData.documents, personId);
            logger.info('Documentos processados', { processedDocuments });
        }

        // Processar contatos
        if (personData.contacts && personData.contacts.length > 0) {
            const processedContacts = await this.addPersonContacts(personId, personData.contacts);
            logger.info('Contatos processados', { processedContacts });
        }

        // Processar endereços
        if (personData.addresses && personData.addresses.length > 0) {
            logger.info('Preparando para processar endereços', { 
                addresses: personData.addresses, 
                personId 
            });
            const processedAddresses = await this.addPersonAddresses(personId, personData.addresses);
            logger.info('Endereços processados', { processedAddresses });
        } else {
            logger.info('Nenhum endereço para processar');
        }

        return personDataToSave;
    }

    async addPersonAddress(personId, addressData) {
        try {
            console.error('🚨 PERSON SERVICE: Adicionando endereço', { personId, addressData });

            // Validar se a pessoa existe usando o repositório diretamente
            const { data: pessoa, total } = await personRepository.findById(personId);
            
            console.error('🚨 PERSON SERVICE: Verificando pessoa', { pessoa, total });

            if (!pessoa || total === 0) {
                throw new ValidationError('Pessoa não encontrada', 404);
            }

            // Adicionar person_id ao addressData
            const completeAddressData = {
                ...addressData,
                person_id: personId
            };

            // Validar dados obrigatórios do endereço
            this.validateAddressData(completeAddressData);

            // Chamar o serviço de endereços para criar o endereço
            return await personAddressService.createPersonAddress(completeAddressData);
        } catch (error) {
            console.error('🚨 PERSON SERVICE: Erro ao adicionar endereço', error);
            throw error;
        }
    }

    // Método para validar dados do endereço
    validateAddressData(data) {
        const requiredFields = [
            'street', 'number', 
            'neighborhood', 'city', 'state', 
            'postal_code', 'country'
        ];

        for (const field of requiredFields) {
            if (!data[field]) {
                throw new ValidationError(`Campo ${field} é obrigatório para o endereço`);
            }
        }
    }

    async findPersonById(personId, client = null) {
        try {
            const dbClient = client || systemDatabase;
            const person = await personRepository.findPersonById(personId, dbClient);

            if (!person) {
                throw new ValidationError(`Pessoa com ID ${personId} não encontrada`);
            }

            // Buscar documentos da pessoa
            const documents = await this.getPersonDocuments(personId);
            
            // Buscar endereços da pessoa
            const addresses = await this.getPersonAddresses(personId);
            
            // Buscar contatos da pessoa
            const contacts = await this.getPersonContacts(personId);

            return {
                ...person,
                documents,
                addresses,
                contacts
            };
        } catch (error) {
            console.error('Erro ao buscar pessoa por ID', {
                personId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = PersonService;

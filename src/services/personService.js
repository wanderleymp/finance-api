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

class PersonService {
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
        return { documents, total: documents.length };
    }

    async getPersonContacts(personId) {
        // Verifica se a pessoa existe
        await this.getPerson(personId);
        const { contacts } = await personRelationService.findPersonRelations(personId);
        return { contacts, total: contacts.length };
    }

    async createPerson(personData, req, client = null) {
        try {
            logger.info(' Criando nova pessoa', { personData });

            // Validar dados da pessoa
            const validatedData = await this.validatePersonData(personData);

            // Formatar nomes
            validatedData.full_name = this.formatName(validatedData.full_name);
            validatedData.fantasy_name = this.formatName(validatedData.fantasy_name);

            // Usar o cliente de transação ou o padrão
            const dbClient = client || systemDatabase;

            // Criar pessoa no banco de dados
            const result = await personRepository.create(validatedData, dbClient);
            const personId = result.person_id;

            // Adicionar documentos, se existirem
            if (personData.documents) {
                await this.savePersonDocuments(personId, personData.documents, dbClient);
            }

            // Adicionar contatos, se existirem
            if (personData.contacts) {
                await this.addPersonContacts(personId, personData.contacts, dbClient);
            }

            // Adicionar endereços, se existirem
            if (personData.addresses) {
                await this.addPersonAddresses(personId, personData.addresses, dbClient);
            }

            // Adicionar licenças do usuário
            const userLicenses = await this.addPersonLicenses(personId, req, dbClient);

            // Recuperar pessoa completa
            const person = await personRepository.findPersonById(personId, dbClient);
            person.licenses = userLicenses;

            return person;

        } catch (error) {
            logger.error(' Erro ao criar pessoa', { 
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async updatePerson(personId, personData, req, client = null) {
        try {
            logger.info(' Atualizando pessoa', { personId, personData });

            // Validar dados da pessoa
            const validatedData = await this.validatePersonData(personData);

            // Formatar nomes
            validatedData.full_name = this.formatName(validatedData.full_name);
            validatedData.fantasy_name = this.formatName(validatedData.fantasy_name);

            // Usar o cliente de transação ou o padrão
            const dbClient = client || systemDatabase;

            // Atualizar pessoa no banco de dados
            await personRepository.updatePerson(personId, validatedData, dbClient);

            // Atualizar documentos, se existirem
            if (personData.documents) {
                await this.savePersonDocuments(personId, personData.documents, dbClient);
            }

            // Atualizar contatos, se existirem
            if (personData.contacts) {
                await this.addPersonContacts(personId, personData.contacts, dbClient);
            }

            // Atualizar endereços, se existirem
            if (personData.addresses) {
                await this.addPersonAddresses(personId, personData.addresses, dbClient);
            }

            // Adicionar licenças do usuário
            const userLicenses = await this.addPersonLicenses(personId, req, dbClient);

            // Recuperar pessoa completa
            const person = await personRepository.findPersonById(personId, dbClient);
            person.licenses = userLicenses;

            return person;

        } catch (error) {
            logger.error(' Erro ao atualizar pessoa', { 
                errorMessage: error.message,
                errorStack: error.stack
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
        const client = await systemDatabase.connect();

        try {
            // Iniciar transação
            await client.query('BEGIN');

            logger.info('Processando pessoa por CNPJ', { cnpj });

            // Preparar dados da pessoa
            const originalPersonData = await this.preparePersonData(cnpj);

            logger.error('PREPARANDO DADOS DA PESSOA - INÍCIO', { cnpj });

            logger.error('PREPARANDO DADOS DA PESSOA - DADOS DA EMPRESA', { originalPersonData });

            if (!originalPersonData) {
                throw new ValidationError('Dados da empresa não encontrados');
            }

            // Preparar contatos
            const contacts = [];
            if (originalPersonData.email) {
                contacts.push({
                    contact_type: 'email',
                    contact_value: originalPersonData.email
                });
            }
            if (originalPersonData.telefone) {
                contacts.push({
                    contact_type: 'phone',
                    contact_value: originalPersonData.telefone.replace(/\D/g, '')
                });
            }

            // Preparar endereços
            const addresses = [{
                street: originalPersonData.logradouro || '',
                number: originalPersonData.numero || '',
                complement: originalPersonData.complemento || '',
                neighborhood: originalPersonData.bairro || '',
                city: originalPersonData.municipio || '',
                state: originalPersonData.uf || '',
                zip_code: originalPersonData.cep ? originalPersonData.cep.replace(/\D/g, '') : ''
            }];

            // Mapeamento de campos
            const personData = {
                full_name: originalPersonData.razao_social,
                fantasy_name: originalPersonData.fantasia,
                birth_date: originalPersonData.data_abertura ? new Date(originalPersonData.data_abertura) : null,
                person_type: 'PJ',
                contacts,
                addresses,
                additional_data: {
                    cnpj: originalPersonData.cnpj || cnpj,
                    situation: originalPersonData.situacao || '',
                    legal_nature: originalPersonData.natureza_juridica || '',
                    company_size: originalPersonData.porte || '',
                    social_capital: parseFloat(originalPersonData.capital_social) || 0,
                    main_activity: originalPersonData.atividade_principal 
                        ? originalPersonData.atividade_principal[0]?.text || ''
                        : '',
                    last_update: originalPersonData.ultima_atualizacao || new Date()
                }
            };

            logger.error('PREPARANDO DADOS DA PESSOA - DADOS FINAIS', { personData });

            // Garantir que full_name sempre exista
            const basePersonData = {
                full_name: personData.full_name || `Pessoa CNPJ ${cnpj}`,
                fantasy_name: personData.fantasy_name,
                person_type: personData.person_type || 'PJ',
                birth_date: personData.birth_date,
                additional_data: personData.additional_data || {}
            };

            logger.error('DADOS PROCESSADOS DA PESSOA', { basePersonData });

            // Log de depuração
            logger.info('Dados da pessoa processados', { 
                cnpj, 
                personData, 
                fullName: basePersonData.full_name 
            });

            // Buscar pessoa existente por CNPJ
            let existingPerson = await this.findPersonByCnpj(cnpj);

            logger.error('PESSOA EXISTENTE', { existingPerson });

            // Se não encontrar por CNPJ, buscar por nome completo usando método de listagem
            if (!existingPerson) {
                const searchResult = await personRepository.findAll(1, 1, basePersonData.full_name);
                existingPerson = searchResult.data[0];
            }

            let person;
            const basePersonDataWithDocs = {
                ...basePersonData,
                documents: [{
                    document_type: 'CNPJ',
                    document_value: cnpj
                }],
                addresses: originalPersonData.addresses || [],
                contacts: originalPersonData.contacts || []
            };

            logger.error('BASE PERSON DATA', { basePersonDataWithDocs });

            if (existingPerson) {
                // Atualizar pessoa existente
                person = await this.updatePerson(existingPerson.person_id, basePersonDataWithDocs, null, client);
            } else {
                // Criar nova pessoa
                person = await this.createPerson(basePersonDataWithDocs, null, client);
            }

            // Commit da transação
            await client.query('COMMIT');

            return person;

        } catch (error) {
            // Rollback em caso de erro
            await client.query('ROLLBACK');

            logger.error('Erro no processamento de pessoa por CNPJ', {
                errorMessage: error.message,
                errorStack: error.stack,
                cnpj
            });
            throw error;
        } finally {
            // Liberar cliente
            client.release();
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
                zip_code: companyData.cep ? companyData.cep.replace(/\D/g, '') : ''
            }];

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
            logger.info(' Buscando dados externos da empresa', { cnpj });
            const companyData = await cnpjService.findByCnpj(cnpj);
            
            if (!companyData) {
                logger.warn(' Dados da empresa não encontrados, retornando objeto vazio', { cnpj });
                return {
                    cnpj: cnpj,
                    razao_social: `Pessoa CNPJ ${cnpj}`,
                    nome: `Pessoa CNPJ ${cnpj}`,
                    fantasia: null,
                    data_abertura: null,
                    situacao_cadastral: '',
                    natureza_juridica: '',
                    porte: '',
                    capital_social: 0,
                    atividade_principal: '',
                    ultima_atualizacao: new Date(),
                    contato: { email: '', telefone: '' },
                    endereco: { 
                        logradouro: '', 
                        numero: '', 
                        complemento: '', 
                        bairro: '', 
                        cidade: '', 
                        estado: '', 
                        cep: '' 
                    },
                    qsa: []
                };
            }
            
            logger.info(' Dados da empresa encontrados', { 
                cnpj, 
                razao_social: companyData.razao_social 
            });

            // Log detalhado dos dados da empresa
            logger.error('DEBUG: Dados completos da empresa', { companyData });

            return companyData;
        } catch (error) {
            logger.warn(' Erro ao buscar dados da empresa, retornando objeto vazio', { 
                cnpj,
                errorMessage: error.message,
                errorStack: error.stack
            });
            
            return {
                cnpj: cnpj,
                razao_social: `Pessoa CNPJ ${cnpj}`,
                nome: `Pessoa CNPJ ${cnpj}`,
                fantasia: null,
                data_abertura: null,
                situacao_cadastral: '',
                natureza_juridica: '',
                porte: '',
                capital_social: 0,
                atividade_principal: '',
                ultima_atualizacao: new Date(),
                contato: { email: '', telefone: '' },
                endereco: { 
                    logradouro: '', 
                    numero: '', 
                    complemento: '', 
                    bairro: '', 
                    cidade: '', 
                    estado: '', 
                    cep: '' 
                },
                qsa: []
            };
        }
    }

    async findPersonByCnpj(cnpj) {
        try {
            const query = `
                SELECT p.* 
                FROM persons p
                JOIN person_documents pd ON p.person_id = pd.person_id
                WHERE pd.document_type = 'CNPJ' 
                AND pd.document_value = $1
            `;
            
            const { rows } = await systemDatabase.query(query, [cnpj]);
            
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

    // Método para adicionar documentos
    async addPersonDocuments(personId, documents, client = null) {
        const personDocumentRepository = require('../repositories/personDocumentRepository');
        
        try {
            logger.info(' Adicionando documentos da pessoa', { personId, documents });

            // Usar o cliente de transação ou o padrão
            const dbClient = client || systemDatabase;

            for (const doc of documents) {
                // Verificar se o documento já existe para qualquer pessoa
                const existingDocuments = await personDocumentRepository.findAll({
                    document_type: doc.document_type,
                    document_value: doc.document_value
                }, dbClient);

                if (existingDocuments.length > 0) {
                    // Se o documento já existe para outra pessoa, lançar erro
                    throw new ValidationError(`Documento ${doc.document_type} ${doc.document_value} já cadastrado`);
                }

                // Criar novo documento
                await personDocumentRepository.createPersonDocument({
                    person_id: personId,
                    ...doc
                }, dbClient);
            }
        } catch (error) {
            logger.error(' Erro ao adicionar documentos da pessoa', { 
                personId, 
                documents,
                error: error.message 
            });
            throw error;
        }
    }

    // Método para adicionar endereços
    async addPersonAddresses(personId, addresses, client = null) {
        const personAddressRepository = require('../repositories/personAddressRepository');
        
        try {
            logger.info(' Adicionando endereços da pessoa', { personId, addresses });

            // Usar o cliente de transação ou o padrão
            const dbClient = client || systemDatabase;

            for (const address of addresses) {
                await personAddressRepository.createPersonAddress({
                    person_id: personId,
                    ...address
                }, dbClient);
            }
        } catch (error) {
            logger.error(' Erro ao adicionar endereços da pessoa', { 
                personId, 
                addresses,
                error: error.message 
            });
            throw error;
        }
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
}

module.exports = new PersonService();

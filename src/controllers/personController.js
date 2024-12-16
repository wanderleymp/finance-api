const PersonService = require('../services/personService');
const personService = new PersonService();
const cnpjService = require('../services/cnpjService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');

class PersonController {
    async index(req, res) {
        try {
            logger.info('Iniciando listagem de pessoas', {
                query: req.query
            });
            
            const { page, limit, search } = req.query;
            const result = await personService.listPersons(page, limit, search);
            
            logger.info('Listagem de pessoas concluída', { 
                count: result.data.length,
                currentPage: result.meta.current_page,
                totalRecords: result.meta.total,
                searchTerm: search || null
            });
            
            handleResponse(res, 200, result);
        } catch (error) {
            logger.error('Erro na listagem de pessoas', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            handleError(res, error);
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            const person = await personService.getPerson(id);
            handleResponse(res, 200, { data: person });
        } catch (error) {
            handleError(res, error);
        }
    }

    async documents(req, res) {
        try {
            const { id } = req.params;
            const documents = await personService.getPersonDocuments(id);
            handleResponse(res, 200, { data: documents });
        } catch (error) {
            handleError(res, error);
        }
    }

    async store(req, res) {
        try {
            const personData = req.body;

            const person = await personService.createPerson(personData, req);

            res.status(201).json({
                status: 'success',
                message: 'Pessoa criada com sucesso',
                data: person
            });
        } catch (error) {
            logger.error('Erro no controlador ao criar pessoa', {
                errorMessage: error.message,
                errorStack: error.stack
            });

            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    status: 'error',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'error',
                message: 'Erro interno ao criar pessoa'
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const personData = req.body;

            const person = await personService.updatePerson(id, personData, req);

            res.status(200).json({
                status: 'success',
                message: 'Pessoa atualizada com sucesso',
                data: person
            });
        } catch (error) {
            logger.error('Erro no controlador ao atualizar pessoa', {
                errorMessage: error.message,
                errorStack: error.stack
            });

            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    status: 'error',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'error',
                message: 'Erro interno ao atualizar pessoa'
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await personService.deletePerson(id);
            handleResponse(res, 204);
        } catch (error) {
            handleError(res, error);
        }
    }

    async contacts(req, res) {
        try {
            const { id } = req.params;
            const contacts = await personService.getPersonContacts(id);
            handleResponse(res, 200, { data: contacts });
        } catch (error) {
            handleError(res, error);
        }
    }

    // Método para consultar CNPJ
    async findByCnpj(req, res) {
        try {
            logger.info(' CONTROLLER: Iniciando consulta de CNPJ', { 
                reqParams: JSON.stringify(req.params),
                reqBody: JSON.stringify(req.body),
                reqQuery: JSON.stringify(req.query)
            });

            const { cnpj } = req.params;
            
            logger.info(' CONTROLLER: Extraindo CNPJ', { 
                cnpj,
                cnpjType: typeof cnpj
            });
            
            const companyData = await cnpjService.findByCnpj(cnpj);
            
            logger.info(' CONTROLLER: Consulta de CNPJ concluída', { 
                cnpj,
                companyData: JSON.stringify(companyData)
            });
            
            handleResponse(res, 200, { data: companyData });
        } catch (error) {
            logger.error(' CONTROLLER: Erro na consulta de CNPJ', {
                errorMessage: error.message,
                errorStack: error.stack,
                reqParams: JSON.stringify(req.params)
            });
            handleError(res, error);
        }
    }

    async createPersonByCnpj(req, res) {
        try {
            console.error(' CNPJ CONTROLLER: Iniciando criação/atualização', { 
                params: req.params,
                body: req.body
            });

            const { cnpj } = req.params;
            console.error(' CNPJ CONTROLLER: CNPJ recebido:', cnpj);
            console.error(' CNPJ CONTROLLER: Tipo do CNPJ:', typeof cnpj);

            // Remover caracteres não numéricos
            const cleanCnpj = cnpj.replace(/[^\d]/g, '');
            console.error(' CNPJ CONTROLLER: CNPJ limpo:', cleanCnpj);
            console.error(' CNPJ CONTROLLER: Tipo do CNPJ limpo:', typeof cleanCnpj);

            const additionalData = req.body || {};

            // Consulta dados da empresa
            const companyData = await cnpjService.findByCnpj(cleanCnpj);
            console.error(' CNPJ CONTROLLER: Dados da empresa:', companyData);
        
            // Preparar dados para persistência
            const personData = {
                full_name: companyData.razao_social,
                fantasy_name: companyData.nome_fantasia,
                person_type: 'PJ',
                documents: [{
                    document_type: 'CNPJ',
                    document_value: cleanCnpj
                }],
                additional_data: {
                    ...companyData,
                    ...additionalData.additional_data
                },
                ...additionalData
            };

            // Verificar se já existe pessoa com esse CNPJ
            const existingPerson = await personService.findPersonByCnpj(cleanCnpj);
            console.error(' CNPJ CONTROLLER: Pessoa existente:', existingPerson);

            let resultPerson;
            if (existingPerson) {
                // Atualizar pessoa existente
                resultPerson = await personService.updatePerson(existingPerson.person_id, personData, req);
            
                console.error(' CNPJ CONTROLLER: Pessoa atualizada', resultPerson);

                handleResponse(res, 200, { 
                    data: resultPerson,
                    message: 'Pessoa atualizada com sucesso' 
                });
            } else {
                // Criar nova pessoa
                resultPerson = await personService.createPerson(personData, req);

                console.error(' CNPJ CONTROLLER: Pessoa criada', resultPerson);

                handleResponse(res, 201, { 
                    data: resultPerson,
                    message: 'Pessoa criada com sucesso' 
                });
            }

        } catch (error) {
            console.error(' CNPJ CONTROLLER: Erro', {
                message: error.message,
                stack: error.stack
            });
            handleError(res, error);
        }
    }

    async addPersonAddress(req, res) {
        try {
            console.error(' CONTROLLER: addPersonAddress - INÍCIO');
            console.error(' CONTROLLER: params:', req.params);
            console.error(' CONTROLLER: body:', req.body);
            
            const { id: personId } = req.params;
            const addressData = req.body;
            
            console.error(' CONTROLLER: Chamando personService.addPersonAddress');
            const newAddress = await personService.addPersonAddress(personId, addressData);
            
            console.error(' CONTROLLER: Endereço criado com sucesso');
            handleResponse(res, 201, { data: newAddress });
        } catch (error) {
            console.error(' CONTROLLER: Erro no addPersonAddress', error);
            handleError(res, error);
        }
    }
}

module.exports = PersonController;

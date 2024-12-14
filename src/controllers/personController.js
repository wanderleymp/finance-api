const personService = require('../services/personService');
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
            const newPerson = await personService.createPerson(personData);
            handleResponse(res, 201, { data: newPerson });
        } catch (error) {
            handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const personData = req.body;
            const updatedPerson = await personService.updatePerson(id, personData);
            handleResponse(res, 200, { data: updatedPerson });
        } catch (error) {
            handleError(res, error);
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

    async indexWithRelations(req, res) {
        try {
            logger.info('Iniciando listagem de pessoas com relacionamentos', {
                query: req.query
            });
            
            const { page, limit, search } = req.query;
            const result = await personService.listPersonsWithRelations(page, limit, search);
            
            logger.info('Listagem de pessoas com relacionamentos concluída', { 
                count: result.data.length,
                currentPage: result.meta.current_page,
                totalRecords: result.meta.total,
                searchTerm: search || null
            });
            
            handleResponse(res, 200, result);
        } catch (error) {
            logger.error('Erro na listagem de pessoas com relacionamentos', {
                errorMessage: error.message,
                errorStack: error.stack
            });
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
            logger.info('🔍 CONTROLLER: Iniciando consulta de CNPJ', { 
                reqParams: JSON.stringify(req.params),
                reqBody: JSON.stringify(req.body),
                reqQuery: JSON.stringify(req.query)
            });

            const { cnpj } = req.params;
            
            logger.info('🔬 CONTROLLER: Extraindo CNPJ', { 
                cnpj,
                cnpjType: typeof cnpj
            });
            
            const companyData = await cnpjService.findByCnpj(cnpj);
            
            logger.info('✅ CONTROLLER: Consulta de CNPJ concluída', { 
                cnpj,
                companyData: JSON.stringify(companyData)
            });
            
            handleResponse(res, 200, { data: companyData });
        } catch (error) {
            logger.error('❌ CONTROLLER: Erro na consulta de CNPJ', {
                errorMessage: error.message,
                errorStack: error.stack,
                reqParams: JSON.stringify(req.params)
            });
            handleError(res, error);
        }
    }
}

module.exports = new PersonController();

const personLicenseService = require('../services/personLicenseService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');

class PersonLicenseController {
    async index(req, res) {
        try {
            const { page, limit } = req.query;
            
            const personLicenses = await personLicenseService.listPersonLicenses({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10
            });

            logger.info('Associações pessoa-licença recuperadas com sucesso', { 
                total: personLicenses.total 
            });

            return handleResponse(res, 200, personLicenses);
        } catch (error) {
            logger.error('Erro ao buscar associações pessoa-licença', { 
                error: error.message, 
                query: req.query 
            });
            return handleError(res, error);
        }
    }

    async create(req, res) {
        try {
            const personLicense = await personLicenseService.createPersonLicense(req.body);
            
            logger.info('Associação pessoa-licença criada com sucesso', { 
                personId: req.body.person_id, 
                licenseId: req.body.license_id 
            });

            return handleResponse(res, 201, personLicense);
        } catch (error) {
            logger.error('Erro ao criar associação pessoa-licença', { 
                error: error.message, 
                body: req.body 
            });
            return handleError(res, error);
        }
    }

    async getPersonLicenses(req, res) {
        try {
            const { personId } = req.params;
            const { page, limit } = req.query;
            
            const personLicenses = await personLicenseService.getPersonLicenses(
                personId, 
                { page: parseInt(page), limit: parseInt(limit) }
            );

            logger.info('Licenças da pessoa recuperadas com sucesso', { 
                personId, 
                total: personLicenses.total 
            });

            return handleResponse(res, 200, personLicenses);
        } catch (error) {
            logger.error('Erro ao buscar licenças da pessoa', { 
                error: error.message, 
                params: req.params 
            });
            return handleError(res, error);
        }
    }

    async getLicensePersons(req, res) {
        try {
            const { licenseId } = req.params;
            const { page, limit } = req.query;
            
            const licensePeople = await personLicenseService.getLicensePersons(
                licenseId, 
                { page: parseInt(page), limit: parseInt(limit) }
            );

            logger.info('Pessoas da licença recuperadas com sucesso', { 
                licenseId, 
                total: licensePeople.total 
            });

            return handleResponse(res, 200, licensePeople);
        } catch (error) {
            logger.error('Erro ao buscar pessoas da licença', { 
                error: error.message, 
                params: req.params 
            });
            return handleError(res, error);
        }
    }

    async remove(req, res) {
        try {
            const { personId, licenseId } = req.params;
            
            const removedAssociation = await personLicenseService.removePersonLicense(personId, licenseId);

            logger.info('Associação pessoa-licença removida com sucesso', { 
                personId, 
                licenseId 
            });

            return handleResponse(res, 204);
        } catch (error) {
            logger.error('Erro ao remover associação pessoa-licença', { 
                error: error.message, 
                params: req.params 
            });
            return handleError(res, error);
        }
    }
}

module.exports = new PersonLicenseController();

const licenseService = require('../services/licenseService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');

class LicenseController {
    async index(req, res) {
        try {
            logger.info('CONTROLLER: Iniciando listagem de licenças', {
                query: req.query,
                queryType: typeof req.query
            });
            
            const { page, limit, ...filters } = req.query;
            
            logger.info('CONTROLLER: Parâmetros extraídos', {
                page, 
                limit, 
                filtersKeys: Object.keys(filters),
                pageType: typeof page,
                limitType: typeof limit
            });
            
            const result = await licenseService.listLicenses(page, limit, filters);
            
            logger.info('CONTROLLER: Listagem de licenças concluída', { 
                count: result.data.length,
                currentPage: result.meta.current_page,
                totalRecords: result.meta.total,
                filters
            });
            
            handleResponse(res, 200, result);
        } catch (error) {
            logger.error('CONTROLLER: Erro na listagem de licenças', {
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack,
                query: req.query
            });
            handleError(res, error);
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            const license = await licenseService.getLicense(id);
            handleResponse(res, 200, { data: license });
        } catch (error) {
            handleError(res, error);
        }
    }

    async store(req, res) {
        try {
            const licenseData = req.body;
            const newLicense = await licenseService.createLicense(licenseData);
            handleResponse(res, 201, { data: newLicense });
        } catch (error) {
            handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const licenseData = req.body;
            const updatedLicense = await licenseService.updateLicense(id, licenseData);
            handleResponse(res, 200, { data: updatedLicense });
        } catch (error) {
            handleError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await licenseService.deleteLicense(id);
            handleResponse(res, 204);
        } catch (error) {
            handleError(res, error);
        }
    }

    async listByPerson(req, res) {
        try {
            const { person_id } = req.params;
            const licenses = await licenseService.getLicensesByPerson(person_id);
            handleResponse(res, 200, { data: licenses });
        } catch (error) {
            handleError(res, error);
        }
    }
}

module.exports = new LicenseController();

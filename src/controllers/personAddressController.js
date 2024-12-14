const personAddressService = require('../services/personAddressService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');

class PersonAddressController {
    async index(req, res) {
        try {
            logger.info('Iniciando listagem de endereços de pessoas', {
                query: req.query
            });
            
            const { page, limit, ...filters } = req.query;
            const result = await personAddressService.listPersonAddresses(page, limit, filters);
            
            logger.info('Listagem de endereços de pessoas concluída', { 
                count: result.data.length,
                currentPage: result.meta.current_page,
                totalRecords: result.meta.total
            });
            
            handleResponse(res, 200, result);
        } catch (error) {
            logger.error('Erro na listagem de endereços de pessoas', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            handleError(res, error);
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            const address = await personAddressService.getPersonAddress(id);
            handleResponse(res, 200, { data: address });
        } catch (error) {
            handleError(res, error);
        }
    }

    async store(req, res) {
        try {
            const addressData = req.body;
            const newAddress = await personAddressService.createPersonAddress(addressData);
            handleResponse(res, 201, { data: newAddress });
        } catch (error) {
            handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const addressData = req.body;
            const updatedAddress = await personAddressService.updatePersonAddress(id, addressData);
            handleResponse(res, 200, { data: updatedAddress });
        } catch (error) {
            handleError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await personAddressService.deletePersonAddress(id);
            handleResponse(res, 204);
        } catch (error) {
            handleError(res, error);
        }
    }
}

module.exports = new PersonAddressController();

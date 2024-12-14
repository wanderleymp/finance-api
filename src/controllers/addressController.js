const cepService = require('../services/cepService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');

class AddressController {
    async findByCep(req, res) {
        try {
            const { cep } = req.params;
            
            logger.info('Iniciando consulta de CEP', { cep });
            
            const address = await cepService.findAddressByCep(cep);
            
            handleResponse(res, 200, { data: address });
        } catch (error) {
            logger.error('Erro na consulta de CEP', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            handleError(res, error);
        }
    }
}

module.exports = new AddressController();

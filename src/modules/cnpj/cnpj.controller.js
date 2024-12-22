const { logger } = require('../../middlewares/logger');
const CnpjService = require('./cnpj.service');
const { handleResponse, handleError } = require('../../utils/responseHandler');
const CnpjValidator = require('./validators/cnpj.validator');

class CnpjController {
    constructor(
        cnpjService = CnpjService, 
        cnpjValidator = CnpjValidator
    ) {
        this.cnpjService = cnpjService;
        this.cnpjValidator = cnpjValidator;
    }

    /**
     * Consulta informações de CNPJ
     */
    async consultCnpj(req, res) {
        try {
            const { cnpj } = req.params;

            // Valida CNPJ
            const validationError = this.cnpjValidator.validateCnpj(cnpj);
            if (validationError) {
                return handleError(res, new Error(validationError), 400);
            }

            const cnpjData = await this.cnpjService.consultCnpj(cnpj);

            return handleResponse(res, cnpjData);
        } catch (error) {
            logger.error('Erro na consulta de CNPJ', {
                error: error.message,
                params: req.params
            });
            return handleError(res, error);
        }
    }
}

module.exports = new CnpjController();

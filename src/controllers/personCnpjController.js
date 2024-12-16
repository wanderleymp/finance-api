const personService = require('../services/personService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');
const { cleanDocument } = require('../utils/documentUtils');
const ValidationError = require('../utils/errors');

class PersonCnpjController {
    async createOrUpdateByCnpj(req, res) {
        try {
            // Validação mínima de CNPJ
            const cnpj = this.validateCnpj(req.params.cnpj);
            
            logger.info('Processando pessoa por CNPJ', { cnpj });

            // Delegação única para serviço
            const result = await personService.createOrUpdatePersonByCnpj(cnpj);
            
            // Resposta padronizada
            handleResponse(res, 201, { 
                data: result,
                message: 'Pessoa processada com sucesso' 
            });
        } catch (error) {
            logger.error('Erro no processamento de pessoa por CNPJ', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            handleError(res, error);
        }
    }

    validateCnpj(cnpj) {
        const cleanedCnpj = cleanDocument(cnpj);
        
        if (!cleanedCnpj || cleanedCnpj.length !== 14) {
            throw new ValidationError('CNPJ inválido');
        }
        
        return cleanedCnpj;
    }
}

module.exports = new PersonCnpjController();

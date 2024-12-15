const personService = require('../services/personService');
const cnpjService = require('../services/cnpjService');
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');
const { cleanDocument } = require('../utils/documentUtils');
const ValidationError = require('../utils/errors');

class PersonCnpjController {
    async createOrUpdateByCnpj(req, res) {
        try {
            logger.info('CONTROLLER: Iniciando criação/atualização por CNPJ', {
                reqBody: JSON.stringify(req.body),
                reqParams: JSON.stringify(req.params)
            });

            const cnpj = req.body.cnpj || req.params.cnpj;
            const cleanedCnpj = cleanDocument(cnpj);

            if (!cleanedCnpj) {
                throw new ValidationError('CNPJ é obrigatório');
            }

            // Consulta dados da empresa
            const companyData = await cnpjService.findByCnpj(cleanedCnpj);
            
            // Preparar dados para persistência
            const personData = {
                full_name: companyData.razao_social,
                fantasy_name: companyData.nome_fantasia,
                person_type: 'PJ',
                documents: [{
                    document_type: 'CNPJ',
                    document_value: cleanedCnpj
                }],
                additional_data: {
                    ...companyData
                }
            };

            // Criar ou atualizar pessoa
            const result = await personService.createOrUpdatePersonByCnpj(personData);

            logger.info('CONTROLLER: Criação/atualização por CNPJ concluída', { 
                personId: result.person_id 
            });

            handleResponse(res, 201, { 
                data: result,
                message: 'Pessoa criada/atualizada com sucesso' 
            });

        } catch (error) {
            logger.error('CONTROLLER: Erro na criação/atualização por CNPJ', {
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack
            });
            handleError(res, error);
        }
    }
}

module.exports = new PersonCnpjController();

const ServiceLc116Service = require('../services/serviceLc116Service');
const serviceLc116Service = new ServiceLc116Service();
const { handleResponse, handleError } = require('../utils/responseHandler');
const { logger } = require('../middlewares/logger');

class ServiceLc116Controller {
    async index(req, res) {
        try {
            logger.info('Iniciando listagem de serviços LC116', {
                query: req.query
            });
            
            const { page, limit, ...filters } = req.query;
            const result = await serviceLc116Service.listServiceLc116(page, limit, filters);
            
            logger.info('Listagem de serviços LC116 concluída', { 
                count: result.data.length,
                currentPage: result.meta.current_page,
                totalRecords: result.meta.total
            });
            
            handleResponse(res, 200, result);
        } catch (error) {
            logger.error('Erro na listagem de serviços LC116', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            handleError(res, error);
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Buscando serviço LC116 por ID', { id });
            
            const serviceLc116 = await serviceLc116Service.getServiceLc116ById(id);
            
            handleResponse(res, 200, serviceLc116);
        } catch (error) {
            logger.error('Erro ao buscar serviço LC116', {
                errorMessage: error.message,
                errorStack: error.stack,
                id: req.params.id
            });
            handleError(res, error);
        }
    }

    async store(req, res) {
        try {
            logger.info('Criando novo serviço LC116', { body: req.body });
            
            const newServiceLc116 = await serviceLc116Service.createServiceLc116(req.body);
            
            logger.info('Serviço LC116 criado com sucesso', { 
                id: newServiceLc116.service_lc116_id 
            });
            
            handleResponse(res, 201, newServiceLc116);
        } catch (error) {
            logger.error('Erro ao criar serviço LC116', {
                errorMessage: error.message,
                errorStack: error.stack,
                body: req.body
            });
            handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Atualizando serviço LC116', { id, body: req.body });
            
            const updatedServiceLc116 = await serviceLc116Service.updateServiceLc116(id, req.body);
            
            logger.info('Serviço LC116 atualizado com sucesso', { 
                id: updatedServiceLc116.service_lc116_id 
            });
            
            handleResponse(res, 200, updatedServiceLc116);
        } catch (error) {
            logger.error('Erro ao atualizar serviço LC116', {
                errorMessage: error.message,
                errorStack: error.stack,
                id: req.params.id,
                body: req.body
            });
            handleError(res, error);
        }
    }

    async destroy(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Deletando serviço LC116', { id });
            
            const deletedServiceLc116 = await serviceLc116Service.deleteServiceLc116(id);
            
            logger.info('Serviço LC116 deletado com sucesso', { id });
            
            handleResponse(res, 200, deletedServiceLc116);
        } catch (error) {
            logger.error('Erro ao deletar serviço LC116', {
                errorMessage: error.message,
                errorStack: error.stack,
                id: req.params.id
            });
            handleError(res, error);
        }
    }
}

module.exports = ServiceLc116Controller;

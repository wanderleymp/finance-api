const ServiceLc116Repository = require('../repositories/serviceLc116Repository');
const PaginationHelper = require('../utils/paginationHelper');
const serviceLc116Repository = new ServiceLc116Repository();
const { logger } = require('../middlewares/logger');

class ServiceLc116Service {
    async listServiceLc116(page, limit, filters) {
        try {
            logger.info('Iniciando listagem de serviços LC116', {
                page,
                limit,
                filters
            });

            const { page: normalizedPage, limit: normalizedLimit } = PaginationHelper.validateParams(page, limit);
            const result = await serviceLc116Repository.findAll(filters, normalizedPage, normalizedLimit);

            logger.info('Listagem de serviços LC116 concluída', { 
                count: result.data.length,
                total: result.total
            });

            return PaginationHelper.formatResponse(
                result.data, 
                result.total, 
                normalizedPage, 
                normalizedLimit
            );
        } catch (error) {
            logger.error('Erro na listagem de serviços LC116', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async getServiceLc116ById(serviceLc116Id) {
        try {
            logger.info('Buscando serviço LC116 por ID', { serviceLc116Id });
            
            const serviceLc116 = await serviceLc116Repository.findById(serviceLc116Id);
            
            if (!serviceLc116) {
                const error = new Error('Serviço LC116 não encontrado');
                error.status = 404;
                throw error;
            }

            return serviceLc116;
        } catch (error) {
            logger.error('Erro ao buscar serviço LC116', {
                errorMessage: error.message,
                errorStack: error.stack,
                serviceLc116Id: serviceLc116Id
            });
            throw error;
        }
    }

    async createServiceLc116(data) {
        try {
            logger.info('Criando novo serviço LC116', { data });
            
            const newServiceLc116 = await serviceLc116Repository.create(data);
            
            logger.info('Serviço LC116 criado com sucesso', { 
                id: newServiceLc116.service_lc116_id 
            });
            
            return newServiceLc116;
        } catch (error) {
            logger.error('Erro ao criar serviço LC116', {
                errorMessage: error.message,
                errorStack: error.stack,
                data
            });
            throw error;
        }
    }

    async updateServiceLc116(id, data) {
        try {
            logger.info('Atualizando serviço LC116', { id, data });
            
            const updatedServiceLc116 = await serviceLc116Repository.update(id, data);
            
            logger.info('Serviço LC116 atualizado com sucesso', { 
                id: updatedServiceLc116.service_lc116_id 
            });
            
            return updatedServiceLc116;
        } catch (error) {
            logger.error('Erro ao atualizar serviço LC116', {
                errorMessage: error.message,
                errorStack: error.stack,
                id,
                data
            });
            throw error;
        }
    }

    async deleteServiceLc116(id) {
        try {
            logger.info('Deletando serviço LC116', { id });
            
            const deletedServiceLc116 = await serviceLc116Repository.delete(id);
            
            logger.info('Serviço LC116 deletado com sucesso', { id });
            
            return deletedServiceLc116;
        } catch (error) {
            logger.error('Erro ao deletar serviço LC116', {
                errorMessage: error.message,
                errorStack: error.stack,
                id
            });
            throw error;
        }
    }
}

module.exports = ServiceLc116Service;

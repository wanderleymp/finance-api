const { logger } = require('../../middlewares/logger');
const ServiceRepository = require('./service.repository');
const ServiceDTO = require('./dto/service.dto');
const { ValidationError } = require('../../utils/errors');

class ServiceService {
    constructor() {
        this.serviceRepository = new ServiceRepository();
    }

    /**
     * Cria um novo serviço
     * @param {Object} data - Dados do serviço
     * @returns {Promise<ServiceDTO>} Serviço criado
     */
    async create(data) {
        try {
            const serviceDTO = new ServiceDTO(data);
            serviceDTO.validate();

            const createdService = await this.serviceRepository.create(
                serviceDTO.toDatabase()
            );

            return ServiceDTO.fromDatabase(createdService);
        } catch (error) {
            logger.error('Erro ao criar serviço', { error, data });
            
            if (error.message.includes('violates unique constraint')) {
                throw new ValidationError('Já existe um serviço com esses dados');
            }

            throw error;
        }
    }

    /**
     * Atualiza um serviço
     * @param {number} id - ID do serviço
     * @param {Object} data - Dados para atualização
     * @returns {Promise<ServiceDTO>} Serviço atualizado
     */
    async update(id, data) {
        try {
            const serviceDTO = new ServiceDTO({ ...data, service_id: id });
            serviceDTO.validate();

            const updatedService = await this.serviceRepository.update(
                id, 
                serviceDTO.toDatabase()
            );

            return ServiceDTO.fromDatabase(updatedService);
        } catch (error) {
            logger.error('Erro ao atualizar serviço', { error, id, data });
            throw error;
        }
    }

    /**
     * Remove um serviço
     * @param {number} id - ID do serviço
     * @returns {Promise<boolean>} True se removido com sucesso
     */
    async delete(id) {
        try {
            return await this.serviceRepository.delete(id);
        } catch (error) {
            logger.error('Erro ao remover serviço', { error, id });
            throw error;
        }
    }

    /**
     * Busca serviços com filtros
     * @param {Object} filters - Filtros para busca
     * @param {number} page - Página atual
     * @param {number} limit - Limite de serviços por página
     * @returns {Promise<Object>} Resultado da busca
     */
    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const result = await this.serviceRepository.findAll(filters, page, limit);
            
            return {
                ...result,
                data: result.data.map(ServiceDTO.fromDatabase)
            };
        } catch (error) {
            logger.error('Erro ao buscar serviços', { error, filters });
            throw error;
        }
    }

    /**
     * Busca detalhes de serviço
     * @param {number} itemId - ID do item de serviço
     * @returns {Promise<Object>} Detalhes do serviço
     */
    async findServiceDetails(itemId) {
        try {
            return await this.serviceRepository.findServiceDetails(itemId);
        } catch (error) {
            logger.error('Erro ao buscar detalhes do serviço', { error, itemId });
            throw error;
        }
    }

    /**
     * Busca detalhes de múltiplos serviços
     * @param {number[]} itemIds - Array de IDs de itens de serviço
     * @returns {Promise<Object[]>} Lista de detalhes de serviços
     */
    async findMultipleServiceDetails(itemIds) {
        try {
            return await this.serviceRepository.findMultipleServiceDetails(itemIds);
        } catch (error) {
            logger.error('Erro ao buscar detalhes de múltiplos serviços', { error, itemIds });
            throw error;
        }
    }
}

module.exports = ServiceService;

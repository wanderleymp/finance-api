const ServiceService = require('./service.service');
const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');

class ServiceController {
    constructor() {
        this.serviceService = new ServiceService();
    }

    /**
     * Cria um novo serviço
     * @param {Object} req - Requisição HTTP
     * @param {Object} res - Resposta HTTP
     */
    async create(req, res) {
        try {
            const serviceData = req.body;
            const createdService = await this.serviceService.create(serviceData);
            
            res.status(201).json(createdService);
        } catch (error) {
            logger.error('Erro ao criar serviço', { error, body: req.body });
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    /**
     * Atualiza um serviço
     * @param {Object} req - Requisição HTTP
     * @param {Object} res - Resposta HTTP
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const serviceData = req.body;
            
            const updatedService = await this.serviceService.update(Number(id), serviceData);
            
            res.json(updatedService);
        } catch (error) {
            logger.error('Erro ao atualizar serviço', { error, params: req.params, body: req.body });
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    /**
     * Remove um serviço
     * @param {Object} req - Requisição HTTP
     * @param {Object} res - Resposta HTTP
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            
            await this.serviceService.delete(Number(id));
            
            res.status(204).send();
        } catch (error) {
            logger.error('Erro ao remover serviço', { error, params: req.params });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    /**
     * Busca serviços com filtros
     * @param {Object} req - Requisição HTTP
     * @param {Object} res - Resposta HTTP
     */
    async findAll(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10,
                item_id,
                service_group_id,
                active
            } = req.query;

            logger.debug('ServiceController.findAll - Entrada', {
                page,
                limit,
                item_id,
                service_group_id,
                active
            });

            const filters = {};
            if (item_id) filters.item_id = Number(item_id);
            if (service_group_id) filters.service_group_id = Number(service_group_id);
            if (active !== undefined) filters.active = active === 'true';

            const result = await this.serviceService.findAll(
                filters, 
                Number(page), 
                Number(limit)
            );
            
            logger.debug('ServiceController.findAll - Resultado', {
                resultKeys: Object.keys(result),
                itemsCount: result.items ? result.items.length : 'Sem items',
                meta: result.meta
            });

            // Garantir resposta RESTful
            res.json({
                items: result.items,
                meta: result.meta,
                links: result.links
            });
        } catch (error) {
            logger.error('Erro ao buscar serviços', { 
                error: error.message, 
                stack: error.stack,
                query: req.query 
            });
            res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
        }
    }

    /**
     * Busca detalhes de serviço
     * @param {Object} req - Requisição HTTP
     * @param {Object} res - Resposta HTTP
     */
    async findServiceDetails(req, res) {
        try {
            const { itemId } = req.params;
            
            const serviceDetails = await this.serviceService.findServiceDetails(Number(itemId));
            
            if (!serviceDetails) {
                return res.status(404).json({ error: 'Serviço não encontrado' });
            }
            
            res.json(serviceDetails);
        } catch (error) {
            logger.error('Erro ao buscar detalhes do serviço', { error, params: req.params });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    /**
     * Busca detalhes de múltiplos serviços
     * @param {Object} req - Requisição HTTP
     * @param {Object} res - Resposta HTTP
     */
    async findMultipleServiceDetails(req, res) {
        try {
            const { itemIds } = req.body;
            
            if (!Array.isArray(itemIds)) {
                return res.status(400).json({ error: 'itemIds deve ser um array' });
            }
            
            const serviceDetails = await this.serviceService.findMultipleServiceDetails(
                itemIds.map(Number)
            );
            
            res.json(serviceDetails);
        } catch (error) {
            logger.error('Erro ao buscar detalhes de múltiplos serviços', { error, body: req.body });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}

module.exports = new ServiceController();

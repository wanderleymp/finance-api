const { logger } = require('../../middlewares/logger');
const ItemService = require('./item.service');
const { ValidationError } = require('../../utils/errors');
const { handleResponse, handleError } = require('../../utils/responseHandler');

class ItemController {
    constructor(service) {
        this.service = service;
    }

    async findAll(req, res) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;
            
            // Converte preço para objeto de comparação se necessário
            if (filters.min_price || filters.max_price) {
                filters.price = {};
                if (filters.min_price) filters.price.$gte = parseFloat(filters.min_price);
                if (filters.max_price) filters.price.$lte = parseFloat(filters.max_price);
                delete filters.min_price;
                delete filters.max_price;
            }

            // Converte active para booleano se presente
            if (filters.active !== undefined) {
                filters.active = filters.active === 'true';
            }

            const result = await this.service.findAll(
                filters,
                parseInt(page),
                parseInt(limit)
            );
            
            return handleResponse(res, result);
        } catch (error) {
            logger.error('Erro ao listar items', { error });
            return handleError(res, error);
        }
    }

    async findById(req, res) {
        try {
            const { id } = req.params;
            const result = await this.service.findById(parseInt(id));
            
            return handleResponse(res, result);
        } catch (error) {
            logger.error('Erro ao buscar item por ID', { error });
            return handleError(res, error);
        }
    }

    async create(req, res) {
        try {
            const result = await this.service.create(req.body);
            return handleResponse(res, result, 201);
        } catch (error) {
            logger.error('Erro ao criar item', { error });
            return handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const result = await this.service.update(parseInt(id), req.body);
            
            return handleResponse(res, result);
        } catch (error) {
            logger.error('Erro ao atualizar item', { error });
            return handleError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const result = await this.service.delete(parseInt(id));
            
            return handleResponse(res, result);
        } catch (error) {
            logger.error('Erro ao remover item', { error });
            return handleError(res, error);
        }
    }
}

module.exports = ItemController;

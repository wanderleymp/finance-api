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
            const filters = {};
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            // Filtros
            if (req.query.code) filters.code = req.query.code;
            if (req.query.name) filters.name = req.query.name;
            if (req.query.search) filters.search = req.query.search;
            
            // Preço
            if (req.query.min_price || req.query.max_price) {
                filters.price = {};
                if (req.query.min_price) filters.price.$gte = parseFloat(req.query.min_price);
                if (req.query.max_price) filters.price.$lte = parseFloat(req.query.max_price);
            }

            // Status
            if (req.query.active !== undefined) {
                filters.active = req.query.active === 'true';
            }

            // Ordenação
            filters.orderBy = req.query.orderBy || 'name';
            filters.orderDirection = (req.query.orderDirection || 'ASC').toUpperCase();

            const result = await this.service.findAll(filters, page, limit);
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
            await this.service.delete(parseInt(id));
            return handleResponse(res, null, 204);
        } catch (error) {
            logger.error('Erro ao deletar item', { error });
            return handleError(res, error);
        }
    }
}

module.exports = ItemController;

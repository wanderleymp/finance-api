const MovementItemService = require('./movement-item.service');
const { handleResponse, handleError } = require('../../utils/responseHandler');
const { logger } = require('../../middlewares/logger');

class MovementItemController {
    constructor() {
        this.service = new MovementItemService();
    }

    async create(req, res) {
        try {
            const data = req.body;
            const result = await this.service.create(data);
            handleResponse(res, result, 201);
        } catch (error) {
            handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const result = await this.service.update(id, data);
            handleResponse(res, result, 200);
        } catch (error) {
            handleError(res, error);
        }
    }

    async findById(req, res) {
        try {
            const { id } = req.params;
            const result = await this.service.findById(id);
            handleResponse(res, result, 200);
        } catch (error) {
            handleError(res, error);
        }
    }

    async findAll(req, res) {
        try {
            const { page = 1, limit = 10, search = '', orderField, orderDirection } = req.query;
            const filters = { page, limit, search, orderField, orderDirection };
            
            const result = await this.service.findAll(filters);
            handleResponse(res, result, 200);
        } catch (error) {
            handleError(res, error);
        }
    }

    async findByMovementId(req, res) {
        try {
            const { movementId } = req.params;
            const result = await this.service.findByMovementId(movementId);
            handleResponse(res, result, 200);
        } catch (error) {
            handleError(res, error);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.service.delete(id);
            handleResponse(res, null, 204);
        } catch (error) {
            handleError(res, error);
        }
    }
}

module.exports = MovementItemController;

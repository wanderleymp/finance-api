const userService = require('./user.service');
const { logger } = require('../../middlewares/logger');
const { handleResponse, handleError } = require('../../utils/responseHandler');

class UserController {
    constructor(service) {
        this.service = service;
    }

    async findAll(req, res) {
        try {
            const { page = 1, limit = 10, ...filters } = req.query;

            // Converte active para booleano se presente
            if (filters.active !== undefined) {
                filters.active = filters.active === 'true';
            }

            const result = await this.service.list(
                filters,
                parseInt(page),
                parseInt(limit)
            );

            handleResponse(res, 200, result);
        } catch (error) {
            handleError(res, error);
        }
    }

    async findById(req, res) {
        try {
            const user = await this.service.findById(req.params.id);
            handleResponse(res, 200, user);
        } catch (error) {
            handleError(res, error);
        }
    }

    async create(req, res) {
        try {
            const user = await this.service.create(req.body);
            handleResponse(res, 201, user);
        } catch (error) {
            handleError(res, error);
        }
    }

    async update(req, res) {
        try {
            const user = await this.service.update(req.params.id, req.body);
            handleResponse(res, 200, user);
        } catch (error) {
            handleError(res, error);
        }
    }

    async delete(req, res) {
        try {
            await this.service.delete(req.params.id);
            handleResponse(res, 204);
        } catch (error) {
            handleError(res, error);
        }
    }

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            const result = await this.service.refreshToken(refreshToken);
            handleResponse(res, 200, result);
        } catch (error) {
            handleError(res, error);
        }
    }
}

module.exports = UserController;

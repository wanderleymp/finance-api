const TaskTypesService = require('./tasktypes.service');
const tasktypesSchema = require('./schemas/tasktypes.schema');
const { logger } = require('../../middlewares/logger');
const { validateSchema } = require('../../utils/validateSchema');

class TaskTypesController {
    constructor() {
        this.service = new TaskTypesService();
    }

    async create(req, res) {
        try {
            const validatedData = await validateSchema(tasktypesSchema.create, req.body);
            const result = await this.service.create(validatedData);
            return res.status(201).json(result);
        } catch (error) {
            logger.error('Erro ao criar tipo de task', {
                error: error.message,
                body: req.body
            });
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async findAll(req, res) {
        try {
            const { page, limit, ...filters } = req.query;
            const result = await this.service.findAll(
                filters,
                parseInt(page) || 1,
                parseInt(limit) || 10
            );
            return res.json(result);
        } catch (error) {
            logger.error('Erro ao listar tipos de task', {
                error: error.message,
                query: req.query
            });
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async findById(req, res) {
        try {
            const result = await this.service.findById(req.params.id);
            if (!result) {
                return res.status(404).json({ error: 'Tipo de task não encontrado' });
            }
            return res.json(result);
        } catch (error) {
            logger.error('Erro ao buscar tipo de task', {
                error: error.message,
                id: req.params.id
            });
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async update(req, res) {
        try {
            const validatedData = await validateSchema(tasktypesSchema.update, req.body);
            const result = await this.service.update(req.params.id, validatedData);
            if (!result) {
                return res.status(404).json({ error: 'Tipo de task não encontrado' });
            }
            return res.json(result);
        } catch (error) {
            logger.error('Erro ao atualizar tipo de task', {
                error: error.message,
                id: req.params.id,
                body: req.body
            });
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async delete(req, res) {
        try {
            const result = await this.service.delete(req.params.id);
            if (!result) {
                return res.status(404).json({ error: 'Tipo de task não encontrado' });
            }
            return res.status(204).send();
        } catch (error) {
            logger.error('Erro ao deletar tipo de task', {
                error: error.message,
                id: req.params.id
            });
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getActiveTypes(req, res) {
        try {
            const result = await this.service.getActiveTypes();
            return res.json(result);
        } catch (error) {
            logger.error('Erro ao buscar tipos de tasks ativos', {
                error: error.message
            });
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            const result = await this.service.refreshToken(refreshToken);
            res.json(result);
        } catch (error) {
            logger.error("Erro ao atualizar token de acesso", { error });
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = TaskTypesController;

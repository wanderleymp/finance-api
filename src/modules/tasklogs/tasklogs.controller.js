const TaskLogsService = require('./tasklogs.service');
const taskLogsSchema = require('./schemas/tasklogs.schema');
const { logger } = require('../../middlewares/logger');
const { validateSchema } = require('../../utils/validateSchema');

class TaskLogsController {
    constructor(taskLogsService) {
        this.service = taskLogsService;
    }

    async create(req, res) {
        try {
            const validatedData = await validateSchema(taskLogsSchema.create, req.body);
            const result = await this.service.create(validatedData);
            return res.status(201).json(result);
        } catch (error) {
            logger.error('Erro ao criar log de task', {
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
            logger.error('Erro ao listar logs de task', {
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
                return res.status(404).json({ error: 'Log de task não encontrado' });
            }
            return res.json(result);
        } catch (error) {
            logger.error('Erro ao buscar log de task', {
                error: error.message,
                id: req.params.id
            });
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async findByTaskId(req, res) {
        try {
            const { page, limit } = req.query;
            const result = await this.service.findByTaskId(
                req.params.taskId,
                parseInt(page) || 1,
                parseInt(limit) || 10
            );
            return res.json(result);
        } catch (error) {
            logger.error('Erro ao buscar logs por task', {
                error: error.message,
                taskId: req.params.taskId,
                query: req.query
            });
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async update(req, res) {
        try {
            const { error, value } = validate(req.body, tasklogsSchema.update);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            const result = await this.service.update(req.params.id, value);
            return res.json(result);
        } catch (error) {
            logger.error('Erro ao atualizar log', {
                error: error.message,
                id: req.params.id,
                body: req.body
            });
            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async delete(req, res) {
        try {
            await this.service.delete(req.params.id);
            return res.status(204).send();
        } catch (error) {
            logger.error('Erro ao deletar log', {
                error: error.message,
                id: req.params.id
            });
            if (error.message.includes('não encontrado')) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getTaskMetrics(req, res) {
        try {
            const result = await this.service.getTaskMetrics(req.params.taskId);
            return res.json(result);
        } catch (error) {
            logger.error('Erro ao buscar métricas da task', {
                error: error.message,
                taskId: req.params.taskId
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

module.exports = TaskLogsController;

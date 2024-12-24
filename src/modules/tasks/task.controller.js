const { logger } = require('../../middlewares/logger');

class TaskController {
    constructor(taskService) {
        this.taskService = taskService;
    }

    async findAll(req, res) {
        try {
            const { page = 1, limit = 10, type, status } = req.query;
            const tasks = await this.taskService.findAll({
                type,
                status
            }, page, limit);
            res.json(tasks);
        } catch (error) {
            logger.error('Erro ao listar tasks', {
                error: error.message,
                query: req.query
            });
            res.status(500).json({ error: error.message });
        }
    }

    async findById(req, res) {
        try {
            const task = await this.taskService.findById(req.params.id);
            if (!task) {
                return res.status(404).json({ message: 'Task não encontrada' });
            }
            res.json(task);
        } catch (error) {
            logger.error('Erro ao buscar task', {
                error: error.message,
                taskId: req.params.id
            });
            res.status(500).json({ error: error.message });
        }
    }

    async create(req, res) {
        try {
            const task = await this.taskService.create(
                req.body.type,
                req.body.payload,
                req.body.options
            );
            res.status(201).json(task);
        } catch (error) {
            logger.error('Erro ao criar task', {
                error: error.message,
                body: req.body
            });
            res.status(500).json({ error: error.message });
        }
    }

    async getMetrics(req, res) {
        try {
            const metrics = await this.taskService.getMetrics();
            res.json(metrics);
        } catch (error) {
            logger.error('Erro ao buscar métricas', {
                error: error.message
            });
            res.status(500).json({ error: error.message });
        }
    }

    async processTask(req, res) {
        try {
            await this.taskService.processTask(req.params.id);
            res.json({ message: 'Task processada com sucesso' });
        } catch (error) {
            logger.error('Erro ao processar task', {
                error: error.message,
                taskId: req.params.id
            });
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = TaskController;

const TaskDependenciesService = require('./taskdependencies.service');
const taskDependenciesSchema = require('./schemas/taskdependencies.schema');
const { logger } = require('../../middlewares/logger');
const { validateSchema } = require('../../utils/validateSchema');

class TaskDependenciesController {
    constructor(taskDependenciesService) {
        this.service = taskDependenciesService;
    }

    async create(req, res) {
        try {
            const validatedData = await validateSchema(taskDependenciesSchema.create, req.body);
            const result = await this.service.create(validatedData);
            return res.status(201).json(result);
        } catch (error) {
            logger.error('Erro ao criar dependência de task', {
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
            logger.error('Erro ao listar dependências de task', {
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
                return res.status(404).json({ error: 'Dependência de task não encontrada' });
            }
            return res.json(result);
        } catch (error) {
            logger.error('Erro ao buscar dependência de task', {
                error: error.message,
                id: req.params.id
            });
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async update(req, res) {
        try {
            const validatedData = await validateSchema(taskDependenciesSchema.update, req.body);
            const result = await this.service.update(req.params.id, validatedData);
            if (!result) {
                return res.status(404).json({ error: 'Dependência de task não encontrada' });
            }
            return res.json(result);
        } catch (error) {
            logger.error('Erro ao atualizar dependência de task', {
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
                return res.status(404).json({ error: 'Dependência de task não encontrada' });
            }
            return res.status(204).send();
        } catch (error) {
            logger.error('Erro ao deletar dependência de task', {
                error: error.message,
                id: req.params.id
            });
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async findByTaskId(req, res) {
        try {
            const result = await this.service.findByTaskId(req.params.taskId);
            return res.json(result);
        } catch (error) {
            logger.error('Erro ao buscar dependências da task', {
                error: error.message,
                taskId: req.params.taskId
            });
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async findDependentTasks(req, res) {
        try {
            const result = await this.service.findDependentTasks(req.params.taskId);
            return res.json(result);
        } catch (error) {
            logger.error('Erro ao buscar tasks dependentes', {
                error: error.message,
                taskId: req.params.taskId
            });
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}

module.exports = TaskDependenciesController;

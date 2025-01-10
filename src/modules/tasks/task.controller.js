const { logger } = require('../../middlewares/logger');

class TaskController {
    constructor(taskService) {
        this.service = taskService;
    }

    async create(req, res) {
        try {
            const result = await this.service.create(req.body);
            return res.status(201).json(result);
        } catch (error) {
            logger.error('Erro ao criar task', {
                error: error.message,
                body: req.body
            });

            if (error.message.includes('circular')) {
                return res.status(400).json({ error: error.message });
            }

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
            logger.error('Erro ao listar tasks', {
                error: error.message,
                query: req.query
            });
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async findById(req, res) {
        try {
            const result = await this.service.findById(req.params.id);
            return res.json(result);
        } catch (error) {
            logger.error('Erro ao buscar task', {
                error: error.message,
                id: req.params.id
            });
            if (error.message.includes('não encontrada')) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async update(req, res) {
        try {
            const result = await this.service.update(req.params.id, req.body);
            return res.json(result);
        } catch (error) {
            logger.error('Erro ao atualizar task', {
                error: error.message,
                id: req.params.id,
                body: req.body
            });
            if (error.message.includes('não encontrada')) {
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
            logger.error('Erro ao deletar task', {
                error: error.message,
                id: req.params.id
            });
            if (error.message.includes('não encontrada')) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('dependem')) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async findPendingTasks(req, res) {
        try {
            const { limit = 10 } = req.query;
            const result = await this.service.findPendingTasks(parseInt(limit));
            return res.json(result);
        } catch (error) {
            logger.error('Erro ao buscar tasks pendentes', {
                error: error.message,
                query: req.query
            });
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async processTask(req, res) {
        try {
            await this.service.processTask(req.params.id);
            return res.status(200).json({ message: 'Task processada com sucesso' });
        } catch (error) {
            logger.error('Erro ao processar task', {
                error: error.message,
                id: req.params.id
            });
            if (error.message.includes('não encontrada')) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    /**
     * Reagenda uma task para execução
     */
    async rescheduleTask(req, res) {
        try {
            const { taskId } = req.params;

            logger.info('Reagendando task para execução', { taskId });

            const task = await this.service.findById(taskId);
            if (!task) {
                return res.status(404).json({ message: 'Task não encontrada' });
            }

            // Reseta contadores e status
            await this.service.update(taskId, {
                status: 'pending',
                retries: 0,
                retry_count: 0,
                next_retry_at: new Date(),
                error_message: null,
                last_error: null
            });

            res.status(200).json({ message: 'Task reagendada com sucesso' });
        } catch (error) {
            logger.error('Erro ao reagendar task', {
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ message: 'Erro ao reagendar task' });
        }
    }
}

module.exports = TaskController;

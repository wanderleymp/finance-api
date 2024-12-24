const { logger } = require('../../../middlewares/logger');

class TaskService {
    constructor({ taskRepository }) {
        this.repository = taskRepository;
    }

    async getPendingTasks(limit = 10) {
        try {
            return await this.repository.findPendingTasks(limit);
        } catch (error) {
            logger.error('Erro ao buscar tasks pendentes', {
                error: error.message,
                limit
            });
            throw error;
        }
    }

    async createTask(type, payload, options = {}) {
        try {
            const task = await this.repository.create({
                type,
                payload,
                priority: options.priority || 0,
                scheduledFor: options.scheduledFor,
                maxRetries: options.maxRetries || 3
            });

            logger.info('Task criada com sucesso', { 
                taskId: task.id,
                type
            });

            return task;
        } catch (error) {
            logger.error('Erro ao criar task', {
                error: error.message,
                type,
                payload
            });
            throw error;
        }
    }

    async updateTaskStatus(taskId, status, error = null) {
        try {
            const task = await this.repository.updateTaskStatus(taskId, status, error);
            
            logger.info('Status da task atualizado', {
                taskId,
                status,
                hasError: !!error
            });

            return task;
        } catch (error) {
            logger.error('Erro ao atualizar status da task', {
                error: error.message,
                taskId,
                status
            });
            throw error;
        }
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            return await this.repository.findAll(filters, page, limit);
        } catch (error) {
            logger.error('Erro ao buscar tasks', {
                error: error.message,
                filters,
                page,
                limit
            });
            throw error;
        }
    }

    async findById(id) {
        try {
            return await this.repository.findById(id);
        } catch (error) {
            logger.error('Erro ao buscar task por ID', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async getMetrics() {
        try {
            const [
                pendingTasks,
                failedTasks,
                totalTasks
            ] = await Promise.all([
                this.repository.countByStatus('pending'),
                this.repository.countByStatus('failed'),
                this.repository.count()
            ]);

            return {
                pendingTasks,
                failedTasks,
                totalTasks,
                failureRate: totalTasks > 0 ? failedTasks / totalTasks : 0
            };
        } catch (error) {
            logger.error('Erro ao coletar métricas', {
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = TaskService;

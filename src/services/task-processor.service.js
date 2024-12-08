const { PrismaClient } = require('@prisma/client');
const logger = require('../../config/logger');
const PrismaTaskRepository = require('../repositories/implementations/PrismaTaskRepository');

class TaskProcessorService {
    constructor() {
        this.prisma = new PrismaClient();
        this.repository = new PrismaTaskRepository();
    }

    async enqueueTask(taskData) {
        try {
            // Buscar o modo de execução
            const executionMode = await this.prisma.tasks_execution_mode.findFirst({
                where: { name: taskData.execution_mode || 'automatic' }
            });

            const executionModeId = executionMode?.execution_mode_id || 1;
            const statusId = await this.getStatusId('pending');

            const task = await this.repository.create({
                name: taskData.name,
                description: taskData.description,
                processId: taskData.processId || 1,
                statusId,
                executionModeId
            });

            logger.info('Task enqueued successfully', { taskId: task.task_id });
            return task;
        } catch (error) {
            logger.error('Error enqueueing task:', error);
            throw error;
        }
    }

    async getStatusId(statusName) {
        const status = await this.repository.findTaskStatus(statusName);
        return status?.status_id || 1; // Retorna 1 (pending) como fallback
    }

    async listTasks(filters = {}, pagination = {}) {
        try {
            const { status } = filters;
            const { page = 1, limit = 10 } = pagination;

            const where = status ? { status_id: Number(status) } : {};
            const skip = (Number(page) - 1) * Number(limit);
            const take = Number(limit);

            return await this.repository.findAll(where, skip, take);
        } catch (error) {
            logger.error('Error listing tasks:', error);
            throw error;
        }
    }

    async getTaskById(id) {
        try {
            const task = await this.repository.findById(id);
            if (!task) {
                throw new Error('Task not found');
            }
            return task;
        } catch (error) {
            logger.error('Error getting task by id:', error);
            throw error;
        }
    }

    async updateTaskStatus(id, status, message) {
        try {
            const statusId = await this.getStatusId(status);
            return await this.repository.updateStatus(id, statusId, message);
        } catch (error) {
            logger.error('Error updating task status:', error);
            throw error;
        }
    }

    async getTaskErrors(id) {
        try {
            return await this.repository.findTaskErrors(id);
        } catch (error) {
            logger.error('Error getting task errors:', error);
            throw error;
        }
    }
}

const taskProcessorService = new TaskProcessorService();
module.exports = { taskProcessorService };

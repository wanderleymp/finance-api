const { PrismaClient } = require('@prisma/client');
const logger = require('../../config/logger');

class TaskProcessorService {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async enqueueTask(taskData) {
        try {
            // Buscar o modo de execução
            let executionMode = await this.prisma.tasks_execution_mode.findFirst({
                where: { name: taskData.execution_mode || 'automatic' }
            });

            if (!executionMode) {
                executionMode = await this.prisma.tasks_execution_mode.create({
                    data: { 
                        name: taskData.execution_mode || 'automatic',
                        description: 'Created automatically'
                    }
                });
            }

            const task = await this.prisma.tasks.create({
                data: {
                    name: taskData.name,
                    description: taskData.description,
                    process_id: taskData.processId || 1,
                    status_id: await this.getStatusId('pending'),
                    execution_mode_id: executionMode.execution_mode_id,
                    task_logs: {
                        create: {
                            status_id: await this.getStatusId('pending'),
                            message: 'Tarefa criada'
                        }
                    }
                }
            });

            logger.info('Task enqueued successfully', { taskId: task.task_id });
            return task;
        } catch (error) {
            logger.error('Error enqueueing task:', error);
            throw error;
        }
    }

    async getStatusId(statusName) {
        const status = await this.prisma.tasks_status.findFirst({
            where: { name: statusName }
        });

        if (!status) {
            const newStatus = await this.prisma.tasks_status.create({
                data: { 
                    name: statusName, 
                    is_default: false 
                }
            });
            return newStatus.status_id;
        }

        return status.status_id;
    }
}

const taskProcessorService = new TaskProcessorService();
module.exports = { taskProcessorService };

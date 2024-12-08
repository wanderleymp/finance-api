const { PrismaClient } = require('@prisma/client');
const logger = require('../../config/logger');
const { taskProcessorService } = require('../services/task-processor.service');
const nfseRabbitMQService = require('../services/nfseRabbitMQService');

class TaskController {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async listFailedTasks(req, res) {
        try {
            const failedStatusId = await taskProcessorService.getStatusId('failed');
            
            const tasks = await this.prisma.tasks.findMany({
                where: {
                    status_id: failedStatusId
                },
                include: {
                    task_logs: {
                        orderBy: {
                            created_at: 'desc'
                        },
                        take: 1
                    }
                }
            });

            return res.json(tasks);
        } catch (error) {
            logger.error('Error listing failed tasks:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async retryTask(req, res) {
        try {
            const { task_id } = req.params;

            const task = await this.prisma.tasks.findUnique({
                where: { task_id: parseInt(task_id) },
                include: {
                    task_logs: {
                        orderBy: {
                            created_at: 'desc'
                        },
                        take: 1
                    }
                }
            });

            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }

            // Se for uma tarefa de NFSe
            if (task.name.includes('NFSe')) {
                await nfseRabbitMQService.publishNfseGenerationTask(task.movement_id);
                return res.json({ message: 'Task requeued successfully' });
            }

            return res.status(400).json({ error: 'Task type not supported for retry' });
        } catch (error) {
            logger.error('Error retrying task:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new TaskController();

const RabbitMQService = require('./rabbitMQService');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { taskProcessorService } = require('./task-processor.service');
const logger = require('../../config/logger');

class NfseRabbitMQService {
    constructor() {
        this.rabbitMQ = RabbitMQService;
        this.prisma = new PrismaClient();
    }

    async publishNfseGenerationTask(movementId) {
        try {
            // Criar uma tarefa no banco
            const task = await taskProcessorService.enqueueTask({
                name: 'Gerar NFSe',
                description: `Gerar NFSe para o movimento ${movementId}`,
                type: 'GENERATE_NFSE',
                metadata: {
                    movement_id: movementId,
                    created_at: new Date().toISOString(),
                    status: 'PENDING'
                },
                execution_mode: 'automatic'
            });

            // Publicar na fila do RabbitMQ
            await this.rabbitMQ.sendToQueue(
                this.rabbitMQ.getNfseQueue(), 
                { task_id: task.task_id, movement_id: movementId }
            );

            return task;
        } catch (error) {
            logger.error('Error publishing NFSe generation task:', error);
            throw error;
        }
    }

    async processNfseGenerationQueue() {
        await this.rabbitMQ.consumeFromQueue(
            this.rabbitMQ.getNfseQueue(), 
            async (message) => {
                const { task_id, movement_id } = message;
                
                try {
                    // Atualizar status da tarefa para "processing"
                    await this.prisma.tasks.update({
                        where: { task_id },
                        data: {
                            tasks_status: {
                                connect: {
                                    status_id: await taskProcessorService.getStatusId('processing')
                                }
                            },
                            task_logs: {
                                create: {
                                    status_id: await taskProcessorService.getStatusId('processing'),
                                    message: 'Iniciando geração de NFSe'
                                }
                            },
                            updated_at: new Date()
                        }
                    });

                    const webhookUrl = `${process.env.N8N_URL}/nuvemfiscal/nfse/emitir`;
                    
                    const response = await axios.post(webhookUrl, {
                        movement_id: movement_id
                    }, {
                        headers: {
                            'apikey': process.env.N8N_API_SECRET,
                            'Content-Type': 'application/json'
                        }
                    });

                    // Atualizar status da tarefa para "completed"
                    await this.prisma.tasks.update({
                        where: { task_id },
                        data: {
                            tasks_status: {
                                connect: {
                                    status_id: await taskProcessorService.getStatusId('completed')
                                }
                            },
                            task_logs: {
                                create: {
                                    status_id: await taskProcessorService.getStatusId('completed'),
                                    message: 'NFSe gerada com sucesso'
                                }
                            },
                            updated_at: new Date()
                        }
                    });

                    logger.info('NFSe generation completed successfully', { task_id, movement_id });
                } catch (error) {
                    logger.error('Error processing NFSe generation:', { 
                        task_id, 
                        movement_id, 
                        error: error.message,
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        data: error.response?.data
                    });

                    // Atualizar status da tarefa para "failed"
                    await this.prisma.tasks.update({
                        where: { task_id },
                        data: {
                            tasks_status: {
                                connect: {
                                    status_id: await taskProcessorService.getStatusId('failed')
                                }
                            },
                            task_logs: {
                                create: {
                                    status_id: await taskProcessorService.getStatusId('failed'),
                                    message: error.message
                                }
                            },
                            updated_at: new Date()
                        }
                    });
                }
            }
        );
    }

    async getNfseStatus(taskId) {
        try {
            const task = await this.prisma.tasks.findUnique({
                where: { task_id: taskId },
                include: {
                    tasks_status: true
                }
            });

            if (!task) {
                throw new Error('Task not found');
            }

            return {
                task_id: task.task_id,
                status: task.tasks_status.name,
                created_at: task.created_at,
                started_at: task.started_at,
                completed_at: task.completed_at,
                error_message: task.error_message,
                result: task.result ? JSON.parse(task.result) : null
            };
        } catch (error) {
            logger.error('Error getting NFSe status:', error);
            throw error;
        }
    }
}

module.exports = new NfseRabbitMQService();

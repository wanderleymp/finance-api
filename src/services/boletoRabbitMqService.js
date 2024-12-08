const RabbitMQService = require('./rabbitMQService');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const logger = require('../../config/logger');

class BoletoRabbitMQService {
    constructor() {
        this.rabbitMQ = RabbitMQService;
        this.prisma = new PrismaClient();
    }

    async publishBoletoGenerationTask(movementId, scheduledFor = null) {
        try {
            // Se não foi especificado um horário, agenda para 2 horas no futuro
            if (!scheduledFor) {
                scheduledFor = new Date();
                scheduledFor.setHours(scheduledFor.getHours() + 2);
            }

            // Buscar o status 'pending'
            const pendingStatus = await this.prisma.tasks_status.findFirst({
                where: { name: 'pending' }
            });

            // Buscar o modo 'automatic'
            const automaticMode = await this.prisma.tasks_execution_mode.findFirst({
                where: { name: 'automatic' }
            });

            // Buscar o processo 'Geração de Boleto'
            const boletoProcess = await this.prisma.processes.findFirst({
                where: { name: 'Geração de Boleto' }
            });

            if (!boletoProcess) {
                throw new Error('Processo de Geração de Boleto não encontrado');
            }

            // Criar uma tarefa no banco
            const task = await this.prisma.tasks.create({
                data: {
                    name: 'Gerar Boleto',
                    description: `Gerar boleto para o movimento ${movementId}`,
                    process_id: boletoProcess.process_id,
                    status_id: pendingStatus.status_id,
                    execution_mode_id: automaticMode.execution_mode_id,
                    schedule: scheduledFor,
                    task_logs: {
                        create: {
                            status_id: pendingStatus.status_id,
                            message: `Tarefa agendada para ${scheduledFor.toISOString()}`
                        }
                    }
                }
            });

            try {
                // Tentar publicar na fila do RabbitMQ
                await this.rabbitMQ.sendToQueue(
                    this.rabbitMQ.getBoletoQueue(), 
                    { 
                        task_id: task.task_id, 
                        movement_id: movementId,
                        scheduled_for: scheduledFor.toISOString()
                    }
                );
            } catch (error) {
                logger.error('Error sending to RabbitMQ queue:', error);
                // Não propagar o erro, apenas logar
            }

            return {
                task_id: task.task_id,
                message: 'Boleto agendado com sucesso',
                scheduled_for: scheduledFor
            };
        } catch (error) {
            logger.error('Error publishing boleto generation task:', error);
            throw error;
        }
    }

    async processBoletoGenerationQueue() {
        try {
            // Buscar tarefas pendentes que já passaram do horário agendado
            const pendingTasks = await this.prisma.tasks.findMany({
                where: {
                    tasks_status: {
                        name: 'pending'
                    },
                    schedule: {
                        lte: new Date()
                    }
                },
                include: {
                    processes: true
                }
            });

            logger.info(`Found ${pendingTasks.length} pending tasks to process`);

            for (const task of pendingTasks) {
                try {
                    logger.info(`Processing task ${task.task_id}`);

                    // Buscar o status 'in_progress'
                    const inProgressStatus = await this.prisma.tasks_status.findFirst({
                        where: { name: 'in_progress' }
                    });

                    // Atualizar status da tarefa para "in_progress"
                    await this.prisma.tasks.update({
                        where: { task_id: task.task_id },
                        data: {
                            status_id: inProgressStatus.status_id,
                            task_logs: {
                                create: {
                                    status_id: inProgressStatus.status_id,
                                    message: 'Iniciando processamento do boleto'
                                }
                            }
                        }
                    });

                    const webhookUrl = `${process.env.N8N_URL}/nuvemfiscal/boleto/emitir`;
                    const movementId = task.description.match(/movimento (\d+)/)[1];
                    
                    logger.info(`Calling N8N webhook for movement ${movementId}`);
                    
                    const response = await axios.post(webhookUrl, {
                        movement_id: movementId
                    }, {
                        headers: {
                            'Authorization': `Bearer ${process.env.N8N_API_SECRET}`,
                            'Content-Type': 'application/json'
                        }
                    }).catch(error => {
                        // Log apenas o erro e não o objeto de resposta inteiro
                        logger.error('N8N webhook error:', {
                            status: error.response?.status,
                            statusText: error.response?.statusText,
                            data: error.response?.data
                        });
                        throw error;
                    });

                    logger.info(`N8N webhook response status: ${response.status}`);

                    // Buscar o status 'completed'
                    const completedStatus = await this.prisma.tasks_status.findFirst({
                        where: { name: 'completed' }
                    });

                    // Atualizar status da tarefa para "completed"
                    await this.prisma.tasks.update({
                        where: { task_id: task.task_id },
                        data: {
                            status_id: completedStatus.status_id,
                            task_logs: {
                                create: {
                                    status_id: completedStatus.status_id,
                                    message: 'Boleto gerado com sucesso'
                                }
                            }
                        }
                    });

                    logger.info('Boleto generation completed successfully', { 
                        task_id: task.task_id,
                        movement_id: movementId
                    });
                } catch (error) {
                    logger.error('Error processing boleto generation:', {
                        task_id: task.task_id,
                        error: error.message
                    });

                    // Buscar o status 'failed'
                    const failedStatus = await this.prisma.tasks_status.findFirst({
                        where: { name: 'failed' }
                    });

                    // Atualizar status da tarefa para "failed"
                    await this.prisma.tasks.update({
                        where: { task_id: task.task_id },
                        data: {
                            status_id: failedStatus.status_id,
                            task_logs: {
                                create: {
                                    status_id: failedStatus.status_id,
                                    message: error.message
                                }
                            }
                        }
                    });
                }
            }
        } catch (error) {
            logger.error('Error processing tasks:', {
                error: error.message,
                stack: error.stack
            });
        }
    }

    async getBoletoStatus(taskId) {
        try {
            const task = await this.prisma.tasks.findUnique({
                where: { task_id: taskId },
                include: {
                    tasks_status: true,
                    task_logs: {
                        include: {
                            tasks_status: true
                        },
                        orderBy: {
                            created_at: 'desc'
                        }
                    }
                }
            });

            if (!task) {
                throw new Error('Task not found');
            }

            return {
                task_id: task.task_id,
                status: task.tasks_status.name,
                created_at: task.created_at,
                scheduled_for: task.schedule,
                logs: task.task_logs.map(log => ({
                    status: log.tasks_status.name,
                    message: log.message,
                    created_at: log.created_at
                }))
            };
        } catch (error) {
            logger.error('Error getting boleto status:', error);
            throw error;
        }
    }
}

module.exports = new BoletoRabbitMQService();

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
            
            // Se a tarefa falhou, tentar retry automático
            if (status === 'failed') {
                const task = await this.prisma.tasks.findUnique({
                    where: { task_id: parseInt(id) },
                    include: { tasks_status: true }
                });

                const maxRetries = 5;
                const currentRetries = task.retry_count || 0;

                // Se ainda não excedeu o limite de tentativas
                if (currentRetries < maxRetries) {
                    // Buscar status pending
                    const pendingStatus = await this.prisma.tasks_status.findFirst({ 
                        where: { name: 'pending' } 
                    });

                    // Agendar próxima tentativa em 5 minutos
                    const nextRetry = new Date();
                    nextRetry.setMinutes(nextRetry.getMinutes() + 5);

                    // Atualizar tarefa para pending e incrementar retry_count
                    await this.prisma.tasks.update({
                        where: { task_id: parseInt(id) },
                        data: {
                            status_id: pendingStatus.status_id,
                            retry_count: currentRetries + 1,
                            schedule: nextRetry
                        }
                    });

                    // Criar log da tentativa
                    await this.prisma.task_logs.create({
                        data: {
                            task_id: parseInt(id),
                            status_id: pendingStatus.status_id,
                            message: `Falha na execução. Tentativa ${currentRetries + 1}/${maxRetries} agendada para ${nextRetry.toISOString()}`
                        }
                    });

                    logger.info('Task scheduled for retry', { 
                        taskId: id, 
                        nextRetry: nextRetry.toISOString(),
                        attempt: currentRetries + 1,
                        maxRetries
                    });

                    return;
                }
            }

            // Se não é retry ou excedeu tentativas, atualiza normalmente
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

    async executeTaskNow(taskId) {
        try {
            const task = await this.getTaskById(taskId);
            if (!task) {
                throw new Error('Task not found');
            }

            // Atualizar para executar agora
            await this.prisma.tasks.update({
                where: { task_id: parseInt(taskId) },
                data: {
                    schedule: new Date(),
                    task_logs: {
                        create: {
                            status_id: task.status_id,
                            message: 'Tarefa reprogramada para execução imediata'
                        }
                    }
                }
            });

            return { message: 'Tarefa atualizada para execução imediata' };
        } catch (error) {
            logger.error('Error executing task:', error);
            throw error;
        }
    }

    async executeAllPendingTasks() {
        try {
            // Buscar o status 'pending'
            const pendingStatus = await this.prisma.tasks_status.findFirst({
                where: { name: 'pending' }
            });

            // Atualizar todas as tarefas pendentes
            const result = await this.prisma.tasks.updateMany({
                where: { status_id: pendingStatus.status_id },
                data: { schedule: new Date() }
            });

            return { 
                message: `${result.count} tarefas atualizadas para execução imediata`,
                updated_count: result.count
            };
        } catch (error) {
            logger.error('Error executing pending tasks:', error);
            throw error;
        }
    }

    async retryFailedTasks(maxRetries = 5) {
        try {
            // Buscar status 'failed' e 'pending'
            const [failedStatus, pendingStatus] = await Promise.all([
                this.prisma.tasks_status.findFirst({ where: { name: 'failed' } }),
                this.prisma.tasks_status.findFirst({ where: { name: 'pending' } })
            ]);

            // Buscar tarefas falhas que não excederam o limite de tentativas
            const failedTasks = await this.prisma.tasks.findMany({
                where: {
                    status_id: failedStatus.status_id,
                    retry_count: { lt: maxRetries }
                }
            });

            // Atualizar cada tarefa
            for (const task of failedTasks) {
                await this.prisma.tasks.update({
                    where: { task_id: task.task_id },
                    data: {
                        status_id: pendingStatus.status_id,
                        retry_count: (task.retry_count || 0) + 1,
                        schedule: new Date(),
                        task_logs: {
                            create: {
                                status_id: pendingStatus.status_id,
                                message: `Tentativa ${(task.retry_count || 0) + 1} de ${maxRetries}`
                            }
                        }
                    }
                });
            }

            return { 
                message: `${failedTasks.length} tarefas foram reagendadas para retry`,
                retried_count: failedTasks.length
            };
        } catch (error) {
            logger.error('Error retrying failed tasks:', error);
            throw error;
        }
    }
}

const taskProcessorService = new TaskProcessorService();
module.exports = { taskProcessorService };

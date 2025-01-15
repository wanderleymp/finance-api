const { logger } = require('../../../middlewares/logger');

class TaskWorker {
    constructor({ taskService, interval = 30000, batchSize = 5, maxRetries = 3 }) {
        this.taskService = taskService;
        this.interval = interval;
        this.batchSize = batchSize;
        this.maxRetries = maxRetries;
        this.isRunning = false;
        this.processors = new Map();
        this.retryCount = 0;
        logger.info('TaskWorker construído com configurações otimizadas', {
            hasTaskService: !!taskService,
            interval,
            batchSize,
            maxRetries
        });
    }

    registerProcessor(processor) {
        // Sempre registra como tipo 1
        this.processors.set(1, processor);
        logger.info('Processador registrado:', { 
            typeId: 1,
            allProcessors: Array.from(this.processors.keys())
        });
    }

    getProcessor(taskType) {
        // Sempre retorna o processador do tipo 1
        return this.processors.get(1);
    }

    async start() {
        if (this.isRunning) {
            logger.warn('Worker já está em execução');
            return;
        }

        this.isRunning = true;
        await this.processTasks();
    }

    async stop() {
        this.isRunning = false;
        logger.info('Worker parado');
    }

    async processTasks() {
        logger.info('Iniciando worker de processamento de tasks com estratégia de backoff', {
            interval: this.interval,
            batchSize: this.batchSize,
            processors: Array.from(this.processors.keys())
        });

        while (this.isRunning) {
            try {
                const tasks = await this.taskService.findPendingTasks(this.batchSize);
                
                if (tasks.length > 0) {
                    logger.info(`Processando lote de ${tasks.length} tasks`);
                    
                    for (const task of tasks) {
                        try {
                            const processor = this.getProcessor(task.type_id);
                            
                            if (!processor) {
                                logger.error('Processador não encontrado para task', {
                                    taskId: task.task_id,
                                    taskTypeId: task.type_id,
                                    details: task
                                });
                                
                                await this.taskService.update(task.task_id, {
                                    status: 'failed',
                                    error_message: 'Processador não configurado'
                                });
                                
                                continue;
                            }

                            await processor.process(task);
                            this.retryCount = 0; // Reset retry count on success
                        } catch (error) {
                            this.retryCount++;
                            
                            logger.error(`Erro ao processar task (Tentativa ${this.retryCount})`, {
                                taskId: task.task_id,
                                error: error.message,
                                stack: error.stack
                            });

                            await this.taskService.update(task.task_id, {
                                status: this.retryCount >= this.maxRetries ? 'failed' : 'retrying',
                                error_message: error.message,
                                retry_count: this.retryCount
                            });

                            if (this.retryCount >= this.maxRetries) {
                                logger.warn(`Task ${task.task_id} excedeu máximo de tentativas`);
                            }
                        }
                    }
                }

                // Backoff exponencial
                const backoffTime = this.interval * (1 + Math.random());
                await new Promise(resolve => setTimeout(resolve, backoffTime));
            } catch (error) {
                logger.error('Erro crítico no loop de processamento', {
                    error: error.message,
                    stack: error.stack
                });
                
                // Aumenta intervalo em caso de erro persistente
                const errorBackoff = this.interval * 2;
                await new Promise(resolve => setTimeout(resolve, errorBackoff));
            }
        }
    }
}

module.exports = TaskWorker;

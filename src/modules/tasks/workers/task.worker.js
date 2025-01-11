const { logger } = require('../../../middlewares/logger');

class TaskWorker {
    constructor({ taskService, interval = 5000, batchSize = 10 }) {
        this.taskService = taskService;
        this.interval = interval;
        this.batchSize = batchSize;
        this.isRunning = false;
        this.processors = new Map();
        logger.info('TaskWorker construído', {
            hasTaskService: !!taskService,
            interval,
            batchSize
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
        logger.info('Iniciando worker de processamento de tasks');

        while (this.isRunning) {
            try {
                const tasks = await this.taskService.findPendingTasks(this.batchSize);
                
                if (tasks.length > 0) {
                    logger.info('Processando lote de tasks', { count: tasks.length });
                    
                    for (const task of tasks) {
                        try {
                            const processor = this.getProcessor(1); // Sempre usa tipo 1
                            
                            if (!processor) {
                                logger.error('Processador não encontrado', {
                                    taskId: task.id
                                });
                                
                                await this.taskService.update(task.id, {
                                    status: 'failed',
                                    error_message: 'Processador de boleto não encontrado'
                                });
                                
                                continue;
                            }

                            await processor.process(task);
                        } catch (error) {
                            logger.error('Erro ao processar task', {
                                taskId: task.id,
                                error: error.message,
                                stack: error.stack
                            });

                            await this.taskService.update(task.id, {
                                status: 'failed',
                                error_message: error.message
                            });
                        }
                    }
                }

                await new Promise(resolve => setTimeout(resolve, this.interval));
            } catch (error) {
                logger.error('Erro no loop de processamento', {
                    error: error.message,
                    stack: error.stack
                });
                await new Promise(resolve => setTimeout(resolve, this.interval));
            }
        }
    }
}

module.exports = TaskWorker;

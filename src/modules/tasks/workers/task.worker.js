const { logger } = require('../../../middlewares/logger');

class TaskWorker {
    constructor({ taskService, interval = 5000, batchSize = 10 }) {
        this.taskService = taskService;
        this.interval = interval;
        this.batchSize = batchSize;
        this.isRunning = false;
        this.processors = new Map();
    }

    registerProcessor(processor) {
        const taskType = processor.getTaskType();
        this.processors.set(taskType, processor);
        logger.info(`Processador registrado: ${taskType}`);
    }

    getProcessor(taskType) {
        return this.processors.get(taskType);
    }

    async start() {
        if (this.isRunning) {
            logger.warn('Worker já está em execução');
            return;
        }

        this.isRunning = true;
        logger.info('Iniciando worker de processamento de tasks', {
            interval: this.interval,
            batchSize: this.batchSize
        });

        while (this.isRunning) {
            await this.processBatch();
            await this.sleep(this.interval);
        }
    }

    async stop() {
        logger.info('Parando worker de processamento de tasks');
        this.isRunning = false;
    }

    async processBatch() {
        try {
            // Buscar tasks pendentes
            const tasks = await this.taskService.getPendingTasks(this.batchSize);
            
            if (tasks.length > 0) {
                logger.info('Processando lote de tasks', {
                    count: tasks.length
                });

                // Processar tasks em paralelo
                await Promise.all(
                    tasks.map(task => this.processTask(task))
                );
            }
        } catch (error) {
            logger.error('Erro ao processar lote de tasks', {
                error: error.message
            });
        }
    }

    async processTask(task) {
        const processor = this.getProcessor(task.type_name);
        
        if (!processor) {
            logger.error('Processador não encontrado', {
                taskId: task.task_id,
                type: task.type_name
            });
            await this.taskService.updateTaskStatus(
                task.task_id,
                'FAILED',
                `Processador não encontrado para tipo ${task.type_name}`
            );
            return;
        }

        try {
            await this.taskService.handleTaskExecution(task, processor);
        } catch (error) {
            // Erro já foi tratado em handleTaskExecution
            logger.debug('Task falhou, erro já tratado', {
                taskId: task.task_id,
                type: task.type_name
            });
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = TaskWorker;

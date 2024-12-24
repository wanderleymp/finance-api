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
        logger.info('Processador registrado:', { type: taskType });
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
            const tasks = await this.taskService.findPendingTasks(this.batchSize);
            
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
                error: error.message,
                stack: error.stack
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
            await this.taskService.update(task.task_id, {
                status: 'failed',
                error_message: `Processador não encontrado para tipo ${task.type_name}`
            });
            return;
        }

        try {
            // Atualiza status para running
            await this.taskService.update(task.task_id, { 
                status: 'running'
            });

            // Processa a task
            await processor.process(task);

            // Se chegou aqui é porque deu certo
            await this.taskService.update(task.task_id, { 
                status: 'completed'
            });

            logger.info('Task processada com sucesso', {
                taskId: task.task_id,
                type: task.type_name
            });
        } catch (error) {
            logger.error('Erro ao processar task', {
                taskId: task.task_id,
                type: task.type_name,
                error: error.message,
                stack: error.stack
            });

            await this.taskService.update(task.task_id, {
                status: 'failed',
                error_message: error.message
            });
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = TaskWorker;

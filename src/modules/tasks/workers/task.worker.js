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
        const taskType = processor.getTaskType()?.toLowerCase();
        logger.info('Registrando processador', { 
            type: taskType,
            hasProcessor: !!processor,
            processorMethods: Object.keys(processor),
            currentProcessors: Array.from(this.processors.keys())
        });

        if (!processor) {
            logger.error('Tentativa de registrar processador nulo');
            return;
        }

        if (!taskType) {
            logger.error('Processador retornou tipo nulo', {
                processor: Object.keys(processor)
            });
            return;
        }

        this.processors.set(taskType, processor);
        logger.info('Processador registrado:', { 
            type: taskType,
            allProcessors: Array.from(this.processors.keys())
        });
    }

    getProcessor(taskType) {
        const type = taskType?.toLowerCase();
        const processor = this.processors.get(type);
        logger.info('Buscando processador', {
            requestedType: taskType,
            normalizedType: type,
            found: !!processor,
            availableProcessors: Array.from(this.processors.keys()),
            processorMethods: processor ? Object.keys(processor) : null
        });
        return processor;
    }

    async start() {
        if (this.isRunning) {
            logger.warn('Worker já está em execução');
            return;
        }

        this.isRunning = true;
        logger.info('Iniciando worker de processamento de tasks', {
            interval: this.interval,
            batchSize: this.batchSize,
            processors: Array.from(this.processors.keys())
        });

        // Inicia o loop de processamento em uma Promise separada
        this.processLoop = (async () => {
            while (this.isRunning) {
                await this.processBatch();
                await this.sleep(this.interval);
            }
        })();
    }

    async stop() {
        logger.info('Parando worker de processamento de tasks');
        this.isRunning = false;
        if (this.processLoop) {
            await this.processLoop;
        }
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
        // Buscar o nome do tipo da task
        const taskType = await this.taskService.getTaskTypeName(task.type_id);
        logger.info('Processando task', {
            taskId: task.task_id,
            taskType,
            availableProcessors: Array.from(this.processors.keys())
        });

        const processor = this.getProcessor(taskType?.toLowerCase());
        
        if (!processor) {
            const error = new Error(`Processador não encontrado para tipo ${taskType}`);
            logger.error('Processador não encontrado', {
                taskId: task.task_id,
                type: taskType,
                availableProcessors: Array.from(this.processors.keys())
            });
            await this.taskService.markAsFailed(task.task_id, error.message);
            throw error;
        }

        try {
            // Validar payload
            await processor.validatePayload(task.payload);

            // Atualizar status para running
            await this.taskService.update(task.task_id, {
                status: 'running',
                started_at: new Date(),
                error_message: null // Limpa erro anterior se existir
            });

            // Processar task
            const result = await processor.process(task);

            // Atualizar status para completed
            await this.taskService.update(task.task_id, {
                status: 'completed',
                finished_at: new Date(),
                error_message: null
            });

            logger.info('Task processada com sucesso', {
                taskId: task.task_id,
                type: taskType,
                result
            });
        } catch (error) {
            logger.error('Erro ao processar task', {
                taskId: task.task_id,
                type: taskType,
                error: error.message,
                stack: error.stack
            });

            // Verificar se pode tentar novamente
            const canRetry = await processor.canRetry(task, error);
            const retries = (task.retries || 0) + 1;

            if (canRetry && retries < (task.max_retries || 3)) {
                const nextRetryDelay = Math.min(1000 * Math.pow(2, retries), 1800000); // Max 30 min
                const nextRetryAt = new Date(Date.now() + nextRetryDelay);

                await this.taskService.update(task.task_id, {
                    status: 'pending',
                    retries,
                    retry_count: retries,
                    next_retry_at: nextRetryAt,
                    last_error: error.message, // Mantém o último erro
                    error_message: error.message // Mantém para compatibilidade
                });

                logger.info('Task agendada para retry', {
                    taskId: task.task_id,
                    retries,
                    nextRetryAt,
                    error: error.message
                });
            } else {
                await this.taskService.update(task.task_id, {
                    status: 'failed',
                    retries,
                    retry_count: retries,
                    next_retry_at: null,
                    error_message: error.message
                });
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = TaskWorker;

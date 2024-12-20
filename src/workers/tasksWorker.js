const TasksService = require('../services/tasksService');
const ProcessorManager = require('../processors/processorManager');
const { logger } = require('../middlewares/logger');

class TasksWorker {
    constructor() {
        this.isRunning = false;
        this.interval = 5000; // 5 segundos
        this.batchSize = 10;
    }

    async processTask(task) {
        try {
            // Atualizar status para processing
            await TasksService.updateTaskStatus(task.task_id, 'processing');

            // Buscar processador adequado
            const processor = ProcessorManager.getProcessor(task.type_name);
            if (!processor) {
                throw new Error(`Processador não encontrado para tipo ${task.type_name}`);
            }

            // Processar tarefa
            await processor.process(task);

            // Marcar como concluída
            await TasksService.updateTaskStatus(task.task_id, 'completed');

            logger.info('Tarefa processada com sucesso', {
                taskId: task.task_id,
                type: task.type_name
            });
        } catch (error) {
            logger.error('Erro ao processar tarefa', {
                taskId: task.task_id,
                type: task.type_name,
                error: error.message
            });

            // Marcar como falha
            await TasksService.updateTaskStatus(
                task.task_id,
                'failed',
                error.message
            );
        }
    }

    async processBatch() {
        try {
            const tasks = await TasksService.getPendingTasks(this.batchSize);
            
            if (tasks.length > 0) {
                logger.info(`Processando lote de ${tasks.length} tarefas`);
                
                // Processar tarefas em paralelo
                await Promise.all(
                    tasks.map(task => this.processTask(task))
                );
            }
        } catch (error) {
            logger.error('Erro ao processar lote de tarefas', {
                error: error.message
            });
        }
    }

    async start() {
        if (this.isRunning) {
            logger.warn('Worker já está em execução');
            return;
        }

        this.isRunning = true;
        logger.info('Iniciando worker de processamento de tarefas');

        while (this.isRunning) {
            await this.processBatch();
            await new Promise(resolve => setTimeout(resolve, this.interval));
        }
    }

    stop() {
        this.isRunning = false;
        logger.info('Worker de processamento de tarefas parado');
    }
}

// Exporta uma instância única do worker
module.exports = new TasksWorker();

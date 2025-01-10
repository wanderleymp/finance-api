const { logger } = require('../middlewares/logger');
const TaskService = require('../modules/tasks/task.service');
const BoletoTaskProcessor = require('../modules/boletos/boleto.task.processor');

class BackgroundTaskService {
    constructor() {
        this.taskService = new TaskService();
        this.boletoTaskProcessor = new BoletoTaskProcessor();
        this.processingInterval = null;
    }

    async processTaskByType(type) {
        try {
            // Buscar tarefas pendentes do tipo especificado
            const pendingTasks = await this.taskService.findAll({
                status: 'pending',
                type_id: await this.taskService.getTypeIdByName(type)
            }, 1, 10);

            logger.info(`Processando tarefas pendentes do tipo ${type}`, { 
                totalTasks: pendingTasks.length 
            });

            for (const task of pendingTasks) {
                try {
                    // Processar tarefa específica
                    switch (type) {
                        case 'boleto':
                            await this.boletoTaskProcessor.process(JSON.parse(task.payload));
                            break;
                        // Adicionar outros tipos de tarefas aqui
                        default:
                            logger.warn(`Tipo de tarefa não suportado: ${type}`);
                    }

                    // Atualizar status da tarefa
                    await this.taskService.update(task.task_id, { 
                        status: 'completed' 
                    });

                } catch (processingError) {
                    // Marcar tarefa como falha
                    await this.taskService.update(task.task_id, { 
                        status: 'failed' 
                    });
                }
            }
        } catch (error) {
            logger.error('Erro no processamento de tarefas em background', {
                error: error.message,
                type,
                stack: error.stack
            });
        }
    }

    startBackgroundProcessing(intervalMs = 60000) {
        logger.info('Iniciando processamento de tarefas em background', { 
            intervalMs 
        });

        this.processingInterval = setInterval(async () => {
            await this.processTaskByType('boleto');
            // Adicionar outros tipos de tarefas aqui
        }, intervalMs);
    }

    stopBackgroundProcessing() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            logger.info('Processamento de tarefas em background interrompido');
        }
    }
}

module.exports = BackgroundTaskService;

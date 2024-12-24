const cron = require('node-cron');
const { logger } = require('../middlewares/logger');
const TaskService = require('../modules/tasks/services/task.service');

// Processar tarefas pendentes a cada minuto
cron.schedule('* * * * *', async () => {
    try {
        logger.info('Iniciando processamento de tarefas pendentes');
        await TaskService.processQueue();
        logger.info('Processamento de tarefas concluído');
    } catch (error) {
        logger.error('Erro ao processar tarefas', {
            errorMessage: error.message
        });
    }
});

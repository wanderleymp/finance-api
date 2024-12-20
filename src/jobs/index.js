const cron = require('node-cron');
const TasksService = require('../services/tasksService');
const { logger } = require('../middlewares/logger');

// Processar tarefas pendentes a cada minuto
cron.schedule('* * * * *', async () => {
    try {
        logger.info('Iniciando processamento de tarefas pendentes');
        await TasksService.processQueue();
        logger.info('Processamento de tarefas concluído');
    } catch (error) {
        logger.error('Erro ao processar tarefas', {
            errorMessage: error.message
        });
    }
});

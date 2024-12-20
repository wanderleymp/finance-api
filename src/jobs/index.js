const cron = require('node-cron');
const BoletoService = require('../services/boletoService');
const { logger } = require('../middlewares/logger');

// Processar tarefas de boleto a cada minuto
cron.schedule('* * * * *', async () => {
    try {
        logger.info('Iniciando processamento de tarefas de boleto');
        await BoletoService.processQueue();
        logger.info('Processamento de tarefas de boleto concluído');
    } catch (error) {
        logger.error('Erro ao processar tarefas de boleto', {
            errorMessage: error.message
        });
    }
});

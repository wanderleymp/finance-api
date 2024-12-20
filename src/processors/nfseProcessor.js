const TaskProcessor = require('./taskProcessor');
const { logger } = require('../middlewares/logger');

class NFSeProcessor extends TaskProcessor {
    getTaskType() {
        return 'NFSE';
    }

    async process(task) {
        try {
            // Aqui vai a lógica de processamento da NFSe
            // Por enquanto apenas um log para demonstração
            logger.info('Processando NFSe', {
                taskId: task.task_id,
                payload: task.payload
            });

            // Simular processamento
            await new Promise(resolve => setTimeout(resolve, 1000));

            logger.info('NFSe processada com sucesso', {
                taskId: task.task_id
            });
        } catch (error) {
            logger.error('Erro ao processar NFSe', {
                taskId: task.task_id,
                error: error.message,
                payload: task.payload
            });
            throw error;
        }
    }
}

module.exports = new NFSeProcessor();

const TaskProcessor = require('./taskProcessor');
const boletoService = require('../services/boletoService');
const tasksService = require('../services/tasksService');
const { logger } = require('../middlewares/logger');

class BoletoProcessor extends TaskProcessor {
    constructor() {
        super();
        this.boletoService = boletoService;
    }

    getTaskType() {
        return 'BOLETO';
    }

    async process(task) {
        try {
            const { boleto_id } = task.payload;
            
            // Buscar boleto
            const boleto = await this.boletoService.getBoletoById(boleto_id);
            if (!boleto) {
                throw new Error(`Boleto ${boleto_id} não encontrado`);
            }

            // Emitir boleto
            await this.boletoService.emitirBoletoN8N(boleto);

            // Atualizar status da task
            await tasksService.updateTaskStatus(task.task_id, 'completed');

            logger.info('Boleto processado com sucesso', {
                taskId: task.task_id,
                boletoId: boleto_id
            });
        } catch (error) {
            // Atualizar status da task com erro
            await tasksService.updateTaskStatus(task.task_id, 'failed', error.message);

            logger.error('Erro ao processar boleto', {
                taskId: task.task_id,
                error: error.message,
                payload: task.payload
            });
            throw error;
        }
    }
}

module.exports = new BoletoProcessor();

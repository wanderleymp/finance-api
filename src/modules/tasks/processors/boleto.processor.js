const BaseProcessor = require('./base.processor');
const { logger } = require('../../../middlewares/logger');

class BoletoProcessor extends BaseProcessor {
    constructor(taskService, boletoService) {
        super(taskService);
        this.boletoService = boletoService;
    }

    getTaskType() {
        return 'boleto';
    }

    async validatePayload(payload) {
        if (!payload.boleto_id) {
            throw new Error('boleto_id é obrigatório');
        }
    }

    async process(task) {
        const { boleto_id } = task.payload;
        
        try {
            // Buscar boleto
            const boleto = await this.boletoService.getBoletoById(boleto_id);
            if (!boleto) {
                throw new Error(`Boleto ${boleto_id} não encontrado`);
            }

            // Emitir boleto
            await this.boletoService.emitirBoletoN8N(boleto);

            // Atualizar status
            await this.updateTaskStatus(task.task_id, 'completed');

            logger.info('Boleto processado com sucesso', {
                taskId: task.task_id,
                boletoId: boleto_id
            });

            return { success: true, boleto_id };
        } catch (error) {
            // Registrar erro
            await this.handleFailure(task, error);
            
            // Propagar erro para tratamento no worker
            throw error;
        }
    }

    async handleFailure(task, error) {
        await super.handleFailure(task, error);
        
        // Lógica específica de falha para boletos
        await this.boletoService.markAsFailed(task.payload.boleto_id, error.message);
    }

    async canRetry(task) {
        // Lógica específica para retry de boletos
        const maxRetries = 3;
        return task.retries < maxRetries && 
               !error.message.includes('Boleto não encontrado');
    }
}

module.exports = BoletoProcessor;

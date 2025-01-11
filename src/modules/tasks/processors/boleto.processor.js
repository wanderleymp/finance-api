const BaseProcessor = require('./base.processor');
const { logger } = require('../../../middlewares/logger');

class BoletoProcessor extends BaseProcessor {
    constructor(taskService, boletoService) {
        super(taskService);
        this.boletoService = boletoService;
        logger.info('BoletoProcessor construído', {
            hasTaskService: !!taskService,
            hasBoletoService: !!boletoService
        });
    }

    async validatePayload(payload) {
        if (!payload.boleto_id) {
            throw new Error('boleto_id é obrigatório');
        }
    }

    async process(task) {
        const { boleto_id } = task.payload;
        
        try {
            // Atualizar status para running
            await this.taskService.update(task.id, { status: 'running' });

            // Buscar boleto
            const boleto = await this.boletoService.getBoletoById(boleto_id);
            if (!boleto) {
                throw new Error(`Boleto ${boleto_id} não encontrado`);
            }

            // Emitir boleto
            await this.boletoService.emitirBoletoN8N(boleto);

            // Atualizar status
            await this.taskService.update(task.id, { status: 'completed' });

            logger.info('Boleto processado com sucesso', {
                taskId: task.id,
                boletoId: boleto_id
            });

            return { success: true, boleto_id };
        } catch (error) {
            logger.error('Erro ao processar boleto', {
                taskId: task.id,
                boletoId: boleto_id,
                error: error.message,
                stack: error.stack
            });

            await this.taskService.update(task.id, { 
                status: 'failed',
                error_message: error.message
            });

            throw error;
        }
    }
}

module.exports = BoletoProcessor;

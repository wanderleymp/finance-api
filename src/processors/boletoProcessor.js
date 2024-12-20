const TaskProcessor = require('./taskProcessor');
const BoletoService = require('../services/boletoService');
const { logger } = require('../middlewares/logger');

class BoletoProcessor extends TaskProcessor {
    constructor() {
        super();
        this.boletoService = new BoletoService();
    }

    getTaskType() {
        return 'BOLETO';
    }

    async process(task) {
        try {
            const { boleto_id, installment_id } = task.payload;
            
            // Gerar JSON do boleto
            const dadosBoleto = await this.boletoService.gerarJsonBoleto(installment_id);
            if (!dadosBoleto) {
                throw new Error(`Não foi possível gerar dados do boleto para installment_id ${installment_id}`);
            }

            // Emitir boleto
            await this.boletoService.emitirBoletoN8N(dadosBoleto, installment_id);

            logger.info('Boleto processado com sucesso', {
                taskId: task.task_id,
                boletoId: boleto_id,
                installmentId: installment_id
            });
        } catch (error) {
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

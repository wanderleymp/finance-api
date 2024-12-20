const { logger } = require('../../middlewares/logger');
const { ProcessingError } = require('../../utils/errors');
const IBoletoService = require('./interfaces/IBoletoService');
const IIntegrationService = require('../../interfaces/IIntegrationService');

class BoletoProcessor {
    /**
     * @param {IBoletoService} boletoService Serviço de boletos
     * @param {IIntegrationService} integrationService Serviço de integração
     */
    constructor(boletoService, integrationService) {
        this.boletoService = boletoService;
        this.integrationService = integrationService;
    }

    /**
     * Processa um boleto
     */
    async process(taskData) {
        const { boleto_id } = taskData;
        
        try {
            logger.info('Iniciando processamento de boleto', { boletoId: boleto_id });

            // 1. Buscar boleto
            const boleto = await this.boletoService.getBoletoById(boleto_id);
            if (!boleto) {
                throw new ProcessingError('Boleto não encontrado');
            }

            // 2. Validar status
            if (boleto.status !== 'A Emitir') {
                logger.warn('Boleto não está no status correto para processamento', {
                    boletoId: boleto_id,
                    status: boleto.status
                });
                return;
            }

            // 3. Preparar dados para integração
            const integrationData = this.prepareIntegrationData(boleto);

            // 4. Enviar para integradora
            const response = await this.integrationService.generateBoleto(integrationData);

            // 5. Atualizar boleto com resposta
            await this.boletoService.updateBoleto(boleto_id, {
                status: 'Emitido',
                url: response.url,
                barcode: response.barcode,
                our_number: response.our_number,
                response_data: response
            });

            logger.info('Boleto processado com sucesso', {
                boletoId: boleto_id,
                status: 'Emitido'
            });

        } catch (error) {
            logger.error('Erro ao processar boleto', {
                error: error.message,
                boletoId: boleto_id,
                stack: error.stack
            });

            // Atualizar status do boleto para erro
            try {
                await this.boletoService.updateBoleto(boleto_id, {
                    status: 'Erro',
                    response_data: {
                        error: error.message,
                        timestamp: new Date()
                    }
                });
            } catch (updateError) {
                logger.error('Erro ao atualizar status do boleto após falha', {
                    error: updateError.message,
                    boletoId: boleto_id
                });
            }

            throw error;
        }
    }

    /**
     * Prepara dados para integração
     */
    prepareIntegrationData(boleto) {
        return {
            amount: boleto.amount,
            due_date: boleto.due_date,
            payer: {
                name: boleto.payer_name,
                document: boleto.payer_document,
                address: boleto.payer_address
            },
            description: boleto.description,
            installment: {
                number: boleto.installment_number,
                total: boleto.total_installments
            }
        };
    }
}

module.exports = BoletoProcessor;

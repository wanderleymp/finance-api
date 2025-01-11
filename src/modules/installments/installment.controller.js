const { logger } = require('../../middlewares/logger');
const { ValidationError } = require('../../utils/errors');
const installmentSchema = require('./schemas/installment.schema'); 
const UpdateInstallmentDTO = require('./dto/update-installment.dto'); 
const InstallmentService = require('./installment.service');

class InstallmentController {
    /**
     * @param {Object} params
     * @param {IInstallmentService} params.installmentService Serviço de parcelas
     */
    constructor({ installmentService }) {
        this.service = installmentService;
        this.installmentService = installmentService;
    }

    /**
     * Lista parcelas
     */
    async index(req, res, next) {
        try {
            const { page, limit, ...filters } = req.query;
            
            logger.info('Controller: Listando parcelas', { 
                filters 
            });

            const result = await this.service.listInstallments(
                parseInt(page) || 1, 
                parseInt(limit) || 10, 
                filters
            );

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Erro ao listar parcelas', { error: error.message });
            return res.status(500).json({
                success: false,
                message: 'Erro interno ao listar parcelas',
                errors: [
                    {
                        code: 'LIST_INSTALLMENTS_ERROR',
                        message: error.message
                    }
                ]
            });
        }
    }

    /**
     * Busca parcela por ID
     */
    async show(req, res, next) {
        try {
            const { id } = req.params;
            
            logger.info('Controller: Buscando parcela por ID', { id });
            
            const result = await this.service.getInstallmentById(parseInt(id));
            
            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Erro ao buscar parcela', { error: error.message });
            return res.status(500).json({
                success: false,
                message: 'Erro interno ao buscar parcela',
                errors: [
                    {
                        code: 'GET_INSTALLMENT_ERROR',
                        message: error.message
                    }
                ]
            });
        }
    }

    /**
     * Busca detalhes de uma parcela
     */
    async showDetails(req, res, next) {
        try {
            const { id } = req.params;
            
            logger.info('Controller: Buscando detalhes da parcela', { id });
            
            const result = await this.service.getInstallmentDetails(parseInt(id));
            
            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Erro ao buscar detalhes da parcela', { error: error.message });
            return res.status(500).json({
                success: false,
                message: 'Erro interno ao buscar detalhes da parcela',
                errors: [
                    {
                        code: 'GET_INSTALLMENT_DETAILS_ERROR',
                        message: error.message
                    }
                ]
            });
        }
    }

    /**
     * Gera boleto para parcela
     */
    async generateBoleto(req, res, next) {
        try {
            const { id } = req.params;

            logger.info('Controller: Gerando boleto para parcela', { id });

            const boleto = await this.service.generateBoleto(id);

            return res.status(201).json({
                success: true,
                data: boleto
            });
        } catch (error) {
            logger.error('Erro ao gerar boleto', { error: error.message });
            return res.status(500).json({
                success: false,
                message: 'Erro interno ao gerar boleto',
                errors: [
                    {
                        code: 'GENERATE_BOLETO_ERROR',
                        message: error.message
                    }
                ]
            });
        }
    }

    /**
     * Atualiza a data de vencimento de uma parcela
     * @route PATCH /installments/:id/due-date
     */
    async updateDueDate(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Dados recebidos para atualização', {
                params: req.params,
                body: req.body
            });

            // Cria DTO com validações
            const updateDto = new UpdateInstallmentDTO(req.body);
            
            // Valida o DTO
            updateDto.validate();

            // Extrai dados validados
            const { due_date, amount } = updateDto;

            logger.info('Atualizando parcela', { 
                installmentId: id, 
                dueDate: due_date, 
                amount 
            });

            // Chama serviço para atualizar
            const updatedInstallment = await this.service.updateInstallmentDueDate(
                Number(id), 
                due_date, 
                parseFloat(amount)
            );

            // Retorna resposta
            return res.status(200).json({
                success: true,
                data: updatedInstallment
            });
        } catch (error) {
            logger.error('Erro ao atualizar vencimento da parcela', {
                error: error.message,
                body: req.body,
                stack: error.stack
            });

            // Trata erros de validação
            if (error.message.includes('obrigatória') || error.message.includes('inválida')) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                    errors: [
                        {
                            code: 'VALIDATION_ERROR',
                            message: error.message
                        }
                    ]
                });
            }

            // Outros erros
            return res.status(500).json({
                success: false,
                message: 'Erro interno ao atualizar parcela',
                errors: [
                    {
                        code: 'UPDATE_INSTALLMENT_ERROR',
                        message: error.message
                    }
                ]
            });
        }
    }

    /**
     * Atualiza a data de vencimento ou valor de uma parcela
     * @route PATCH /installments/:id
     */
    async updateInstallment(req, res, next) {
        try {
            const { id } = req.params;
            const { due_date, amount } = req.body;

            // Chama o serviço para atualizar
            const updatedInstallment = await this.service.updateInstallment(
                Number(id), 
                { due_date, amount }
            );

            // Retorna a parcela atualizada
            return res.status(200).json({
                success: true,
                data: updatedInstallment
            });
        } catch (error) {
            logger.error('Erro ao atualizar parcela', {
                error: error.message,
                body: req.body,
                stack: error.stack
            });

            // Trata erros de validação
            if (error.message.includes('obrigatória') || error.message.includes('inválida')) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                    errors: [
                        {
                            code: 'VALIDATION_ERROR',
                            message: error.message
                        }
                    ]
                });
            }

            // Outros erros
            return res.status(500).json({
                success: false,
                message: 'Erro interno ao atualizar parcela',
                errors: [
                    {
                        code: 'UPDATE_INSTALLMENT_ERROR',
                        message: error.message
                    }
                ]
            });
        }
    }

    /**
     * Registra o pagamento de uma parcela
     * @route PUT /installments/:id/payment
     */
    async registerPayment(req, res, next) {
        try {
            // Converte o ID para número, garantindo que seja um número válido
            const id = Number(req.params.id);

            // Verifica se o ID é um número válido
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de parcela inválido',
                    errors: [
                        {
                            code: 'INVALID_ID',
                            message: 'ID de parcela inválido'
                        }
                    ]
                });
            }

            const { 
                date, 
                valor, 
                bank_id, 
                juros, 
                descontos,
                installment_id
            } = req.body;

            logger.info('Controller: Registrando pagamento de parcela', { 
                installmentId: id, 
                paymentData: { 
                    date, 
                    valor, 
                    bank_id, 
                    juros, 
                    descontos,
                    installment_id
                } 
            });

            // Chama o serviço para registrar o pagamento
            const updatedInstallment = await this.service.registerInstallmentPayment(
                id, 
                { 
                    payment_date: date, 
                    value: valor, 
                    bank_id, 
                    juros, 
                    descontos 
                }
            );

            // Retorna a parcela atualizada
            return res.status(200).json({
                success: true,
                data: updatedInstallment
            });
        } catch (error) {
            logger.error('Erro ao registrar pagamento de parcela', {
                error: error.message,
                body: req.body,
                params: req.params,
                stack: error.stack
            });

            // Trata erros de validação
            if (error instanceof ValidationError) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                    errors: [
                        {
                            code: 'VALIDATION_ERROR',
                            message: error.message
                        }
                    ]
                });
            }

            // Outros erros
            return res.status(500).json({
                success: false,
                message: 'Erro interno ao registrar pagamento da parcela',
                errors: [
                    {
                        code: 'REGISTER_PAYMENT_ERROR',
                        message: error.message
                    }
                ]
            });
        }
    }

    /**
     * Cancela boletos de uma parcela
     * @route POST /installments/:id/boleto/cancelar
     */
    async cancelBoleto(req, res) {
        try {
            const { id } = req.params;
            logger.info(`Controller: Cancelando boletos da parcela ${id}`);

            const installmentService = new InstallmentService();
            const canceledBoletos = await installmentService.cancelInstallmentBoletos(id);

            if (canceledBoletos.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Não foi possível cancelar os boletos',
                    errors: [{
                        code: 'NO_BOLETOS_CANCELED',
                        message: 'Nenhum boleto encontrado ou cancelado'
                    }]
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Boletos cancelados com sucesso',
                data: canceledBoletos
            });
        } catch (error) {
            logger.error('Erro no cancelamento de boletos', {
                errorMessage: error.message,
                errorStack: error.stack
            });

            return res.status(500).json({
                success: false,
                message: 'Erro interno ao processar o cancelamento de boletos',
                errors: [
                    {
                        code: 'CANCEL_BOLETO_ERROR',
                        message: error.message
                    }
                ]
            });
        }
    }

    async cancelInstallmentBoletos(req, res) {
        try {
            const { id } = req.params;
            logger.info(`Controller: Cancelando boletos da parcela ${id}`);

            const installmentService = new InstallmentService();
            const canceledBoletos = await installmentService.cancelInstallmentBoletos(id);

            if (canceledBoletos.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Não foi possível cancelar os boletos',
                    errors: [{
                        code: 'NO_BOLETOS_CANCELED',
                        message: 'Nenhum boleto encontrado ou cancelado'
                    }]
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Boletos cancelados com sucesso',
                data: canceledBoletos
            });
        } catch (error) {
            logger.error('Erro no cancelamento de boletos', {
                errorMessage: error.message,
                errorStack: error.stack
            });

            return res.status(500).json({
                success: false,
                message: 'Erro interno ao processar o cancelamento de boletos',
                errors: [
                    {
                        code: 'CANCEL_BOLETO_ERROR',
                        message: error.message
                    }
                ]
            });
        }
    }
}

module.exports = InstallmentController;

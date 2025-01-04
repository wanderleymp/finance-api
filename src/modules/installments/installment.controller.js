const { logger } = require('../../middlewares/logger');

class InstallmentController {
    /**
     * @param {Object} params
     * @param {IInstallmentService} params.installmentService Serviço de parcelas
     */
    constructor({ installmentService }) {
        this.service = installmentService;
    }

    /**
     * Lista parcelas
     */
    async index(req, res, next) {
        try {
            const { page, limit, ...filters } = req.query;
            
            logger.info('Controller: Listando parcelas', { 
                page, 
                limit, 
                filters 
            });

            const result = await this.service.listInstallments(
                parseInt(page) || 1, 
                parseInt(limit) || 10, 
                filters
            );

            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lista parcelas com detalhes
     */
    async listWithDetails(req, res, next) {
        try {
            const { page, limit, ...filters } = req.query;
            
            logger.info('Controller: Listando parcelas com detalhes', { 
                page, 
                limit, 
                filters 
            });

            const result = await this.service.listInstallmentsWithDetails(
                parseInt(page) || 1, 
                parseInt(limit) || 10, 
                filters
            );

            return res.json(result);
        } catch (error) {
            next(error);
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
            
            return res.json(result);
        } catch (error) {
            next(error);
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
            
            return res.json(result);
        } catch (error) {
            next(error);
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

            return res.status(201).json(boleto);
        } catch (error) {
            logger.error('Controller: Erro ao gerar boleto', {
                error: error.message,
                error_stack: error.stack,
                id: req.params.id
            });
            next(error);
        }
    }

    /**
     * Atualiza a data de vencimento de uma parcela
     * @route PATCH /installments/:id/due-date
     */
    async updateDueDate(req, res, next) {
        try {
            const { id } = req.params;
            const { due_date } = req.body;

            // Valida os dados de entrada
            const { error } = installmentSchema.updateDueDate.validate({ 
                id: Number(id), 
                due_date 
            });

            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Erro de validação',
                    details: error.details
                });
            }

            // Chama o serviço para atualizar o vencimento
            const updatedInstallment = await this.service.updateInstallmentDueDate(
                Number(id), 
                due_date
            );

            // Retorna a parcela atualizada
            res.status(200).json({
                success: true,
                data: updatedInstallment
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = InstallmentController;

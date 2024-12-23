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
}

module.exports = InstallmentController;

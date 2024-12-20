const { logger } = require('../../middlewares/logger');
const IInstallmentService = require('./interfaces/IInstallmentService');

class InstallmentController {
    /**
     * @param {IInstallmentService} service Serviço de parcelas
     */
    constructor(service) {
        this.service = service;
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
                parseInt(page), 
                parseInt(limit), 
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

            const installment = await this.service.getInstallmentById(parseInt(id));

            return res.json(installment);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = InstallmentController;

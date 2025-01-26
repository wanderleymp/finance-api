const { Router } = require('express');
const InstallmentController = require('./installment.controller');
const { validateRequest } = require('../../middlewares/requestValidator');
const { logger } = require('../../middlewares/logger');
const { authMiddleware } = require('../../middlewares/auth');
const installmentSchema = require('./schemas/installment.schema');

/**
 * Configura rotas de parcelas com suporte a injeção de dependência
 * @param {Object} dependencies Dependências para injeção no controlador
 * @returns {Router} Roteador configurado
 */
class InstallmentRoutes {
    constructor(dependencies = {}) {
        this.router = Router();
        const installmentService = dependencies.installmentService || dependencies;
        this.installmentController = new InstallmentController({ installmentService });
        this.authMiddleware = dependencies.authMiddleware || authMiddleware;
        this.setupRoutes();
    }

    setupRoutes() {
        // Middleware de autenticação para todas as rotas
        this.router.use(this.authMiddleware);

        // Middleware de log para todas as rotas
        this.router.use((req, res, next) => {
            logger.info('Requisição de parcelas recebida', {
                method: req.method,
                path: req.path,
                body: req.body,
                params: req.params,
                query: req.query
            });
            next();
        });

        // Rotas RESTful de parcelas
        this.router
            .get('/', 
                validateRequest(installmentSchema.listInstallments, 'query'),
                this.installmentController.index.bind(this.installmentController)
            )
            .get('/details', 
                validateRequest(installmentSchema.listInstallments, 'query'),
                this.installmentController.findDetails.bind(this.installmentController)
            )
            .get('/:id', 
                validateRequest(installmentSchema.getInstallmentById, 'params'),
                this.installmentController.show.bind(this.installmentController)
            )
            .get('/:id/details', 
                validateRequest(installmentSchema.getInstallmentById, 'params'),
                this.installmentController.showDetails.bind(this.installmentController)
            )
            .post('/:id/boletos', 
                validateRequest(installmentSchema.generateBoleto, 'params'),
                this.installmentController.generateBoleto.bind(this.installmentController)
            )
            .patch('/:id/due-date', 
                validateRequest(installmentSchema.updateDueDate, 'body'),
                this.installmentController.updateDueDate.bind(this.installmentController)
            )
            .patch('/:id', 
                validateRequest(installmentSchema.updateInstallment, 'body'),
                this.installmentController.updateInstallment.bind(this.installmentController)
            )
            .put('/:id/payment', 
                validateRequest(installmentSchema.registerPayment, 'body'),
                this.installmentController.registerPayment.bind(this.installmentController)
            )
            .post('/:id/boleto/cancelar', 
                validateRequest(installmentSchema.cancelBoletos, 'params'),
                this.installmentController.cancelBoleto.bind(this.installmentController)
            );

        return this.router;
    }
}

module.exports = (dependencies = {}) => {
    const routes = new InstallmentRoutes(dependencies);
    return routes.router;
};

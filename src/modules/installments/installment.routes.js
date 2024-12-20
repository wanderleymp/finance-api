const express = require('express');
const { validateRequest } = require('../../middlewares/requestValidator');
const { authMiddleware } = require('../../middlewares/auth');
const installmentSchema = require('./schemas/installment.schema');
const InstallmentController = require('./installment.controller');
const InstallmentService = require('./installment.service');
const installmentRepository = require('../../repositories/installmentRepository');

const router = express.Router();

// Injeção de dependências
const installmentService = new InstallmentService(installmentRepository);
const installmentController = new InstallmentController(installmentService);

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas
router.get('/', 
    validateRequest(installmentSchema.listInstallments, 'query'),
    installmentController.index.bind(installmentController)
);

router.get('/:id',
    validateRequest(installmentSchema.getInstallmentById, 'params'),
    installmentController.show.bind(installmentController)
);

module.exports = router;

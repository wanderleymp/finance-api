const express = require('express');
const { validateRequest } = require('../../middlewares/requestValidator');
const { authMiddleware } = require('../../middlewares/auth');
const movementPaymentSchema = require('./schemas/movement-payment.schema');
const MovementPaymentController = require('./movement-payment.controller');
const MovementPaymentService = require('./movement-payment.service');
const movementPaymentsRepository = require('../../repositories/movementPaymentsRepository');

const router = express.Router();

// Injeção de dependências
const movementPaymentService = new MovementPaymentService(movementPaymentsRepository);
const movementPaymentController = new MovementPaymentController(movementPaymentService);

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas
router.get('/', 
    validateRequest(movementPaymentSchema.listPayments, 'query'),
    movementPaymentController.index.bind(movementPaymentController)
);

router.get('/:id',
    validateRequest(movementPaymentSchema.getPaymentById, 'params'),
    movementPaymentController.show.bind(movementPaymentController)
);

module.exports = router;

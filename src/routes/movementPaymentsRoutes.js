const express = require('express');
const MovementPaymentsController = require('../controllers/movementPaymentsController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/requestValidator');
const movementPaymentSchema = require('../schemas/movementPaymentSchema');

const router = express.Router();

// Adicionar middleware de autenticação para todas as rotas
router.use(authMiddleware);

router.post('/', 
    validateRequest(movementPaymentSchema.createMovementPayment, 'body'), 
    MovementPaymentsController.create
);
router.get('/', 
    validateRequest(movementPaymentSchema.listMovementPayments, 'query'), 
    MovementPaymentsController.list
);
router.get('/:id', 
    validateRequest(movementPaymentSchema.getMovementPaymentById, 'params'), 
    MovementPaymentsController.getById
);
router.get('/:id/installments', 
    validateRequest(movementPaymentSchema.getMovementPaymentById, 'params'), 
    MovementPaymentsController.getInstallments
);
router.put('/:id', 
    validateRequest(movementPaymentSchema.getMovementPaymentById, 'params'),
    validateRequest(movementPaymentSchema.updateMovementPayment, 'body'), 
    MovementPaymentsController.update
);
router.delete('/:id', 
    validateRequest(movementPaymentSchema.getMovementPaymentById, 'params'), 
    MovementPaymentsController.delete
);

module.exports = router;

const { Router } = require('express');
const { authMiddleware } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/requestValidator');
const paymentMethodSchema = require('./schemas/payment-method.schema');

const router = Router();

module.exports = (controller) => {
    // Lista formas de pagamento
    router.get('/', 
        authMiddleware, 
        validateRequest(paymentMethodSchema.list, 'query'),
        controller.findAll.bind(controller)
    );

    // Busca forma de pagamento por ID
    router.get('/:id', 
        authMiddleware, 
        validateRequest(paymentMethodSchema.getById, 'params'),
        controller.findById.bind(controller)
    );

    // Cria uma nova forma de pagamento
    router.post('/', 
        authMiddleware, 
        validateRequest(paymentMethodSchema.create, 'body'),
        controller.create.bind(controller)
    );

    // Atualiza uma forma de pagamento
    router.put('/:id', 
        authMiddleware, 
        validateRequest(paymentMethodSchema.getById, 'params'),
        validateRequest(paymentMethodSchema.update, 'body'),
        controller.update.bind(controller)
    );

    // Remove uma forma de pagamento
    router.delete('/:id', 
        authMiddleware, 
        validateRequest(paymentMethodSchema.getById, 'params'),
        controller.delete.bind(controller)
    );

    return router;
};

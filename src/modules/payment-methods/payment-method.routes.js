const { Router } = require('express');
const { authMiddleware } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/requestValidator');
const paymentMethodSchema = require('./schemas/payment-method.schema');

const router = Router();

module.exports = (controller) => {
    // Lista formas de pagamento
    router.get('/payment-methods', 
        authMiddleware, 
        validateRequest('query', paymentMethodSchema.list),
        controller.findAll.bind(controller)
    );

    // Busca forma de pagamento por ID
    router.get('/payment-methods/:id', 
        authMiddleware, 
        validateRequest('params', paymentMethodSchema.findById),
        controller.findById.bind(controller)
    );

    // Cria uma nova forma de pagamento
    router.post('/payment-methods', 
        authMiddleware, 
        validateRequest('body', paymentMethodSchema.create),
        controller.create.bind(controller)
    );

    // Atualiza uma forma de pagamento
    router.put('/payment-methods/:id', 
        authMiddleware, 
        validateRequest('params', paymentMethodSchema.findById),
        validateRequest('body', paymentMethodSchema.update),
        controller.update.bind(controller)
    );

    // Remove uma forma de pagamento
    router.delete('/payment-methods/:id', 
        authMiddleware, 
        validateRequest('params', paymentMethodSchema.findById),
        controller.delete.bind(controller)
    );

    return router;
};

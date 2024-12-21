const PaymentMethodRepository = require('./payment-method.repository');
const PaymentMethodService = require('./payment-method.service');
const PaymentMethodController = require('./payment-method.controller');
const PaymentMethodRoutes = require('./payment-method.routes');
const cacheService = require('../../services/cache.service');

// Inicializa as dependências
const repository = new PaymentMethodRepository();
const service = new PaymentMethodService({ 
    paymentMethodRepository: repository,
    cacheService 
});
const controller = new PaymentMethodController({ paymentMethodService: service });

// Inicializa as rotas
const routes = PaymentMethodRoutes(controller);

module.exports = routes;

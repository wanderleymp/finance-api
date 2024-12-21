const MovementPaymentController = require('./movement-payment.controller');
const MovementPaymentService = require('./movement-payment.service');
const MovementPaymentRepository = require('./movement-payment.repository');
const cacheService = require('../../services/cache.service');

// Instancia as dependências
const repository = new MovementPaymentRepository();
const service = new MovementPaymentService({ 
    movementPaymentRepository: repository,
    cacheService 
});
const controller = new MovementPaymentController({ movementPaymentService: service });

// Importa as rotas e passa o controller
const routes = require('./movement-payment.routes')(controller);

module.exports = routes;

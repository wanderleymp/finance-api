const PaymentMethodController = require('./payment-method.controller');
const PaymentMethodService = require('./payment-method.service');
const PaymentMethodRepository = require('./payment-method.repository');
const PaymentMethodRoutes = require('./payment-method.routes');
const { systemDatabase } = require('../../config/database');
const { Router } = require('express');

const paymentMethodRepository = new PaymentMethodRepository(systemDatabase.pool);
const paymentMethodService = new PaymentMethodService({ paymentMethodRepository });
const paymentMethodController = new PaymentMethodController(paymentMethodService);

class PaymentMethodModule {
    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        const routes = PaymentMethodRoutes(paymentMethodController);
        this.router.use('/', routes);
    }

    getRouter() {
        return this.router;
    }

    static register(app) {
        const paymentMethodModule = new PaymentMethodModule();
        app.use('/payment-method', paymentMethodModule.getRouter());
    }
}

module.exports = {
    PaymentMethodModule,
    paymentMethodRepository,
    paymentMethodService,
    paymentMethodController
};

const PaymentMethodRepository = require('./payment-method.repository');
const PaymentMethodService = require('./payment-method.service');
const PaymentMethodController = require('./payment-method.controller');
const PaymentMethodRoutes = require('./payment-method.routes');
const CacheService = require('../../services/cache.service');

class PaymentMethodModule {
    constructor() {
        this.repository = new PaymentMethodRepository();
        this.cacheService = new CacheService('payment-methods');
        this.service = new PaymentMethodService({ 
            paymentMethodRepository: this.repository,
            cacheService: this.cacheService
        });
        this.controller = new PaymentMethodController(this.service);
        this.routes = PaymentMethodRoutes(this.controller);
    }

    getRouter() {
        return this.routes;
    }
}

module.exports = new PaymentMethodModule();

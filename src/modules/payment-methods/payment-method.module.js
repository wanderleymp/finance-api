const PaymentMethodRepository = require('./payment-method.repository');
const PaymentMethodService = require('./payment-method.service');
const PaymentMethodController = require('./payment-method.controller');
const PaymentMethodRoutes = require('./payment-method.routes');

class PaymentMethodModule {
    constructor() {
        this.repository = new PaymentMethodRepository();
        this.service = new PaymentMethodService({ 
            paymentMethodRepository: this.repository 
        });
        this.controller = new PaymentMethodController(this.service);
        this.routes = PaymentMethodRoutes(this.controller);
    }

    getRouter() {
        return this.routes;
    }
}

module.exports = new PaymentMethodModule();

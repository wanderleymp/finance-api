const CnpjRoutes = require('./cnpj.routes');
const CnpjService = require('./cnpj.service');
const CnpjController = require('./cnpj.controller');

class CnpjModule {
    constructor() {
        this.routes = CnpjRoutes;
        this.service = CnpjService;
        this.controller = CnpjController;
    }

    registerRoutes(app) {
        app.use('/api/cnpj', this.routes.getRouter());
    }
}

module.exports = new CnpjModule();

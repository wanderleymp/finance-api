const { Router } = require('express');
const CnpjController = require('./cnpj.controller');
const authMiddleware = require('../../middlewares/authMiddleware');

class CnpjRoutes {
    constructor(cnpjController = new CnpjController()) {
        this.router = Router();
        this.cnpjController = cnpjController;
        this.setupRoutes();
    }

    setupRoutes() {
        // Rota para consulta de CNPJ
        this.router.get('/:cnpj', 
            authMiddleware, 
            this.cnpjController.consultCnpj.bind(this.cnpjController)
        );

        return this.router;
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new CnpjRoutes();

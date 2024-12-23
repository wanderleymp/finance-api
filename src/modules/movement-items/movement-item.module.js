const express = require('express');
const routes = require('./movement-item.routes');

class MovementItemModule {
    constructor() {
        this.router = express.Router();
        this.registerRoutes();
    }

    registerRoutes() {
        this.router.use('/', routes);
    }

    getRouter() {
        return this.router;
    }
}

module.exports = MovementItemModule;

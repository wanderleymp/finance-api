const express = require('express');
const contractExtraServiceRoutes = require('./contract-extra-service.routes');

class ContractExtraServiceModule {
    constructor(app) {
        this.app = app;
    }

    init() {
        this.app.use('/contract-extra-services', contractExtraServiceRoutes);
    }

    static register(app) {
        const module = new ContractExtraServiceModule(app);
        module.init();
    }
}

module.exports = ContractExtraServiceModule;

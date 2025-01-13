const express = require('express');
const LicenseController = require('./license.controller');
const LicenseService = require('../../services/licenseService');
const LicenseRepository = require('../../repositories/licenseRepository');
const { validateRequest } = require('../../middlewares/validateRequest');
const { createLicenseSchema, updateLicenseSchema } = require('./validators/license.validator');

class LicenseModule {
    constructor() {
        this.repository = new LicenseRepository();
        this.service = new LicenseService();
        this.controller = new LicenseController(this.service);
        this.router = express.Router();
        this.initRoutes();
    }

    initRoutes() {
        // Rotas de licença
        this.router.get('/', this.controller.index.bind(this.controller));
        this.router.get('/:id', this.controller.show.bind(this.controller));
        this.router.post('/', 
            validateRequest(createLicenseSchema), 
            this.controller.create.bind(this.controller)
        );
        this.router.put('/:id', 
            validateRequest(updateLicenseSchema), 
            this.controller.update.bind(this.controller)
        );
        this.router.delete('/:id', this.controller.delete.bind(this.controller));
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new LicenseModule();

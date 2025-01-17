const { Router } = require('express');
const ContractGroupController = require('./controller/contract-group.controller');

const contractGroupRoutes = (app) => {
    const router = Router();
    const controller = new ContractGroupController();

    router.get('/', (req, res, next) => controller.findAll(req, res, next));
    router.get('/:id', (req, res, next) => controller.findById(req, res, next));
    router.post('/', (req, res, next) => controller.create(req, res, next));
    router.put('/:id', (req, res, next) => controller.update(req, res, next));
    router.delete('/:id', (req, res, next) => controller.delete(req, res, next));

    app.use('/contract-groups', router);
};

module.exports = contractGroupRoutes;

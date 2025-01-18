const { Router } = require('express');
const ContractMovementController = require('./controller/contract-movement.controller');
const { authMiddleware } = require('../../middlewares/auth');

const contractMovementRoutes = (app) => {
    const router = Router();
    const controller = new ContractMovementController();

    router.use(authMiddleware);

    router.get('/', (req, res, next) => controller.findAll(req, res, next));
    router.get('/:contract_id/:movement_id', (req, res, next) => controller.findById(req, res, next));
    router.post('/', (req, res, next) => controller.create(req, res, next));
    router.put('/:contract_id/:movement_id', (req, res, next) => controller.update(req, res, next));
    router.delete('/:contract_id/:movement_id', (req, res, next) => controller.delete(req, res, next));

    app.use('/contract-movements', router);
};

module.exports = contractMovementRoutes;

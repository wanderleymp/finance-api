const express = require('express');
const ContractAdjustmentContractController = require('./controller/contract-adjustment-contract.controller');
const { validate } = require('../../middlewares/validator');
const contractAdjustmentContractValidator = require('./validators/contract-adjustment-contract.validator');
const { authMiddleware } = require('../../middlewares/auth');

const router = express.Router();
const controller = new ContractAdjustmentContractController();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas de listagem
router.get('/', controller.findAll.bind(controller));
router.get('/:adjustmentId/:contractId', controller.findById.bind(controller));

// Rotas de criação
router.post(
    '/', 
    validate('body', contractAdjustmentContractValidator.create),
    controller.create.bind(controller)
);

router.post(
    '/bulk', 
    validate('body', contractAdjustmentContractValidator.bulkCreate),
    controller.bulkCreate.bind(controller)
);

// Rotas de atualização
router.put(
    '/:adjustmentId/:contractId', 
    validate('body', contractAdjustmentContractValidator.update),
    controller.update.bind(controller)
);

// Rotas de exclusão
router.delete('/:adjustmentId/:contractId', controller.delete.bind(controller));

module.exports = router;

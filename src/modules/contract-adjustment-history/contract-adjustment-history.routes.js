const express = require('express');
const ContractAdjustmentHistoryController = require('./controller/contract-adjustment-history.controller');
const { validate } = require('../../middlewares/validator');
const contractAdjustmentHistoryValidator = require('./validators/contract-adjustment-history.validator');

const router = express.Router();
const controller = new ContractAdjustmentHistoryController();

// Rota para listar todos os históricos de ajuste
router.get('/', controller.listAll.bind(controller));

// Rota para listar históricos de ajuste por contrato específico
router.get('/:contractId', controller.getByContractId.bind(controller));

router.post(
    '/', 
    validate('body', contractAdjustmentHistoryValidator.create),
    controller.create.bind(controller)
);

router.put(
    '/:adjustmentHistoryId', 
    validate('body', contractAdjustmentHistoryValidator.update),
    controller.update.bind(controller)
);

router.delete('/:adjustmentHistoryId', controller.delete.bind(controller));

module.exports = router;

const express = require('express');
const ContractRecurringController = require('./controller/contract-recurring.controller');
const { validate } = require('../../middlewares/validator');
const contractRecurringValidator = require('./validators/contract-recurring.validator');

const router = express.Router();
const controller = new ContractRecurringController();

router.get('/pending-billings', controller.findPendingBillings.bind(controller));
router.get('/billing', controller.findAll.bind(controller));
router.get('/', controller.findAll.bind(controller));
router.get('/:id', controller.findById.bind(controller));

router.post(
    '/', 
    validate('body', contractRecurringValidator.create),
    controller.create.bind(controller)
);

router.put(
    '/:id', 
    validate('body', contractRecurringValidator.update),
    controller.update.bind(controller)
);

// Nova rota para atualizar item de contrato recorrente
router.put(
    '/:id/items/:movementItemId', 
    controller.updateContractRecurringItem.bind(controller)
);

router.delete('/:id', controller.delete.bind(controller));

// Nova rota para ajuste de contrato recorrente
router.post(
    '/:id/adjustment', 
    validate('body', contractRecurringValidator.adjustment),
    controller.processSingleContractAdjustment.bind(controller)
);

// Rotas de billing para contratos recorrentes
router.post('/billing', controller.processBilling.bind(controller));

router.post(
    '/:id/billing', 
    controller.processSingleContractBilling.bind(controller)
);

module.exports = router;

const express = require('express');
const ContractExtraServiceController = require('./controller/contract-extra-service.controller');
const { validate } = require('../../middlewares/validator');
const contractExtraServiceValidator = require('./validators/contract-extra-service.validator');

const router = express.Router();
const controller = new ContractExtraServiceController();

router.get('/', controller.findAll.bind(controller));
router.get('/:extraServiceId', controller.findById.bind(controller));

router.post(
    '/', 
    validate('body', contractExtraServiceValidator.create),
    controller.create.bind(controller)
);

router.put(
    '/:extraServiceId', 
    validate('body', contractExtraServiceValidator.update),
    controller.update.bind(controller)
);

router.delete('/:extraServiceId', controller.delete.bind(controller));

module.exports = router;

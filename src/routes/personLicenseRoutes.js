                                                     const express = require('express');
const personLicenseController = require('../controllers/personLicenseController');
const { validateRequest } = require('../middlewares/requestValidator');
const personLicenseSchema = require('../schemas/personLicenseSchema');

const router = express.Router();

// Listar todas as associações pessoa-licença
router.get('/', 
    validateRequest(personLicenseSchema.listOptions, 'query'),
    personLicenseController.index
);

// Criar associação pessoa-licença
router.post('/', 
    validateRequest(personLicenseSchema.createPersonLicense, 'body'), 
    personLicenseController.create
);

// Remover associação pessoa-licença
router.delete('/:personId/:licenseId', 
    validateRequest(personLicenseSchema.removePersonLicense, 'params'),
    personLicenseController.remove
);

module.exports = router;

const express = require('express');
const licenseController = require('../controllers/licenseController');
const { validateRequest } = require('../middlewares/requestValidator');
const licenseSchema = require('../schemas/licenseSchema');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Adicionar middleware de autenticação para todas as rotas
router.use(authMiddleware);

router.get('/', 
    validateRequest(licenseSchema.listLicenses, 'query'), 
    licenseController.index
);

router.get('/:id', 
    validateRequest(licenseSchema.getLicenseById, 'params'), 
    licenseController.show
);

router.post('/', 
    validateRequest(licenseSchema.createLicense, 'body'), 
    licenseController.store
);

router.put('/:id', 
    validateRequest(licenseSchema.getLicenseById, 'params'),
    validateRequest(licenseSchema.updateLicense, 'body'), 
    licenseController.update
);

router.delete('/:id', 
    validateRequest(licenseSchema.getLicenseById, 'params'), 
    licenseController.delete
);

router.get('/person/:person_id', 
    validateRequest(licenseSchema.getLicenseById, 'params'), 
    licenseController.listByPerson
);

module.exports = router;

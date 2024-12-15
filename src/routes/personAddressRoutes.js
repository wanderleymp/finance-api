const express = require('express');
const personAddressController = require('../controllers/personAddressController');
const { validateRequest } = require('../middlewares/requestValidator');
const personAddressSchema = require('../schemas/personAddressSchema');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Adicionar middleware de autenticação para todas as rotas
router.use(authMiddleware);

router.get('/', 
    validateRequest(personAddressSchema.listPersonAddresses, 'query'), 
    personAddressController.index
);

router.get('/:id', 
    validateRequest(personAddressSchema.getPersonAddressById, 'params'), 
    personAddressController.show
);

router.post('/', 
    validateRequest(personAddressSchema.createPersonAddress, 'body'), 
    personAddressController.store
);

router.put('/:id', 
    validateRequest(personAddressSchema.getPersonAddressById, 'params'),
    validateRequest(personAddressSchema.updatePersonAddress, 'body'), 
    personAddressController.update
);

router.delete('/:id', 
    validateRequest(personAddressSchema.getPersonAddressById, 'params'), 
    personAddressController.delete
);

module.exports = router;

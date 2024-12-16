const express = require('express');
const PersonController = require('../controllers/personController');
const personController = new PersonController();
const { validateRequest } = require('../middlewares/requestValidator');
const personSchema = require('../schemas/personSchema');
const personAddressSchema = require('../schemas/personAddressSchema'); // Added this line
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', validateRequest(personSchema.listPersons, 'query'), personController.index);
router.get('/:id', validateRequest(personSchema.getPersonById, 'params'), personController.show);
router.get('/:id/documents', validateRequest(personSchema.getPersonById, 'params'), personController.documents);
router.get('/:id/contacts', validateRequest(personSchema.getPersonById, 'params'), personController.contacts);
router.get('/cnpj/:cnpj', 
    (req, res, next) => {
        req.params = { cnpj: req.params.cnpj };
        next();
    },
    validateRequest(personSchema.findByCnpj, 'params'), 
    personController.findByCnpj
);
router.post('/', validateRequest(personSchema.createPerson, 'body'), personController.store);
router.post('/cnpj/:cnpj', 
    validateRequest(personSchema.createPersonByCnpj, 'params'),
    validateRequest(personSchema.createPersonByCnpj, 'body'), 
    personController.createPersonByCnpj
);
router.post('/:id/addresses', 
    validateRequest(personAddressSchema.createPersonAddress, 'body'),
    (req, res, next) => {
        console.error('🚨 ROUTE: POST /persons/:id/addresses');
        console.error('🚨 ROUTE: params:', req.params);
        console.error('🚨 ROUTE: body:', req.body);
        next();
    },
    personController.addPersonAddress);
router.put('/:id', 
    validateRequest(personSchema.getPersonById, 'params'),
    validateRequest(personSchema.updatePerson, 'body'), 
    personController.update
);
router.delete('/:id', validateRequest(personSchema.getPersonById, 'params'), personController.delete);

module.exports = router;

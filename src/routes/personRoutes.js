const express = require('express');
const personController = require('../controllers/personController');
const { validateRequest } = require('../middlewares/requestValidator');
const personSchema = require('../schemas/personSchema');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', validateRequest(personSchema.listPersons, 'query'), personController.index);
router.get('/all', validateRequest(personSchema.listPersons, 'query'), personController.indexWithRelations);
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
router.put('/:id', 
    validateRequest(personSchema.getPersonById, 'params'),
    validateRequest(personSchema.updatePerson, 'body'), 
    personController.update
);
router.delete('/:id', validateRequest(personSchema.getPersonById, 'params'), personController.delete);

module.exports = router;

const express = require('express');
const personController = require('../controllers/personController');
const { validateRequest } = require('../middlewares/requestValidator');
const personSchema = require('../schemas/personSchema');

const router = express.Router();

router.get('/', personController.index);
router.get('/:id', validateRequest(personSchema.getPersonById, 'params'), personController.show);
router.post('/', validateRequest(personSchema.createPerson, 'body'), personController.store);
router.put('/:id', 
    validateRequest(personSchema.getPersonById, 'params'),
    validateRequest(personSchema.updatePerson, 'body'), 
    personController.update
);
router.delete('/:id', validateRequest(personSchema.getPersonById, 'params'), personController.destroy);

module.exports = router;

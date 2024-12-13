const express = require('express');
const personContactController = require('../controllers/personContactController');
const { validateRequest } = require('../middlewares/requestValidator');
const personContactSchema = require('../schemas/personContactSchema');

const router = express.Router();

// Listar contatos
router.get('/', personContactController.index);

// Obter contato por ID
router.get('/:id', validateRequest(personContactSchema.getContactById, 'params'), personContactController.show);

// Criar novo contato
router.post('/', validateRequest(personContactSchema.createContact, 'body'), personContactController.store);

// Atualizar contato
router.put('/:id', 
    validateRequest(personContactSchema.getContactById, 'params'),
    validateRequest(personContactSchema.updateContact, 'body'), 
    personContactController.update
);

// Excluir contato
router.delete('/:id', validateRequest(personContactSchema.getContactById, 'params'), personContactController.delete);

// Alternar status ativo/inativo
router.patch('/:id/toggle-active', 
    validateRequest(personContactSchema.getContactById, 'params'), 
    personContactController.toggleActive
);

// Definir contato como principal
router.patch('/:id/set-main', 
    validateRequest(personContactSchema.getContactById, 'params'), 
    personContactController.setMain
);

module.exports = router;

const express = require('express');
const contactController = require('../controllers/contactController');
const { validateRequest } = require('../middlewares/requestValidator');
const contactSchema = require('../schemas/contactSchema');

const router = express.Router();

// Listar contatos
router.get('/', contactController.index);

// Obter contato por ID
router.get('/:id', 
    validateRequest(contactSchema.getContactById, 'params'), 
    contactController.show
);

// Criar novo contato
router.post('/', 
    validateRequest(contactSchema.createContact, 'body'), 
    contactController.store
);

// Atualizar contato
router.put('/:id', 
    validateRequest(contactSchema.getContactById, 'params'),
    validateRequest(contactSchema.updateContact, 'body'), 
    contactController.update
);

// Excluir contato
router.delete('/:id', 
    validateRequest(contactSchema.getContactById, 'params'), 
    contactController.delete
);

module.exports = router;

const express = require('express');
const itemController = require('../controllers/itemController');
const { validateRequest } = require('../middlewares/requestValidator');
const itemSchema = require('../schemas/itemSchema');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Adicionar middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Listar items
router.get('/', 
    validateRequest(itemSchema.listItems, 'query'), 
    itemController.index
);

// Obter item por ID
router.get('/:id', 
    validateRequest(itemSchema.getItemById, 'params'), 
    itemController.show
);

// Criar novo item
router.post('/', 
    validateRequest(itemSchema.createItem, 'body'), 
    itemController.store
);

// Atualizar item
router.put('/:id', 
    validateRequest(itemSchema.getItemById, 'params'),
    validateRequest(itemSchema.updateItem, 'body'), 
    itemController.update
);

// Excluir item
router.delete('/:id', 
    validateRequest(itemSchema.getItemById, 'params'), 
    itemController.delete
);

module.exports = router;

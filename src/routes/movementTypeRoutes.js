const express = require('express');
const movementTypeController = require('../controllers/movementTypeController');
const { validateRequest } = require('../middlewares/requestValidator');
const movementTypeSchema = require('../schemas/movementTypeSchema');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Adicionar middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Listar tipos de movimentação
router.get('/', 
    validateRequest(movementTypeSchema.listMovementTypes, 'query'), 
    movementTypeController.index
);

// Obter tipo de movimentação por ID
router.get('/:id', 
    validateRequest(movementTypeSchema.getMovementTypeById, 'params'), 
    movementTypeController.show
);

// Criar novo tipo de movimentação
router.post('/', 
    validateRequest(movementTypeSchema.createMovementType, 'body'), 
    movementTypeController.store
);

// Atualizar tipo de movimentação
router.put('/:id', 
    validateRequest(movementTypeSchema.getMovementTypeById, 'params'),
    validateRequest(movementTypeSchema.updateMovementType, 'body'), 
    movementTypeController.update
);

// Excluir tipo de movimentação
router.delete('/:id', 
    validateRequest(movementTypeSchema.getMovementTypeById, 'params'), 
    movementTypeController.delete
);

module.exports = router;

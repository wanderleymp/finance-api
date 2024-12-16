const express = require('express');
const movementController = require('../controllers/movementController');
const { validateRequest } = require('../middlewares/requestValidator');
const movementSchema = require('../schemas/movementSchema');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Adicionar middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Listar movimentações
router.get('/', 
    validateRequest(movementSchema.listMovements, 'query'), 
    movementController.index
);

// Obter movimentação por ID
router.get('/:id', 
    validateRequest(movementSchema.getMovementById, 'params'), 
    movementController.show
);

// Criar nova movimentação
router.post('/', 
    validateRequest(movementSchema.createMovement, 'body'), 
    movementController.create
);

// Atualizar movimentação
router.put('/:id', 
    validateRequest(movementSchema.updateMovement, 'body'),
    validateRequest(movementSchema.getMovementById, 'params'), 
    movementController.update
);

// Excluir movimentação
router.delete('/:id', 
    validateRequest(movementSchema.getMovementById, 'params'), 
    movementController.delete
);

module.exports = router;

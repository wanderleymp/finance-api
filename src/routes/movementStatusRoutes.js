const express = require('express');
const movementStatusController = require('../controllers/movementStatusController');
const { validateRequest } = require('../middlewares/requestValidator');
const movementStatusSchema = require('../schemas/movementStatusSchema');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Adicionar middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Listar status de movimentação
router.get('/', 
    validateRequest(movementStatusSchema.listMovementStatuses, 'query'), 
    movementStatusController.index
);

// Obter status de movimentação por ID
router.get('/:id', 
    validateRequest(movementStatusSchema.getMovementStatusById, 'params'), 
    movementStatusController.show
);

// Criar novo status de movimentação
router.post('/', 
    validateRequest(movementStatusSchema.createMovementStatus, 'body'), 
    movementStatusController.store
);

// Atualizar status de movimentação
router.put('/:id', 
    validateRequest(movementStatusSchema.getMovementStatusById, 'params'),
    validateRequest(movementStatusSchema.updateMovementStatus, 'body'), 
    movementStatusController.update
);

// Excluir status de movimentação
router.delete('/:id', 
    validateRequest(movementStatusSchema.getMovementStatusById, 'params'), 
    movementStatusController.delete
);

module.exports = router;

const express = require('express');
const salesController = require('../controllers/salesController');
const movementController = require('../controllers/movementController');
const { validateRequest } = require('../middlewares/requestValidator');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

// Adicionar middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas de vendas
router.get('/', salesController.index.bind(salesController));
router.get('/:id', salesController.show.bind(salesController));
router.post('/', salesController.store.bind(salesController));
router.put('/:id', salesController.update.bind(salesController));
router.delete('/:id', salesController.destroy.bind(salesController));

// Rota para emitir boletos de um movimento
router.post('/:id/boletos', movementController.emitirBoletos);

module.exports = router;

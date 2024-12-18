const express = require('express');
const installmentController = require('../controllers/installmentController');
const { validateRequest } = require('../middlewares/requestValidator');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Adicionar middleware de autenticação para todas as rotas
router.use(authMiddleware);

console.log('Rota de installments carregada!');

// Listar installments
router.get('/', installmentController.listInstallments);

// Obter installment por ID
router.get('/:installmentId', installmentController.getInstallmentById);

module.exports = router;

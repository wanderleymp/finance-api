const express = require('express');
const router = express.Router();
const paymentMethodController = require('../controllers/paymentMethodController');
const authMiddleware = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Listar todos os métodos de pagamento
router.get('/', (req, res) => paymentMethodController.getAllPaymentMethods(req, res));

// Obter um método de pagamento específico
router.get('/:id', (req, res) => paymentMethodController.getPaymentMethodById(req, res));

// Criar um novo método de pagamento
router.post('/', (req, res) => paymentMethodController.createPaymentMethod(req, res));

// Atualizar um método de pagamento
router.put('/:id', (req, res) => paymentMethodController.updatePaymentMethod(req, res));

// Excluir um método de pagamento
router.delete('/:id', (req, res) => paymentMethodController.deletePaymentMethod(req, res));

module.exports = router;

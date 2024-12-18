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

// Criar nova installment
router.post('/', installmentController.createInstallment);

// Atualizar installment
router.put('/:installmentId', installmentController.updateInstallment);

// Deletar installment
router.delete('/:installmentId', installmentController.deleteInstallment);

// Listar boletos de uma installment
router.get('/:id/boletos', installmentController.listInstallmentBoletos);

// Criar boleto para uma installment
router.post('/:id/boletos', installmentController.createInstallmentBoleto);

// Deletar boleto de uma installment
router.delete('/:id/boletos/:boletoId', installmentController.deleteInstallmentBoleto);

module.exports = router;

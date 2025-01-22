const express = require('express');
const ContractAdjustmentHistoryController = require('./application/controllers/contract-adjustment-history.controller');
const authMiddleware = require('../../middlewares/auth');

const router = express.Router();

router.post('/', authMiddleware, ContractAdjustmentHistoryController.create);
router.get('/', authMiddleware, ContractAdjustmentHistoryController.findAll);
router.get('/:id', authMiddleware, ContractAdjustmentHistoryController.findById);
router.get('/contract/:contractId', authMiddleware, ContractAdjustmentHistoryController.findByContractId);
router.put('/:id', authMiddleware, ContractAdjustmentHistoryController.update);
router.delete('/:id', authMiddleware, ContractAdjustmentHistoryController.delete);

// Middleware de tratamento de erros global
router.use((err, req, res, next) => {
  console.error('Erro na rota de histórico de ajuste de contrato:', err);
  res.status(500).json({ 
    message: 'Erro interno do servidor', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

module.exports = router;

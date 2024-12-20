const express = require('express');
const salesController = require('../controllers/salesController');
const { validateRequest } = require('../middlewares/requestValidator');
const { authMiddleware } = require('../middlewares/auth');
const salesSchema = require('../schemas/salesSchema');

const router = express.Router();

// Adicionar middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas de vendas
router.get('/', 
    validateRequest(salesSchema.listSales, 'query'),
    salesController.index
);

router.get('/:id', 
    validateRequest(salesSchema.getSaleById, 'params'),
    salesController.show
);

router.post('/', 
    validateRequest(salesSchema.createSale, 'body'),
    salesController.store
);

router.put('/:id', 
    validateRequest(salesSchema.updateSale, 'body'),
    validateRequest(salesSchema.getSaleById, 'params'),
    salesController.update
);

router.delete('/:id', 
    validateRequest(salesSchema.getSaleById, 'params'),
    salesController.destroy
);

module.exports = router;

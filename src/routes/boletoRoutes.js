const express = require('express');
const boletoController = require('../controllers/boletoController');
const { validateRequest } = require('../middlewares/requestValidator');
const boletoSchema = require('../schemas/boletoSchema');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Adicionar middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas de boletos
// Listar boletos
router.get('/', 
    validateRequest(boletoSchema.listBoletos, 'query'), 
    boletoController.index
);

// Obter boleto por ID
router.get('/:id', 
    validateRequest(boletoSchema.getBoletoById, 'params'), 
    boletoController.show
);

// Criar novo boleto
router.post('/', 
    validateRequest(boletoSchema.createBoleto, 'body'), 
    boletoController.store
);

// Atualizar boleto
router.put('/:id', 
    validateRequest(boletoSchema.getBoletoById, 'params'),
    validateRequest(boletoSchema.updateBoleto, 'body'), 
    boletoController.update
);

// Excluir boleto
router.delete('/:id', 
    validateRequest(boletoSchema.getBoletoById, 'params'), 
    boletoController.delete
);

module.exports = router;

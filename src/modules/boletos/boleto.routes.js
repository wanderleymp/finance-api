const express = require('express');
const { validateRequest } = require('../../middlewares/requestValidator');
const { authMiddleware } = require('../../middlewares/auth');
const boletoSchema = require('./schemas/boleto.schema');
const BoletoController = require('./boleto.controller');
const BoletoService = require('./boleto.service');
const BoletoRepository = require('../../repositories/boletoRepository');
const TaskService = require('../../services/taskService');

const router = express.Router();

// Injeção de dependências
const boletoService = new BoletoService(
    new BoletoRepository(),
    new TaskService()
);
const boletoController = new BoletoController(boletoService);

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas
router.get('/', 
    validateRequest(boletoSchema.listBoletos, 'query'),
    boletoController.index.bind(boletoController)
);

router.get('/:id',
    validateRequest(boletoSchema.getBoletoById, 'params'),
    boletoController.show.bind(boletoController)
);

router.post('/',
    validateRequest(boletoSchema.createBoleto, 'body'),
    boletoController.store.bind(boletoController)
);

router.put('/:id',
    validateRequest(boletoSchema.getBoletoById, 'params'),
    validateRequest(boletoSchema.updateBoleto, 'body'),
    boletoController.update.bind(boletoController)
);

router.post('/:id/cancel',
    validateRequest(boletoSchema.getBoletoById, 'params'),
    validateRequest(boletoSchema.cancelBoleto, 'body'),
    boletoController.cancel.bind(boletoController)
);

module.exports = router;

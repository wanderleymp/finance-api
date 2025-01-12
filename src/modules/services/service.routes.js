const express = require('express');
const ServiceController = require('./service.controller');
const { authMiddleware } = require('../../middlewares/auth');

const router = express.Router();
const serviceController = ServiceController;

// Rotas públicas
router.get('/details/:itemId', serviceController.findServiceDetails.bind(serviceController));
router.post('/details', serviceController.findMultipleServiceDetails.bind(serviceController));

// Rotas protegidas por autenticação
router.use(authMiddleware);

router.post('/', serviceController.create.bind(serviceController));
router.get('/', serviceController.findAll.bind(serviceController));
router.put('/:id', serviceController.update.bind(serviceController));
router.delete('/:id', serviceController.delete.bind(serviceController));

module.exports = router;

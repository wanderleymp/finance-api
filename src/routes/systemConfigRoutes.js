const express = require('express');
const SystemConfigController = require('../controllers/SystemConfigController');
const authMiddleware = require('../middlewares/authMiddleware');

function systemConfigRoutes(pool) {
    const router = express.Router();
    const systemConfigController = new SystemConfigController(pool);

    // Adicionar middleware de autenticação para todas as rotas
    router.use(authMiddleware);

    router.get('/configs', (req, res) => systemConfigController.getAllConfigs(req, res));
    router.get('/configs/:configKey', (req, res) => systemConfigController.getConfig(req, res));
    router.post('/configs', (req, res) => systemConfigController.createOrUpdateConfig(req, res));
    router.put('/configs/:configKey', (req, res) => systemConfigController.createOrUpdateConfig(req, res));
    router.delete('/configs/:configKey', (req, res) => systemConfigController.deleteConfig(req, res));

    return router;
}

module.exports = systemConfigRoutes;

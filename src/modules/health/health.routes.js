const express = require('express');
const healthController = require('./health.controller');
const cacheService = require('../../services/cacheService');
const { logger } = require('../../middlewares/logger');

const router = express.Router();

// Rota completa de health check com todas as métricas
router.get('/', healthController.check);

// Rota específica para checar bancos de dados
router.get('/databases', healthController.checkDatabases);

// Rota específica para métricas do sistema
router.get('/system', healthController.checkSystem);

// Rota para limpar cache manualmente
router.post('/cache/clear', async (req, res) => {
    try {
        await cacheService.clearAll();
        logger.info('Cache limpo manualmente');
        res.json({ 
            status: 'success',
            message: 'Cache limpo com sucesso'
        });
    } catch (error) {
        logger.error('Erro ao limpar cache manualmente', { error: error.message });
        res.status(500).json({ 
            status: 'error',
            message: 'Erro ao limpar cache'
        });
    }
});

module.exports = router;

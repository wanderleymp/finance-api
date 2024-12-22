const express = require('express');
const cacheService = require('../../services/cacheService');
const { logger } = require('../../middlewares/logger');

const router = express.Router();

// Rota básica de health check
router.get('/', (req, res) => {
    res.json({ status: 'OK' });
});

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

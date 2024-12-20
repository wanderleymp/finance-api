const express = require('express');
const metricsService = require('../services/metrics.service');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

// Middleware de autenticação
router.use(authMiddleware);

// Endpoint de métricas
router.get('/', async (req, res) => {
    try {
        const metrics = await metricsService.getMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
    } catch (error) {
        res.status(500).json({
            message: 'Erro ao coletar métricas'
        });
    }
});

module.exports = router;

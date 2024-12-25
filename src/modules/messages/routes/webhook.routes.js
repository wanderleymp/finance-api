const express = require('express');
const router = express.Router();
const { logger } = require('../../../middlewares/logger');
const GraphWebhookService = require('../services/graph-webhook.service');
const GraphWebhookController = require('../controllers/graph-webhook.controller');
const GraphSubscriptionRepository = require('../repositories/graph-subscription.repository');
const { authMiddleware } = require('../../../middlewares/auth');
const cors = require('cors');

// Inicializar repositório e serviços
const subscriptionRepository = new GraphSubscriptionRepository();
const webhookService = new GraphWebhookService(subscriptionRepository);
const webhookController = new GraphWebhookController(webhookService);

// Configuração específica do CORS para o endpoint de validação
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Endpoint para validação e notificações (sem autenticação)
router.all('/graph/messages', cors(corsOptions), webhookController.handleWebhook.bind(webhookController));

// Endpoint para criar subscription (com autenticação)
router.post('/graph/subscribe', authMiddleware, cors(corsOptions), webhookController.createSubscription.bind(webhookController));

// Endpoint para renovar subscription (com autenticação)
router.post('/graph/renew/:subscriptionId', authMiddleware, cors(corsOptions), webhookController.renewSubscription.bind(webhookController));

// Endpoint para deletar subscription (com autenticação)
router.delete('/graph/subscription/:subscriptionId', authMiddleware, cors(corsOptions), webhookController.deleteSubscription.bind(webhookController));

// Endpoint para obter token do Graph (com autenticação)
router.get('/graph/token', authMiddleware, cors(corsOptions), webhookController.getGraphToken.bind(webhookController));

module.exports = router;

const express = require('express');
const router = express.Router();
const { logger } = require('../../../middlewares/logger');
const GraphWebhookService = require('../services/graph-webhook.service');
const { authMiddleware } = require('../../../middlewares/auth');
const cors = require('cors');

const webhookService = new GraphWebhookService();

// Configuração específica do CORS para o endpoint de validação
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Endpoint para validação e notificações
router.all('/graph/messages', cors(corsOptions), async (req, res) => {
    try {
        logger.info('Recebida requisição no webhook', {
            method: req.method,
            query: req.query,
            headers: req.headers,
            body: req.body
        });

        // Validação do webhook
        if (req.query.validationToken) {
            logger.info('Processando validação do webhook', {
                validationToken: req.query.validationToken
            });

            res.set({
                'Content-Type': 'text/plain',
                'Charset': 'utf-8'
            });

            return res.status(200).end(req.query.validationToken);
        }

        // Notificação do webhook
        if (req.method === 'POST' && req.body && req.body.value) {
            logger.info('Processando notificação do webhook', {
                notifications: req.body.value
            });

            await Promise.all(req.body.value.map(notification => 
                webhookService.handleNotification(notification)
            ));

            return res.status(202).end();
        }

        // Método não suportado
        logger.warn('Método não suportado no webhook', {
            method: req.method,
            path: req.path
        });

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        logger.error('Erro no endpoint do webhook', {
            error: error.message,
            method: req.method,
            path: req.path,
            body: req.body
        });

        return res.status(500).json({ error: error.message });
    }
});

// Endpoint para criar subscription
router.post('/graph/subscribe', authMiddleware, cors(corsOptions), async (req, res) => {
    try {
        logger.info('Iniciando criação de subscription');
        const subscription = await webhookService.createSubscription();
        logger.info('Subscription criada com sucesso', { subscription });
        res.json(subscription);
    } catch (error) {
        logger.error('Erro ao criar subscription', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para renovar subscription
router.post('/graph/renew/:subscriptionId', authMiddleware, cors(corsOptions), async (req, res) => {
    try {
        const subscription = await webhookService.renewSubscription(req.params.subscriptionId);
        res.json(subscription);
    } catch (error) {
        logger.error('Erro ao renovar subscription', {
            error: error.message,
            subscriptionId: req.params.subscriptionId
        });
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para deletar subscription
router.delete('/graph/subscription/:subscriptionId', authMiddleware, cors(corsOptions), async (req, res) => {
    try {
        await webhookService.deleteSubscription(req.params.subscriptionId);
        res.status(204).send();
    } catch (error) {
        logger.error('Erro ao deletar subscription', {
            error: error.message,
            subscriptionId: req.params.subscriptionId
        });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

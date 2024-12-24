const express = require('express');
const router = express.Router();
const { logger } = require('../../../middlewares/logger');
const GraphWebhookService = require('../services/graph-webhook.service');

const webhookService = new GraphWebhookService();

// Endpoint para validação do webhook
router.post('/graph/messages', async (req, res) => {
    try {
        // Se tiver validationToken, é uma requisição de validação
        if (req.query.validationToken) {
            const token = webhookService.validateWebhook(req.query.validationToken);
            return res.status(200).send(token);
        }

        // Se não tiver validationToken, é uma notificação
        const notifications = req.body.value;
        
        // Processar cada notificação
        for (const notification of notifications) {
            await webhookService.handleNotification(notification);
        }

        res.status(202).send(); // Accepted
    } catch (error) {
        logger.error('Erro no webhook', {
            error: error.message,
            body: req.body,
            stack: error.stack
        });
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para criar subscription manualmente
router.post('/graph/subscribe', async (req, res) => {
    try {
        const subscription = await webhookService.createSubscription();
        res.json(subscription);
    } catch (error) {
        logger.error('Erro ao criar subscription', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para renovar subscription
router.post('/graph/renew/:subscriptionId', async (req, res) => {
    try {
        const subscription = await webhookService.renewSubscription(req.params.subscriptionId);
        res.json(subscription);
    } catch (error) {
        logger.error('Erro ao renovar subscription', {
            error: error.message,
            subscriptionId: req.params.subscriptionId,
            stack: error.stack
        });
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para deletar subscription
router.delete('/graph/subscription/:subscriptionId', async (req, res) => {
    try {
        await webhookService.deleteSubscription(req.params.subscriptionId);
        res.status(204).send();
    } catch (error) {
        logger.error('Erro ao deletar subscription', {
            error: error.message,
            subscriptionId: req.params.subscriptionId,
            stack: error.stack
        });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

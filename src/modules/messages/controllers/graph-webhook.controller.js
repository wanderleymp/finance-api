const { logger } = require('../../../middlewares/logger');

class GraphWebhookController {
    constructor(webhookService) {
        this.service = webhookService;
    }

    async createSubscription(req, res) {
        try {
            logger.info('Controller: Iniciando criação de subscription');

            const result = await this.service.createSubscription();

            logger.info('Controller: Subscription criada com sucesso', {
                subscriptionId: result.id,
                expirationDateTime: result.expirationDateTime
            });

            return res.status(201).json(result);
        } catch (error) {
            logger.error('Controller: Erro ao criar subscription', {
                error: error.message,
                stack: error.stack,
                response: error.response ? {
                    status: error.response.status,
                    data: error.response.data
                } : undefined
            });

            return res.status(500).json({ error: error.message });
        }
    }

    async renewSubscription(req, res) {
        try {
            const { subscriptionId } = req.params;

            logger.info('Controller: Iniciando renovação de subscription', {
                subscriptionId
            });

            const result = await this.service.renewSubscription(subscriptionId);

            logger.info('Controller: Subscription renovada com sucesso', {
                subscriptionId: result.id,
                expirationDateTime: result.expirationDateTime
            });

            return res.status(200).json(result);
        } catch (error) {
            logger.error('Controller: Erro ao renovar subscription', {
                error: error.message,
                stack: error.stack,
                subscriptionId: req.params.subscriptionId
            });

            return res.status(500).json({ error: error.message });
        }
    }

    async deleteSubscription(req, res) {
        try {
            const { subscriptionId } = req.params;

            logger.info('Controller: Iniciando exclusão de subscription', {
                subscriptionId
            });

            await this.service.deleteSubscription(subscriptionId);

            logger.info('Controller: Subscription excluída com sucesso', {
                subscriptionId
            });

            return res.status(204).end();
        } catch (error) {
            logger.error('Controller: Erro ao excluir subscription', {
                error: error.message,
                stack: error.stack,
                subscriptionId: req.params.subscriptionId
            });

            return res.status(500).json({ error: error.message });
        }
    }

    async handleWebhook(req, res) {
        try {
            logger.info('Controller: Processando requisição do webhook', {
                method: req.method,
                path: req.path,
                query: req.query,
                headers: req.headers,
                body: req.body
            });

            // Validação do webhook
            if (req.query.validationToken) {
                logger.info('Controller: Processando validação do webhook', {
                    validationToken: req.query.validationToken
                });

                res.set({
                    'Content-Type': 'text/plain',
                    'Charset': 'utf-8'
                });

                logger.info('Controller: Retornando token de validação');
                return res.status(200).end(req.query.validationToken);
            }

            // Notificação do webhook
            if (req.method === 'POST' && req.body && req.body.value) {
                logger.info('Controller: Processando notificação do webhook', {
                    notifications: req.body.value
                });

                await Promise.all(req.body.value.map(notification => 
                    this.service.handleNotification(notification)
                ));

                logger.info('Controller: Notificações processadas com sucesso');
                return res.status(202).end();
            }

            // Método não suportado
            logger.warn('Controller: Método não suportado no webhook', {
                method: req.method,
                path: req.path
            });

            return res.status(405).json({ error: 'Method not allowed' });
        } catch (error) {
            logger.error('Controller: Erro no endpoint do webhook', {
                error: error.message,
                stack: error.stack,
                method: req.method,
                path: req.path,
                body: req.body
            });

            return res.status(500).json({ error: error.message });
        }
    }

    async getGraphToken(req, res) {
        try {
            const token = await this.service.getGraphToken();
            return res.status(200).json({ token });
        } catch (error) {
            logger.error('Controller: Erro ao obter token do Graph', {
                error: error.message,
                stack: error.stack
            });
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = GraphWebhookController;

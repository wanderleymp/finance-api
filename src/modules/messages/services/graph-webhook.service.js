const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientSecretCredential } = require('@azure/identity');
const { logger } = require('../../../middlewares/logger');
const EmailTrackingService = require('./email-tracking.service');

class GraphWebhookService {
    constructor() {
        this.baseUrl = process.env.GRAPH_WEBHOOK_BASE_URL;
        this.path = process.env.GRAPH_WEBHOOK_PATH;
        this.secret = process.env.GRAPH_WEBHOOK_SECRET;
        this.emailTrackingService = new EmailTrackingService();
        
        this.initializeClient();
    }

    initializeClient() {
        const credential = new ClientSecretCredential(
            process.env.MICROSOFT_TENANT_ID,
            process.env.MICROSOFT_CLIENT_ID,
            process.env.MICROSOFT_CLIENT_SECRET
        );

        this.graphClient = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: async () => {
                    const response = await credential.getToken('https://graph.microsoft.com/.default');
                    return response.token;
                }
            }
        });
    }

    async createSubscription() {
        try {
            const subscription = {
                changeType: 'created,updated',
                notificationUrl: `${this.baseUrl}${this.path}`,
                resource: '/users/' + process.env.MICROSOFT_EMAIL_USER + '/messages',
                expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
                clientState: this.secret,
                includeResourceData: true
            };

            const result = await this.graphClient.api('/subscriptions')
                .post(subscription);

            logger.info('Subscription criada com sucesso', {
                subscriptionId: result.id,
                expirationDateTime: result.expirationDateTime
            });

            return result;
        } catch (error) {
            logger.error('Erro ao criar subscription', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async renewSubscription(subscriptionId) {
        try {
            const subscription = {
                expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 dias
            };

            const result = await this.graphClient.api(`/subscriptions/${subscriptionId}`)
                .patch(subscription);

            logger.info('Subscription renovada com sucesso', {
                subscriptionId: result.id,
                expirationDateTime: result.expirationDateTime
            });

            return result;
        } catch (error) {
            logger.error('Erro ao renovar subscription', {
                error: error.message,
                subscriptionId,
                stack: error.stack
            });
            throw error;
        }
    }

    async deleteSubscription(subscriptionId) {
        try {
            await this.graphClient.api(`/subscriptions/${subscriptionId}`)
                .delete();

            logger.info('Subscription deletada com sucesso', { subscriptionId });
        } catch (error) {
            logger.error('Erro ao deletar subscription', {
                error: error.message,
                subscriptionId,
                stack: error.stack
            });
            throw error;
        }
    }

    async handleNotification(notification) {
        try {
            // Validar clientState para garantir que a notificação é legítima
            if (notification.clientState !== this.secret) {
                throw new Error('Invalid clientState');
            }

            const { messageId, status, resourceData } = notification;
            const recipientEmail = resourceData.toRecipients[0].emailAddress.address;

            // Mapear status do Graph para nossos status
            let trackingStatus;
            switch (status) {
                case 'created':
                    trackingStatus = 'QUEUED';
                    break;
                case 'delivered':
                    trackingStatus = 'DELIVERED';
                    break;
                case 'read':
                    trackingStatus = 'READ';
                    break;
                default:
                    trackingStatus = 'PENDING';
            }

            // Atualizar status no nosso tracking
            await this.emailTrackingService.updateStatus(
                messageId,
                recipientEmail,
                trackingStatus,
                {
                    graphNotification: notification
                }
            );

            logger.info('Notificação processada com sucesso', {
                messageId,
                recipientEmail,
                status: trackingStatus
            });
        } catch (error) {
            logger.error('Erro ao processar notificação', {
                error: error.message,
                notification,
                stack: error.stack
            });
            throw error;
        }
    }

    validateWebhook(validationToken) {
        // Microsoft envia um token de validação que deve ser retornado
        if (!validationToken) {
            throw new Error('Validation token não fornecido');
        }
        return validationToken;
    }
}

module.exports = GraphWebhookService;

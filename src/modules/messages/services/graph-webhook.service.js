const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientSecretCredential } = require('@azure/identity');
const { logger } = require('../../../middlewares/logger');
const EmailTrackingService = require('./email-tracking.service');

class GraphWebhookService {
    constructor() {
        // URL fixa para ambiente de desenvolvimento
        const baseUrl = 'https://dev.agilefinance.com.br';
        const path = '/webhooks/graph/messages';

        logger.info('Inicializando GraphWebhookService com as seguintes configurações:', {
            baseUrl,
            path,
            hasSecret: !!process.env.GRAPH_WEBHOOK_SECRET,
            hasTenantId: !!process.env.MICROSOFT_TENANT_ID,
            hasClientId: !!process.env.MICROSOFT_CLIENT_ID,
            hasClientSecret: !!process.env.MICROSOFT_CLIENT_SECRET,
            hasEmailUser: !!process.env.MICROSOFT_EMAIL_USER,
            hasCertificate: !!process.env.GRAPH_WEBHOOK_CERTIFICATE,
            hasCertificateId: !!process.env.GRAPH_WEBHOOK_CERTIFICATE_ID
        });

        this.baseUrl = baseUrl;
        this.path = path;
        this.secret = process.env.GRAPH_WEBHOOK_SECRET;
        this.emailTrackingService = new EmailTrackingService();
        
        this.initializeClient();
    }

    initializeClient() {
        try {
            logger.info('Inicializando cliente do Microsoft Graph');
            
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

            logger.info('Cliente do Microsoft Graph inicializado com sucesso');
        } catch (error) {
            logger.error('Erro ao inicializar cliente do Microsoft Graph', {
                error: error.message
            });
            throw error;
        }
    }

    async createSubscription() {
        try {
            // Verificar todas as variáveis de ambiente necessárias
            const requiredVars = {
                MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID,
                MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
                MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
                MICROSOFT_EMAIL_USER: process.env.MICROSOFT_EMAIL_USER,
                GRAPH_WEBHOOK_CERTIFICATE: process.env.GRAPH_WEBHOOK_CERTIFICATE,
                GRAPH_WEBHOOK_CERTIFICATE_ID: process.env.GRAPH_WEBHOOK_CERTIFICATE_ID,
                GRAPH_WEBHOOK_SECRET: this.secret
            };

            const missingVars = Object.entries(requiredVars)
                .filter(([_, value]) => !value)
                .map(([key]) => key);

            if (missingVars.length > 0) {
                const error = new Error(`As seguintes variáveis de ambiente são obrigatórias: ${missingVars.join(', ')}`);
                logger.error('Erro ao criar subscription - variáveis de ambiente faltando', {
                    missingVars,
                    error: error.message
                });
                throw error;
            }

            // Usar a URL completa do endpoint de validação
            const notificationUrl = `${this.baseUrl}${this.path}`;

            logger.info('Criando subscription com as seguintes configurações:', {
                notificationUrl,
                emailUser: process.env.MICROSOFT_EMAIL_USER,
                certificateId: process.env.GRAPH_WEBHOOK_CERTIFICATE_ID
            });

            const subscription = {
                changeType: 'created,updated',
                notificationUrl,
                resource: `/users/${process.env.MICROSOFT_EMAIL_USER}/messages?$select=id,subject,receivedDateTime,internetMessageId,from,toRecipients`,
                expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
                clientState: this.secret,
                includeResourceData: true,
                latestSupportedTlsVersion: 'v1_2',
                encryptionCertificate: process.env.GRAPH_WEBHOOK_CERTIFICATE,
                encryptionCertificateId: process.env.GRAPH_WEBHOOK_CERTIFICATE_ID
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
            logger.info('Renovando subscription', { subscriptionId });

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
                subscriptionId
            });
            throw error;
        }
    }

    async deleteSubscription(subscriptionId) {
        try {
            logger.info('Deletando subscription', { subscriptionId });

            await this.graphClient.api(`/subscriptions/${subscriptionId}`)
                .delete();

            logger.info('Subscription deletada com sucesso', { subscriptionId });
        } catch (error) {
            logger.error('Erro ao deletar subscription', {
                error: error.message,
                subscriptionId
            });
            throw error;
        }
    }

    async handleNotification(notification) {
        try {
            logger.info('Processando notificação', {
                changeType: notification.changeType,
                resource: notification.resource,
                clientState: notification.clientState
            });

            // Validar clientState
            if (notification.clientState !== this.secret) {
                const error = new Error('Invalid clientState');
                logger.error('Erro de validação do clientState', {
                    expected: this.secret,
                    received: notification.clientState
                });
                throw error;
            }

            await this.emailTrackingService.processEmailNotification(notification);

            logger.info('Notificação processada com sucesso');
        } catch (error) {
            logger.error('Erro ao processar notificação', {
                error: error.message,
                notification
            });
            throw error;
        }
    }

    validateWebhook(validationToken) {
        logger.info('Validando webhook', { validationToken });
        return validationToken;
    }
}

module.exports = GraphWebhookService;

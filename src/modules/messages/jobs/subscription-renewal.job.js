const { logger } = require('../../../middlewares/logger');
const GraphWebhookService = require('../services/graph-webhook.service');
const GraphSubscriptionRepository = require('../repositories/graph-subscription.repository');

class SubscriptionRenewalJob {
    constructor() {
        this.webhookService = new GraphWebhookService();
        this.subscriptionRepository = new GraphSubscriptionRepository();
    }

    async execute() {
        try {
            logger.info('Iniciando job de renovação de subscriptions');

            // Buscar subscriptions que expiram nas próximas 24 horas
            const expiringSubscriptions = await this.subscriptionRepository.findExpiring(24);

            logger.info('Subscriptions encontradas para renovação', {
                count: expiringSubscriptions.length
            });

            for (const subscription of expiringSubscriptions) {
                try {
                    // Renovar no Graph API
                    const renewed = await this.webhookService.renewSubscription(
                        subscription.subscription_id
                    );

                    // Atualizar no banco
                    await this.subscriptionRepository.updateExpirationDate(
                        subscription.subscription_id,
                        renewed.expirationDateTime
                    );

                    logger.info('Subscription renovada com sucesso', {
                        subscriptionId: subscription.subscription_id,
                        newExpiration: renewed.expirationDateTime
                    });
                } catch (error) {
                    logger.error('Erro ao renovar subscription específica', {
                        error: error.message,
                        subscriptionId: subscription.subscription_id,
                        stack: error.stack
                    });

                    // Se falhar, tenta criar uma nova
                    try {
                        // Desativa a antiga
                        await this.subscriptionRepository.deactivate(
                            subscription.subscription_id
                        );

                        // Cria uma nova
                        const newSubscription = await this.webhookService.createSubscription();
                        await this.subscriptionRepository.create(newSubscription);

                        logger.info('Nova subscription criada após falha na renovação', {
                            oldSubscriptionId: subscription.subscription_id,
                            newSubscriptionId: newSubscription.id
                        });
                    } catch (retryError) {
                        logger.error('Erro ao criar nova subscription após falha na renovação', {
                            error: retryError.message,
                            originalSubscriptionId: subscription.subscription_id,
                            stack: retryError.stack
                        });
                    }
                }
            }

            logger.info('Job de renovação de subscriptions finalizado');
        } catch (error) {
            logger.error('Erro ao executar job de renovação de subscriptions', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = SubscriptionRenewalJob;

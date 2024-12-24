const { logger } = require('../../middlewares/logger');
const schedule = require('node-schedule');
const SubscriptionRenewalJob = require('./jobs/subscription-renewal.job');
const webhookRoutes = require('./routes/webhook.routes');

class MessagesModule {
    constructor(app) {
        this.app = app;
        this.subscriptionRenewalJob = new SubscriptionRenewalJob();
    }

    registerRoutes() {
        // Registrar rotas do webhook
        this.app.use('/webhooks', webhookRoutes);
    }

    scheduleJobs() {
        // Renovar subscriptions a cada 12 horas
        schedule.scheduleJob('0 */12 * * *', async () => {
            try {
                await this.subscriptionRenewalJob.execute();
            } catch (error) {
                logger.error('Erro ao executar job de renovação de subscriptions', {
                    error: error.message,
                    stack: error.stack
                });
            }
        });
    }

    async initialize() {
        try {
            // Registrar rotas
            this.registerRoutes();

            // Agendar jobs
            this.scheduleJobs();

            logger.info('Módulo de mensagens inicializado com sucesso');
        } catch (error) {
            logger.error('Erro ao inicializar módulo de mensagens', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = MessagesModule;

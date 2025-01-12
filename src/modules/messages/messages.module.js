const { logger } = require('../../middlewares/logger');
const schedule = require('node-schedule');
const SubscriptionRenewalJob = require('./jobs/subscription-renewal.job');
const webhookRoutes = require('./routes/webhook.routes');
const chatModule = require('./chat.module');

class MessagesModule {
    constructor(app, { taskService, taskWorker } = {}) {
        this.app = app;
        this.taskService = taskService;
        this.taskWorker = taskWorker;
        this.subscriptionRenewalJob = new SubscriptionRenewalJob();
    }

    registerRoutes() {
        // Registrar rotas do webhook
        this.app.use('/messages/webhooks', webhookRoutes);

        // Registrar módulo de chat (que inclui as rotas de teste)
        chatModule(this.app, {
            taskService: this.taskService,
            taskWorker: this.taskWorker
        });

        logger.info('Rotas do módulo de mensagens registradas', {
            routes: [
                '/messages/webhooks/graph/subscribe',
                '/messages/webhooks/graph/messages',
                '/messages/test/*'
            ]
        });
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

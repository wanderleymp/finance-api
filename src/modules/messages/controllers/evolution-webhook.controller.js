const { logger } = require('../../../middlewares/logger');
const EvolutionWebhookService = require('../services/evolution-webhook.service');

class EvolutionWebhookController {
    constructor() {
        this.evolutionWebhookService = new EvolutionWebhookService();
    }

    async handleStatusUpdate(req, res) {
        try {
            logger.info('Detalhes completos da requisição', { 
                body: req.body,
                headers: req.headers,
                query: req.query
            });

            // Extrair eventos do payload da Evolution API
            const events = req.body.data ? [req.body.data] : 
                           Array.isArray(req.body) ? req.body : 
                           [req.body];

            logger.info('Webhook recebido da Evolution API', { 
                eventCount: events.length,
                events 
            });

            const results = await this.evolutionWebhookService.updateMessageStatus(events);

            return res.status(200).json({ 
                message: 'Status atualizado com sucesso',
                updatedCount: results.length,
                results
            });
        } catch (error) {
            logger.error('Erro ao processar webhook da Evolution API', { 
                error: error.message,
                stack: error.stack
            });
            return res.status(500).json({ 
                message: 'Erro ao processar webhook',
                error: error.message 
            });
        }
    }
}

module.exports = EvolutionWebhookController;

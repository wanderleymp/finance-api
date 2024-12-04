const axios = require('axios');
const logger = require('../../config/logger');

class MessagingRepository {
    async sendInvoiceMessage(movement_id) {
        try {
            const response = await axios.post(
                'https://n8n.webhook.agilefinance.com.br/webhook/mensagem/faturamento', 
                { movement_id }
            );
            
            logger.info('Invoice message sent successfully', { 
                movement_id, 
                response_status: response.status 
            });

            return response.data;
        } catch (error) {
            logger.error('Error sending invoice message', { 
                movement_id, 
                error: error.message 
            });
            throw error;
        }
    }

    async sendInstallmentMessage(installment_id) {
        try {
            const response = await axios.post(
                'https://n8n.webhook.agilefinance.com.br/webhook/mensagem/parcela', 
                { installment_id }
            );
            
            logger.info('Installment message sent successfully', { 
                installment_id, 
                response_status: response.status 
            });

            return response.data;
        } catch (error) {
            logger.error('Error sending installment message', { 
                installment_id, 
                error: error.message 
            });
            throw error;
        }
    }
}

module.exports = new MessagingRepository();

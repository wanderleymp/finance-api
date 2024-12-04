const axios = require('axios');
const logger = require('../../config/logger');

class MessagingRepository {
    async sendInvoiceMessage(movement_id) {
        try {
            const response = await axios.post(
                'https://n8n.webhook.agilefinance.com.br/webhook/mensagem/faturamento', 
                { movement_id },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': 'ffcaa89a3e19bd98e911475c7974309b'
                    }
                }
            );
            
            logger.info('Invoice message sent successfully', { 
                movement_id, 
                response_status: response.status,
                response_data: response.data
            });

            return response.data;
        } catch (error) {
            logger.error('Error sending invoice message', { 
                movement_id, 
                error_message: error.message,
                error_response: error.response?.data,
                error_status: error.response?.status
            });
            throw error;
        }
    }

    async sendInstallmentMessage(installment_id) {
        try {
            const response = await axios.post(
                'https://n8n.webhook.agilefinance.com.br/webhook/mensagem/parcela', 
                { installment_id },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': 'ffcaa89a3e19bd98e911475c7974309b'
                    }
                }
            );
            
            logger.info('Installment message sent successfully', { 
                installment_id, 
                response_status: response.status,
                response_data: response.data
            });

            return response.data;
        } catch (error) {
            logger.error('Error sending installment message', { 
                installment_id, 
                error_message: error.message,
                error_response: error.response?.data,
                error_status: error.response?.status
            });
            throw error;
        }
    }
}

module.exports = new MessagingRepository();

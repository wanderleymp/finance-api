const messagingRepository = require('../repositories/messagingRepository');
const logger = require('../../config/logger');

class MessagingService {
    async sendInvoiceMessage(movement_id) {
        try {
            if (!movement_id) {
                throw new Error('Movement ID is required');
            }

            const result = await messagingRepository.sendInvoiceMessage(movement_id);
            
            return {
                success: true,
                message: 'Message sent successfully'
            };
        } catch (error) {
            logger.error('Error in sendInvoiceMessage', { 
                movement_id, 
                error_message: error.message,
                error_response: error.response?.data,
                error_status: error.response?.status,
                error_stack: error.stack
            });

            throw new Error('Unable to send message');
        }
    }

    async sendInstallmentMessage(installment_id) {
        try {
            console.log('DEBUG - Sending installment message in service', { installment_id });

            if (!installment_id) {
                throw new Error('Installment ID is required');
            }

            const result = await messagingRepository.sendInstallmentMessage(installment_id);
            
            console.log('DEBUG - Installment message result', { 
                installment_id, 
                result 
            });

            return {
                success: true,
                message: 'Message sent successfully'
            };
        } catch (error) {
            console.error('DEBUG - Error in sendInstallmentMessage service', { 
                installment_id, 
                error_message: error.message,
                error_stack: error.stack
            });

            logger.error('Error in sendInstallmentMessage', { 
                installment_id, 
                error_message: error.message,
                error_response: error.response?.data,
                error_status: error.response?.status
            });

            throw new Error('Unable to send message');
        }
    }
}

module.exports = new MessagingService();

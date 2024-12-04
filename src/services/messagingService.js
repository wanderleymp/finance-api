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
                message: 'Invoice message sent successfully',
                data: result
            };
        } catch (error) {
            logger.error('Error in sendInvoiceMessage', { 
                movement_id, 
                error: error.message 
            });

            return {
                success: false,
                message: 'Failed to send invoice message',
                error: error.message
            };
        }
    }

    async sendInstallmentMessage(installment_id) {
        try {
            if (!installment_id) {
                throw new Error('Installment ID is required');
            }

            const result = await messagingRepository.sendInstallmentMessage(installment_id);
            
            return {
                success: true,
                message: 'Installment message sent successfully',
                data: result
            };
        } catch (error) {
            logger.error('Error in sendInstallmentMessage', { 
                installment_id, 
                error: error.message 
            });

            return {
                success: false,
                message: 'Failed to send installment message',
                error: error.message
            };
        }
    }
}

module.exports = new MessagingService();

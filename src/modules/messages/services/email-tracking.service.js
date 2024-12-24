const { logger } = require('../../../middlewares/logger');
const EmailTrackingRepository = require('../repositories/email-tracking.repository');

class EmailTrackingService {
    constructor() {
        this.repository = new EmailTrackingRepository();
    }

    async createTracking(messageId, recipients, chatMessageId, metadata = {}) {
        try {
            const trackings = recipients.map(recipient => ({
                messageId,
                chatMessageId,
                recipientEmail: recipient.email,
                status: 'PENDING',
                metadata
            }));

            const results = await this.repository.createMany(trackings);

            logger.info('Email tracking criado com sucesso', {
                messageId,
                recipients: recipients.map(r => r.email),
                chatMessageId
            });

            return results;
        } catch (error) {
            logger.error('Erro ao criar email tracking', {
                error: error.message,
                messageId,
                recipients,
                chatMessageId
            });
            throw error;
        }
    }

    async updateStatus(messageId, recipientEmail, status, metadata = {}) {
        try {
            const result = await this.repository.updateStatus(
                messageId,
                recipientEmail,
                status,
                metadata
            );

            if (!result) {
                throw new Error('Tracking não encontrado');
            }

            logger.info('Status do email atualizado com sucesso', {
                messageId,
                recipientEmail,
                status,
                metadata
            });

            return result;
        } catch (error) {
            logger.error('Erro ao atualizar status do email', {
                error: error.message,
                messageId,
                recipientEmail,
                status
            });
            throw error;
        }
    }

    async getStatus(messageId, recipientEmail) {
        try {
            const result = await this.repository.findByMessageAndRecipient(
                messageId,
                recipientEmail
            );

            if (!result) {
                throw new Error('Tracking não encontrado');
            }

            return result;
        } catch (error) {
            logger.error('Erro ao buscar status do email', {
                error: error.message,
                messageId,
                recipientEmail
            });
            throw error;
        }
    }

    async findUnconfirmed(minutes = 30) {
        try {
            return await this.repository.findUnconfirmed(minutes);
        } catch (error) {
            logger.error('Erro ao buscar emails não confirmados', {
                error: error.message,
                minutes
            });
            throw error;
        }
    }
}

module.exports = EmailTrackingService;

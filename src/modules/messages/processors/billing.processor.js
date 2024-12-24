const BaseProcessor = require('../../tasks/processors/base.processor');
const BillingMessageTemplate = require('../templates/billing.template');
const { logger } = require('../../../middlewares/logger');

class BillingMessageProcessor extends BaseProcessor {
    constructor(taskService, messageService) {
        super(taskService);
        this.messageService = messageService;
    }

    getTaskType() {
        return 'BILLING_MESSAGE';
    }

    async validatePayload(payload) {
        if (!payload.personId) {
            throw new Error('personId é obrigatório');
        }
        if (!payload.billingData) {
            throw new Error('billingData é obrigatório');
        }

        // Valida dados do template
        BillingMessageTemplate.validate(payload.billingData);
    }

    async process(task) {
        const { personId, billingData, channel = 'email' } = task.payload;
        
        try {
            // Gera conteúdo da mensagem
            const content = BillingMessageTemplate.generate(billingData);

            // Cria ou recupera chat
            const chat = await this.messageService.findOrCreateChat(personId);

            // Cria mensagem
            const message = await this.messageService.createMessage({
                chatId: chat.chat_id,
                direction: 'OUTBOUND',
                content,
                metadata: {
                    type: 'BILLING',
                    invoiceNumber: billingData.invoiceNumber,
                    amount: billingData.amount,
                    dueDate: billingData.dueDate
                }
            });

            // Envia mensagem
            await this.messageService.sendMessage(message, channel);

            // Atualiza status
            await this.updateTaskStatus(task.task_id, 'completed');

            logger.info('Mensagem de faturamento enviada com sucesso', {
                taskId: task.task_id,
                messageId: message.message_id,
                personId,
                invoiceNumber: billingData.invoiceNumber
            });

            return message;
        } catch (error) {
            logger.error('Erro ao processar mensagem de faturamento', {
                taskId: task.task_id,
                error: error.message,
                payload: task.payload
            });
            
            await this.handleFailure(task, error);
            throw error;
        }
    }
}

module.exports = BillingMessageProcessor;

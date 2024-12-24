const BaseProcessor = require('./base.processor');
const { logger } = require('../../../middlewares/logger');

class MessageProcessor extends BaseProcessor {
    constructor(taskService, messageService) {
        super(taskService);
        this.messageService = messageService;
    }

    getTaskType() {
        return 'MESSAGE';
    }

    async validatePayload(payload) {
        if (!payload.message_id) {
            throw new Error('message_id é obrigatório');
        }
        if (!payload.channel) {
            throw new Error('channel é obrigatório');
        }
    }

    async process(task) {
        const { message_id, channel } = task.payload;
        
        try {
            // Buscar mensagem
            const message = await this.messageService.getMessageById(message_id);
            if (!message) {
                throw new Error(`Mensagem ${message_id} não encontrada`);
            }

            // Validar canal
            if (!this.messageService.isChannelAvailable(channel)) {
                throw new Error(`Canal ${channel} não disponível`);
            }

            // Enviar mensagem
            const result = await this.messageService.sendMessage(message, channel);

            // Atualizar status
            await this.updateTaskStatus(task.task_id, 'completed');

            logger.info('Mensagem enviada com sucesso', {
                taskId: task.task_id,
                messageId: message_id,
                channel
            });

            return result;
        } catch (error) {
            // Registrar erro
            await this.handleFailure(task, error);
            
            // Propagar erro
            throw error;
        }
    }

    async handleFailure(task, error) {
        await super.handleFailure(task, error);
        
        // Atualizar status da mensagem
        await this.messageService.markAsFailed(
            task.payload.message_id,
            error.message
        );

        // Notificar erro crítico se necessário
        if (this.isErrorCritical(error)) {
            await this.messageService.notifyError({
                type: 'MESSAGE_DELIVERY_FAILED',
                messageId: task.payload.message_id,
                channel: task.payload.channel,
                error: error.message
            });
        }
    }

    async canRetry(task) {
        // Não tentar novamente se mensagem não existe ou canal inválido
        if (error.message.includes('não encontrada') ||
            error.message.includes('não disponível')) {
            return false;
        }

        // Para erros de rede ou temporários, tentar mais vezes
        if (this.isTemporaryError(error)) {
            return task.retries < (task.max_retries * 2);
        }

        // Para outros erros, seguir padrão
        return task.retries < task.max_retries;
    }

    isTemporaryError(error) {
        const temporaryErrors = [
            'ETIMEDOUT',
            'ECONNRESET',
            'ECONNREFUSED',
            'rate limit',
            'timeout',
            'socket hang up'
        ];
        
        return temporaryErrors.some(e => 
            error.message.toLowerCase().includes(e.toLowerCase())
        );
    }

    isErrorCritical(error) {
        const criticalErrors = [
            'authentication failed',
            'invalid credentials',
            'account suspended',
            'channel not found'
        ];

        return criticalErrors.some(e => 
            error.message.toLowerCase().includes(e.toLowerCase())
        );
    }
}

module.exports = MessageProcessor;

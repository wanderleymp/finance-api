const { logger } = require('../../../middlewares/logger');
const MicrosoftGraphProvider = require('../providers/microsoft-graph.provider');
const BaseProcessor = require('../../tasks/processors/base.processor');

class EmailProcessor extends BaseProcessor {
    constructor(taskService) {
        super(taskService);
        this.emailProvider = new MicrosoftGraphProvider();
    }

    getTaskType() {
        return 'email';  
    }

    async validatePayload(payload) {
        if (!payload.to) {
            throw new Error('Campo "to" é obrigatório');
        }
        if (!payload.subject) {
            throw new Error('Campo "subject" é obrigatório');
        }
        if (!payload.content) {
            throw new Error('Campo "content" é obrigatório');
        }
    }

    async process(task) {
        const { to, subject, content, metadata = {} } = task.payload;
        
        try {
            // Valida payload
            await this.validatePayload(task.payload);

            // Envia o email
            await this.emailProvider.sendEmail(
                to,
                subject,
                content,
                { ...metadata, taskId: task.task_id }
            );

            // Atualiza status da task
            await this.updateTaskStatus(task.task_id, 'completed');

            logger.info('Email processado com sucesso', {
                taskId: task.task_id,
                to,
                subject,
                metadata
            });

            return {
                success: true,
                message: 'Email enviado com sucesso',
                details: {
                    to,
                    subject,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            logger.error('Erro ao processar email', {
                taskId: task.task_id,
                error: error.message,
                stack: error.stack,
                code: error.code,
                statusCode: error.statusCode,
                to,
                subject
            });

            // Atualiza status com erro
            await this.updateTaskStatus(task.task_id, 'failed', error.message);
            throw error;
        }
    }

    async handleFailure(task, error) {
        logger.error('Falha no processamento de email', {
            taskId: task.task_id,
            error: error.message,
            payload: task.payload
        });

        // Se o erro for de autenticação ou permissão, não tenta novamente
        if (error.code === 'ErrorAccessDenied' || error.code === 'AuthenticationRequiredError') {
            return false;
        }

        return true;
    }
}

module.exports = EmailProcessor;

const BaseProcessor = require('../../tasks/processors/base.processor');
const MicrosoftGraphProvider = require('../providers/microsoft-graph.provider');
const { logger } = require('../../../middlewares/logger');

class EmailProcessor extends BaseProcessor {
    constructor(taskService) {
        super(taskService);
        this.emailProvider = new MicrosoftGraphProvider();
    }

    getTaskType() {
        return 'EMAIL';
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
            // Formata o conteúdo em HTML
            const htmlContent = this.emailProvider.formatHtmlContent(content);
            
            // Envia o email
            await this.emailProvider.sendEmail(to, subject, htmlContent, metadata);

            // Atualiza status da task
            await this.updateTaskStatus(task.task_id, 'completed');

            logger.info('Email processado com sucesso', {
                taskId: task.task_id,
                to,
                subject,
                metadata
            });
        } catch (error) {
            logger.error('Erro ao processar email', {
                taskId: task.task_id,
                error: error.message,
                to,
                subject
            });
            
            // Atualiza status com erro
            await this.updateTaskStatus(task.task_id, 'failed', error.message);
            throw error;
        }
    }
}

module.exports = EmailProcessor;

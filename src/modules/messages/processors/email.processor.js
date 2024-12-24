const { logger } = require('../../../middlewares/logger');
const MicrosoftGraphProvider = require('../providers/microsoft-graph.provider');
const BaseProcessor = require('../../tasks/processors/base.processor');
const ChatService = require('../chat.service');

class EmailProcessor extends BaseProcessor {
    constructor(taskService) {
        super(taskService);
        this.emailProvider = new MicrosoftGraphProvider();
        this.chatService = new ChatService();
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
            await this.emailProvider.sendMail(
                to,
                subject,
                content,
                { ...metadata, taskId: task.task_id }
            );

            // Registra no chat
            const mainRecipient = to[0]; // Primeiro destinatário é o principal
            const otherRecipients = to.slice(1); // Outros destinatários são participantes

            // Cria ou encontra o chat com todos os participantes
            const chat = await this.chatService.findOrCreateChat(
                mainRecipient.person_contact_id,
                otherRecipients.map(recipient => ({
                    person_contact_id: recipient.person_contact_id,
                    role: 'PARTICIPANT'
                }))
            );
            
            // Conteúdo formatado do email
            const emailContent = {
                type: 'email',
                subject: subject,
                content: content,
                to: to.map(recipient => ({
                    email: recipient.email,
                    person_contact_id: recipient.person_contact_id
                })),
                metadata: {
                    taskId: task.task_id,
                    type: 'SYSTEM'
                }
            };

            // Registra a mensagem no chat
            await this.chatService.sendMessage(
                chat.chat_id,
                JSON.stringify(emailContent),
                { type: 'EMAIL', taskId: task.task_id },
                'OUTBOUND'
            );

            logger.info('Email processado com sucesso', {
                taskId: task.task_id,
                to,
                subject,
                metadata
            });

            // Atualiza status da task
            await this.updateTaskStatus(task.task_id, 'completed');

            return {
                success: true,
                message: 'Email enviado com sucesso',
                data: {
                    taskId: task.task_id,
                    to,
                    subject
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

            // Atualiza status da task
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

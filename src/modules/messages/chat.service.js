const { logger } = require('../../middlewares/logger');
const ChatRepository = require('./chat.repository');
const ChatParticipantRepository = require('./chat-participant.repository');
const TaskService = require('../tasks/task.service');
const TaskRepository = require('../tasks/repositories/task.repository');
const TaskLogsService = require('../tasklogs/tasklogs.service');
const TaskDependenciesService = require('../taskdependencies/taskdependencies.service');
const TaskTypesRepository = require('../tasks/repositories/task-types.repository');

class ChatService {
    constructor() {
        this.chatRepository = new ChatRepository();
        this.chatParticipantRepository = new ChatParticipantRepository();
        this.taskService = new TaskService({ 
            taskRepository: new TaskRepository(),
            taskLogsService: new TaskLogsService(),
            taskDependenciesService: new TaskDependenciesService(),
            taskTypesRepository: new TaskTypesRepository()
        });
    }

    async findOrCreateChat(personId, participants = []) {
        try {
            // Tenta encontrar chat existente
            let chat = await this.chatRepository.findChatByPerson(personId);
            
            // Se não existir, cria novo
            if (!chat) {
                chat = await this.chatRepository.createChat(personId);
                logger.info('Novo chat criado', { personId, chatId: chat.chat_id });

                // Adiciona o dono do chat como participante
                await this.chatParticipantRepository.create({
                    chat_id: chat.chat_id,
                    person_contact_id: personId,
                    role: 'OWNER'
                });

                // Adiciona outros participantes se houver
                for (const participant of participants) {
                    await this.chatParticipantRepository.create({
                        chat_id: chat.chat_id,
                        person_contact_id: participant.person_contact_id,
                        role: participant.role || 'PARTICIPANT'
                    });
                }
            }

            return chat;
        } catch (error) {
            logger.error('Erro ao buscar/criar chat', { error: error.message, personId });
            throw error;
        }
    }

    async addParticipant(chatId, personContactId, role = 'PARTICIPANT') {
        try {
            return await this.chatParticipantRepository.create({
                chat_id: chatId,
                person_contact_id: personContactId,
                role
            });
        } catch (error) {
            logger.error('Erro ao adicionar participante', { 
                error: error.message, 
                chatId, 
                personContactId 
            });
            throw error;
        }
    }

    async removeParticipant(chatId, personContactId) {
        try {
            return await this.chatParticipantRepository.delete(chatId, personContactId);
        } catch (error) {
            logger.error('Erro ao remover participante', { 
                error: error.message, 
                chatId, 
                personContactId 
            });
            throw error;
        }
    }

    async getChatParticipants(chatId) {
        try {
            return await this.chatParticipantRepository.findByChatId(chatId);
        } catch (error) {
            logger.error('Erro ao buscar participantes', { 
                error: error.message, 
                chatId 
            });
            throw error;
        }
    }

    async sendMessage(chatId, content, metadata = {}, direction = 'OUTBOUND') {
        try {
            // Cria a mensagem
            const message = await this.chatRepository.createMessage(chatId, direction, content, metadata);
            
            // Atualiza última mensagem do chat
            await this.chatRepository.updateChatLastMessage(chatId, message.message_id);
            
            // Se a mensagem veio do EmailProcessor, não cria nova task
            if (metadata.type === 'EMAIL' && metadata.taskId) {
                return message;
            }

            // Busca participantes do chat
            const participants = await this.chatParticipantRepository.findByChatId(chatId);
            if (!participants || participants.length === 0) {
                throw new Error('Chat não tem participantes');
            }

            // Cria task para envio
            await this.taskService.create({
                type: 'email',
                name: `Enviar mensagem #${message.message_id} do chat #${chatId}`,
                priority: 1,
                payload: {
                    to: participants.map(p => ({ 
                        email: p.email,
                        person_contact_id: p.person_contact_id 
                    })),
                    subject: 'Nova mensagem no chat',
                    content: content,
                    metadata: {
                        messageId: message.message_id,
                        chatId,
                        ...metadata
                    }
                }
            });

            return message;
        } catch (error) {
            logger.error('Erro ao enviar mensagem', { error: error.message, chatId });
            throw error;
        }
    }

    async getMessages(chatId, page = 1, limit = 20) {
        try {
            return await this.chatRepository.findMessagesByChat(chatId, page, limit);
        } catch (error) {
            logger.error('Erro ao buscar mensagens', { error: error.message, chatId });
            throw error;
        }
    }

    async updateMessageStatus(messageId, status) {
        try {
            return await this.chatRepository.updateMessageStatus(messageId, status);
        } catch (error) {
            logger.error('Erro ao atualizar status da mensagem', { 
                error: error.message, 
                messageId, 
                status 
            });
            throw error;
        }
    }

    // Método específico para enviar mensagem de faturamento
    async sendBillingMessage(personId, billingData) {
        try {
            // Encontra ou cria chat
            const chat = await this.findOrCreateChat(personId);
            
            // Cria task específica para mensagem de faturamento
            await this.taskService.create({
                type: 'email',
                name: `Enviar fatura #${billingData.invoiceNumber} para ${billingData.personName}`,
                priority: 1,
                payload: {
                    to: billingData.email,
                    subject: `Fatura #${billingData.invoiceNumber}`,
                    content: `Olá ${billingData.personName},

Sua fatura #${billingData.invoiceNumber} foi gerada:

Valor: ${billingData.amount}
Vencimento: ${billingData.dueDate}
Documento: ${billingData.documentNumber}

Para pagar agora, acesse: ${billingData.paymentLink}

Caso já tenha efetuado o pagamento, por favor desconsidere esta mensagem.

Atenciosamente,
Agile Finance`,
                    metadata: {
                        type: 'BILLING',
                        invoiceId: billingData.invoiceId
                    }
                }
            });
        } catch (error) {
            logger.error('Erro ao enviar mensagem de faturamento', { 
                error: error.message, 
                personId, 
                billingData 
            });
            throw error;
        }
    }
}

module.exports = ChatService;

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
                chat = await this.chatRepository.createChat();
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

    async getMessages(chatId, page = 1, limit = 20) {
        try {
            logger.info('Buscando mensagens do chat', { chatId, page, limit });
            const messages = await this.chatRepository.findMessagesByChat(chatId, page, limit);
            logger.info('Mensagens encontradas', { count: messages.items.length });
            return messages;
        } catch (error) {
            logger.error('Erro ao buscar mensagens', { error: error.message, chatId });
            throw error;
        }
    }

    async sendMessage(chatId, content, metadata = {}) {
        try {
            logger.info('Enviando mensagem', { chatId, metadata });
            
            // Cria a mensagem
            const message = await this.chatRepository.createMessage(chatId, 'OUTBOUND', content, metadata);
            
            // Atualiza última mensagem do chat
            await this.chatRepository.updateChatLastMessage(chatId, message.message_id);
            
            logger.info('Mensagem enviada com sucesso', { 
                messageId: message.message_id,
                chatId: message.chat_id 
            });
            
            return message;
        } catch (error) {
            logger.error('Erro ao enviar mensagem', { error: error.message, chatId });
            throw error;
        }
    }

    async sendBillingMessage(personId, billingData) {
        try {
            logger.info('Enviando mensagem de faturamento', { personId });

            // Encontra ou cria chat para a pessoa
            const chat = await this.findOrCreateChat(personId);

            // Prepara mensagem
            const content = `Nova fatura disponível:\n${billingData.description}\nValor: R$ ${billingData.amount}`;
            const metadata = {
                type: 'BILLING',
                data: billingData
            };

            // Cria task para enviar email
            await this.taskService.create({
                name: `Enviar email de faturamento para ${personId}`,
                type: 'SEND_EMAIL',
                payload: {
                    to: billingData.email,
                    subject: 'Nova fatura disponível',
                    content: content
                }
            });

            // Envia mensagem no chat
            await this.sendMessage(chat.chat_id, content, metadata);

            logger.info('Mensagem de faturamento enviada com sucesso', { personId });
        } catch (error) {
            logger.error('Erro ao enviar mensagem de faturamento', { error: error.message, personId });
            throw error;
        }
    }

    async findAll(page = 1, limit = 20, filters = {}) {
        try {
            logger.info('Buscando chats', { page, limit, filters });
            const result = await this.chatRepository.findAll(filters, page, limit);
            logger.info('Chats encontrados', { count: result.items.length });
            return result;
        } catch (error) {
            logger.error('Erro ao listar chats', {
                error: error.message,
                stack: error.stack,
                page,
                limit,
                filters
            });
            throw error;
        }
    }
}

module.exports = ChatService;

const { logger } = require('../../middlewares/logger');
const ChatRepository = require('./chat.repository');
const ChatParticipantRepository = require('./chat-participant.repository');
const ChatMessageService = require('./chat-message.service');
const TaskService = require('../tasks/task.service');
const TaskRepository = require('../tasks/repositories/task.repository');
const TaskLogsService = require('../tasklogs/tasklogs.service');
const TaskDependenciesService = require('../taskdependencies/taskdependencies.service');
const TaskTypesRepository = require('../tasks/repositories/task-types.repository');

class ChatService {
    constructor() {
        this.chatRepository = new ChatRepository();
        this.chatParticipantRepository = new ChatParticipantRepository();
        this.chatMessageService = new ChatMessageService();
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
            
            // Cria a mensagem usando o novo serviço
            const message = await this.chatMessageService.createMessage(chatId, {
                content,
                metadata,
                direction: 'OUTBOUND'
            });
            
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
            
            const chats = await this.chatRepository.findAll(filters, page, limit);
            
            logger.info('Chats encontrados', { 
                count: chats.items.length,
                total: chats.meta.totalItems
            });
            
            return chats;
        } catch (error) {
            logger.error('Erro ao buscar chats', { error: error.message, filters });
            throw error;
        }
    }

    async receiveMessage(personContactId, content, metadata = {}, direction = 'INBOUND') {
        try {
            logger.info('Processando mensagem recebida', { personContactId, direction });

            // Encontra ou cria chat para a pessoa
            const chat = await this.findOrCreateChat(personContactId);

            // Adiciona metadados padrão se não existirem
            const processedMetadata = {
                ...metadata,
                receivedAt: new Date().toISOString(),
                source: metadata.source || 'EXTERNAL'
            };

            // Cria a mensagem no chat usando o novo serviço
            const message = await this.chatMessageService.createMessage(
                chat.chat_id, 
                {
                    content, 
                    metadata: processedMetadata,
                    direction
                }
            );

            // Atualiza status do chat para pendente, se necessário
            if (chat.status !== 'PENDING') {
                await this.chatRepository.update(chat.chat_id, { 
                    status: 'PENDING' 
                });
            }

            logger.info('Mensagem recebida processada com sucesso', { 
                messageId: message.message_id,
                chatId: chat.chat_id
            });

            return message;
        } catch (error) {
            logger.error('Erro ao processar mensagem recebida', { 
                error: error.message,
                personContactId,
                direction
            });
            throw error;
        }
    }

    async findChatHistory(chatId, page = 1, limit = 20) {
        try {
            const query = `
                SELECT 
                    m.message_id,
                    m.content,
                    m.created_at,
                    m.direction,
                    m.status,
                    
                    s.person_id as sender_id,
                    s.name as sender_name,
                    s.avatar_url as sender_avatar,
                    
                    c.contact_id,
                    c.contact_value as sender_contact,
                    
                    ch.chat_id,
                    ch.channel_id,
                    ch.created_at as chat_created_at
                FROM chat_messages m
                LEFT JOIN persons s ON m.sender_id = s.person_id
                LEFT JOIN contacts c ON s.person_id = c.person_id
                LEFT JOIN chats ch ON m.chat_id = ch.chat_id
                WHERE m.chat_id = $1
                ORDER BY m.created_at ASC
                LIMIT $2 OFFSET $3
            `;

            const queryParams = [
                chatId,
                limit,
                (page - 1) * limit
            ];

            const result = await this.chatRepository.query(query, queryParams);

            // Transformar resultado para formato mais amigável
            const messagesWithDetails = result.rows.map(message => ({
                messageId: message.message_id,
                content: message.content,
                createdAt: message.created_at,
                direction: message.direction,
                status: message.status,
                sender: {
                    id: message.sender_id,
                    name: message.sender_name,
                    avatarUrl: message.sender_avatar,
                    contact: message.sender_contact
                },
                chat: {
                    id: message.chat_id,
                    channelId: message.channel_id,
                    createdAt: message.chat_created_at
                }
            }));

            // Contar total de mensagens para paginação
            const countQuery = `
                SELECT COUNT(*) as total
                FROM chat_messages
                WHERE chat_id = $1
            `;

            const countResult = await this.chatRepository.query(countQuery, [chatId]);

            const totalItems = parseInt(countResult.rows[0].total);

            return {
                items: messagesWithDetails,
                meta: {
                    totalItems,
                    itemCount: messagesWithDetails.length,
                    itemsPerPage: limit,
                    totalPages: Math.ceil(totalItems / limit),
                    currentPage: page
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar histórico do chat', { 
                error: error.message,
                chatId,
                page,
                limit
            });
            throw error;
        }
    }

    async findChatsWithDetails(page = 1, limit = 20, filters = {}) {
        try {
            const query = `
                WITH chat_details AS (
                    SELECT 
                        c.chat_id,
                        c.channel_id,
                        c.created_at as chat_created_at,
                        c.last_message_id,
                        
                        ch.name as channel_name,
                        
                        m.message_id as last_message_id,
                        m.content as last_message_content,
                        m.created_at as last_message_date,
                        m.direction as last_message_direction,
                        m.status as last_message_status,
                        
                        cont.contact_id,
                        cont.contact_value as contact_phone,
                        cont.contact_name,
                        
                        p.person_id,
                        p.name as person_name,
                        p.avatar_url,
                        
                        (SELECT COUNT(*) 
                         FROM chat_messages unread 
                         WHERE unread.chat_id = c.chat_id 
                         AND unread.status = 'UNREAD') as unread_messages_count,
                        
                        ROW_NUMBER() OVER (PARTITION BY c.chat_id ORDER BY m.created_at DESC) as row_num
                    FROM chats c
                    LEFT JOIN channels ch ON c.channel_id = ch.channel_id
                    LEFT JOIN chat_messages m ON c.last_message_id = m.message_id
                    LEFT JOIN chat_participants cp ON c.chat_id = cp.chat_id
                    LEFT JOIN person_contacts pc ON cp.person_contact_id = pc.person_contact_id
                    LEFT JOIN contacts cont ON pc.contact_id = cont.contact_id
                    LEFT JOIN persons p ON pc.person_id = p.person_id
                    WHERE 1=1
                    ${filters.personId ? 'AND cp.person_id = $1' : ''}
                    ${filters.channelId ? `AND c.channel_id = $${filters.personId ? 2 : 1}` : ''}
                )
                SELECT * 
                FROM chat_details 
                WHERE row_num = 1
                ORDER BY last_message_date DESC
                LIMIT $${filters.personId && filters.channelId ? 3 : filters.personId || filters.channelId ? 2 : 1} 
                OFFSET $${filters.personId && filters.channelId ? 4 : filters.personId || filters.channelId ? 3 : 2}
            `;

            const queryParams = [
                ...(filters.personId ? [filters.personId] : []),
                ...(filters.channelId ? [filters.channelId] : []),
                limit,
                (page - 1) * limit
            ];

            const result = await this.chatRepository.query(query, queryParams);

            // Transformar resultado para formato mais amigável
            const chatsWithDetails = result.rows.map(chat => ({
                chatId: chat.chat_id,
                channel: {
                    id: chat.channel_id,
                    name: chat.channel_name
                },
                createdAt: chat.chat_created_at,
                lastMessage: chat.last_message_id ? {
                    id: chat.last_message_id,
                    content: chat.last_message_content,
                    date: chat.last_message_date,
                    direction: chat.last_message_direction,
                    status: chat.last_message_status
                } : null,
                contact: {
                    id: chat.contact_id,
                    name: chat.contact_name,
                    phone: chat.contact_phone
                },
                person: {
                    id: chat.person_id,
                    name: chat.person_name,
                    avatarUrl: chat.avatar_url
                },
                unreadMessagesCount: chat.unread_messages_count
            }));

            // Contar total de chats para paginação
            const countQuery = `
                SELECT COUNT(DISTINCT c.chat_id) as total
                FROM chats c
                LEFT JOIN chat_participants cp ON c.chat_id = cp.chat_id
                WHERE 1=1
                ${filters.personId ? 'AND cp.person_id = $1' : ''}
                ${filters.channelId ? `AND c.channel_id = $${filters.personId ? 2 : 1}` : ''}
            `;

            const countResult = await this.chatRepository.query(countQuery, 
                queryParams.slice(0, filters.personId && filters.channelId ? 2 : filters.personId || filters.channelId ? 1 : 0)
            );

            const totalItems = parseInt(countResult.rows[0].total);

            return {
                items: chatsWithDetails,
                meta: {
                    totalItems,
                    itemCount: chatsWithDetails.length,
                    itemsPerPage: limit,
                    totalPages: Math.ceil(totalItems / limit),
                    currentPage: page
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar chats com detalhes', { 
                error: error.message,
                page,
                limit,
                filters
            });
            throw error;
        }
    }
}

module.exports = ChatService;

const { logger } = require('../../middlewares/logger');
const ChatRepository = require('./chat.repository');
const ChatMessageRepository = require('../messages/chat-message.repository');
const ContactRepository = require('../contacts/contact.repository');
const { validate } = require('class-validator');
const { plainToClass } = require('class-transformer');
const { CreateChatMessageDto } = require('../messages/dtos/create-chat-message.dto');
const ChannelService = require('../channels/channel.service');
const IntegrationService = require('../integrations/integration.service');

class ChatService {
    constructor() {
        this.chatRepository = new ChatRepository();
        this.chatMessageRepository = new ChatMessageRepository();
        this.contactRepository = new ContactRepository();
        this.channelService = new ChannelService();
        this.integrationService = new IntegrationService();
        this.logger = logger;
    }

    async create(data) {
        const transaction = await this.chatRepository.transaction(async (client) => {
            try {
                logger.info('Iniciando criação de mensagem', { 
                    data,
                    chatId: data.chatId
                });

                // 1. Validar e obter informações do chat
                const chatDetails = await this.chatRepository.findById(data.chatId);
                
                logger.info('Detalhes do Chat', { 
                    chatDetails: JSON.stringify(chatDetails),
                    channelId: chatDetails?.channel_id,
                    typeOfChannelId: typeof chatDetails?.channel_id
                });

                if (!chatDetails) {
                    throw new Error(`Chat ${data.chatId} não encontrado`);
                }

                // Validar contact_id
                if (!data.contact_id) {
                    throw new Error('contact_id é obrigatório para enviar mensagem');
                }

                // 2. Extrair channel_id do chat
                const channelId = chatDetails.channel_id;
                
                logger.info('Channel ID Extraído', {
                    channelId,
                    isNull: channelId === null,
                    isUndefined: channelId === undefined,
                    type: typeof channelId
                });

                if (channelId === null || channelId === undefined) {
                    throw new Error(`Nenhum canal associado ao chat ${data.chatId}`);
                }

                // 3. Buscar detalhes completos do canal
                const channel = await this.channelService.findById(channelId);
                if (!channel) {
                    const error = new Error('Canal não encontrado');
                    error.statusCode = 404;
                    throw error;
                }

                // 4. Configurar Evolution Provider
                const evolutionProvider = await this.integrationService.createProvider(channelId);

                // 5. Preparar metadados
                const config = await this.integrationService.getChannelConfig(channelId);
                
                const metadata = {
                    instance: config.instance,
                    server_url: config.server_url,
                    apikey: config.apikey,
                    channel_name: channel.channel_name
                };

                // 6. Buscar contato
                const contact = await this.contactRepository.findById(data.contact_id);
                if (!contact || !contact.value) {
                    throw new Error(`Contato ${data.contact_id} não encontrado ou sem número`)
                }

                // 7. Preparar dados da mensagem para createMessage
                const messageData = {
                    chat_id: data.chatId,
                    contact_id: data.contact_id,
                    direction: 'OUTBOUND',
                    content: data.content,
                    content_type: data.contentType,
                    status: {
                        type: 'PENDING',
                        timestamp: new Date().toISOString()
                    },
                    metadata: metadata,
                    sent_at: new Date().toISOString(),
                    delivered_at: null
                };

                // 8. Criar mensagem usando createMessage
                const createdMessage = await this.chatMessageRepository.createMessage(messageData);

                try {
                    // 9. Enviar via provider
                    const response = await evolutionProvider.send({
                        number: contact.value,
                        text: data.content,
                        delay: 1200,
                        linkPreview: true
                    });

                    logger.info('Resposta da Evolution API', { response });

                    // 10. Atualizar status da mensagem para enviada
                    const externalId = response?.messageId || response?.providerResponse?.key?.id;
                    
                    // Debug do createdMessage
                    logger.info('Debug createdMessage', {
                        createdMessage: JSON.stringify(createdMessage),
                        messageId: createdMessage?.message_id,
                        messageIdType: typeof createdMessage?.message_id,
                        hasMessageId: createdMessage?.hasOwnProperty('message_id')
                    });
                    
                    const client = await this.chatMessageRepository.pool.connect();
                    try {
                        const updateQuery = `
                            UPDATE chat_messages
                            SET 
                                external_id = $1,
                                status = $2,
                                sent_at = $3
                            WHERE message_id = $4
                            RETURNING *
                        `;
                        const updateValues = [
                            externalId,
                            JSON.stringify({
                                type: response?.status || 'SENT',
                                timestamp: new Date().toISOString()
                            }),
                            new Date(),
                            createdMessage.message_id
                        ];

                        const result = await client.query(updateQuery, updateValues);
                        const updatedMessage = result.rows[0];

                        logger.info('Mensagem atualizada com sucesso', { 
                            messageId: updatedMessage.message_id,
                            externalId: updatedMessage.external_id,
                            status: updatedMessage.status
                        });
                    } catch (error) {
                        logger.error('Erro ao atualizar mensagem', {
                            error: error.message,
                            messageId: createdMessage.chat_message_id,
                            externalId
                        });
                        throw error;
                    } finally {
                        client.release();
                    }

                    logger.info('Mensagem criada com sucesso', { 
                        messageId: createdMessage.chat_message_id,
                        externalId: response?.messageId || response?.providerResponse?.key?.id
                    });
                } catch (error) {
                    // Se falhar o envio, atualizar status da mensagem para erro
                    await this.chatMessageRepository.update(
                        createdMessage.chat_message_id,
                        {
                            status: {
                                type: 'FAILED',
                                timestamp: new Date().toISOString(),
                                details: error.message
                            },
                            sent_at: null
                        }
                    );
                    throw error;
                }

                return createdMessage;

            } catch (error) {
                logger.error('Erro no processo de criação de mensagem', { 
                    error: error.message,
                    stack: error.stack,
                    data
                });
                throw error;
            }
        });

        return transaction;
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
            logger.error('Erro ao buscar chats', { 
                error: error.message, 
                page, 
                limit, 
                filters 
            });
            throw error;
        }
    }

    async findById(id, page = 1, limit = 20) {
        try {
            logger.info('Buscando chat por ID', { id, page, limit });
            
            const chat = await this.chatRepository.findById(id, page, limit);
            
            if (!chat) {
                logger.warn('Chat não encontrado', { id });
                return null;
            }
            
            logger.info('Chat encontrado com sucesso', { 
                chatId: id,
                messagesCount: chat.messages?.length || 0
            });
            
            return chat;
        } catch (error) {
            logger.error('Erro ao buscar chat por ID', { 
                error: error.message, 
                id,
                page,
                limit
            });
            throw error;
        }
    }
}

module.exports = ChatService;

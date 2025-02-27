const { logger } = require('../../middlewares/logger');
const ChatRepository = require('../chat/chat.repository');
const ContactRepository = require('../contacts/contact.repository');
const PersonContactRepository = require('../person-contacts/person-contact.repository');
const ChatMessageRepository = require('./chat-message.repository');
const ChatParticipantRepository = require('./chat-participant.repository');
const PersonRepository = require('../persons/person.repository');
const ChannelRepository = require('../channels/channel.repository');
const ChatMessageStatusRepository = require('../chat-message-status/chat-message-status.repository');
const { validate } = require('class-validator');
const { plainToClass } = require('class-transformer');
const { CreateChatMessageDto } = require('./dtos/create-chat-message.dto');

const MESSAGE_STATUS = {
    PENDING: 'PENDING',
    SENT: 'SENT',
    DELIVERED: 'DELIVERED',
    READ: 'READ',
    FAILED: 'FAILED',
    DELIVERY_ACK: 'DELIVERY_ACK'
};

class ChatMessageService {
    constructor() {
        this.contactRepository = new ContactRepository();
        this.personContactRepository = new PersonContactRepository();
        this.chatMessageRepository = new ChatMessageRepository();
        this.chatRepository = new ChatRepository();
        this.chatParticipantRepository = new ChatParticipantRepository();
        this.personRepository = new PersonRepository();
        this.channelRepository = new ChannelRepository();
        this.chatMessageStatusRepository = new ChatMessageStatusRepository();
        this.logger = logger;

        this.channelMap = {
            'zapEsc': 1,
            'whatsapp': 2,
            'telegram': 3,
            'email': 4
        };
    }

    getChannelId(channelName) {
        if (!isNaN(channelName)) return Number(channelName);

        return this.channelMap[channelName] || 1;
    }
    
    /**
     * Encontra ou cria um chat e contato com base no número de telefone
     * @param {string} phoneNumber - Número de telefone
     * @param {string} instance - Nome da instância
     * @param {string} serverUrl - URL do servidor
     * @param {string} apikey - Chave da API
     * @returns {Promise<{chat: Object, contact: Object}>} - Objeto contendo chat e contato
     */
    async findOrCreateChatByPhone(phoneNumber, instance, serverUrl, apikey) {
        try {
            this.logger.info('Buscando ou criando chat por telefone', { 
                phoneNumber, 
                instance 
            });
            
            // 1. Buscar ou criar contato
            let contact = await this.contactRepository.findByValue(phoneNumber);
            
            if (!contact) {
                this.logger.info('Contato não encontrado, criando novo', { phoneNumber });
                
                contact = await this.contactRepository.create({
                    type: 'PHONE',
                    value: phoneNumber,
                    name: `Contato ${phoneNumber}`,
                    is_active: true
                });
                
                this.logger.info('Novo contato criado', { 
                    contactId: contact.contact_id,
                    phoneNumber
                });
            }
            
            // 2. Buscar canal pelo nome da instância
            let channel = await this.channelRepository.findByName(instance);
            
            if (!channel) {
                this.logger.info('Canal não encontrado, criando novo', { instance });
                
                channel = await this.channelRepository.create({
                    channel_name: instance,
                    channel_type: 'WHATSAPP',
                    is_active: true,
                    config: {
                        instance,
                        server_url: serverUrl,
                        apikey
                    }
                });
                
                this.logger.info('Novo canal criado', { 
                    channelId: channel.channel_id,
                    instance
                });
            }
            
            // 3. Buscar chat existente para esse contato e canal
            let chat = await this.chatRepository.findByContactAndChannel(
                contact.contact_id,
                channel.channel_id
            );
            
            if (!chat) {
                this.logger.info('Chat não encontrado, criando novo', { 
                    contactId: contact.contact_id,
                    channelId: channel.channel_id
                });
                
                chat = await this.chatRepository.create({
                    contact_id: contact.contact_id,
                    channel_id: channel.channel_id,
                    status: 'ACTIVE',
                    created_at: new Date().toISOString()
                });
                
                this.logger.info('Novo chat criado', { 
                    chatId: chat.chat_id,
                    contactId: contact.contact_id,
                    channelId: channel.channel_id
                });
            }
            
            return { chat, contact };
        } catch (error) {
            this.logger.error('Erro ao buscar ou criar chat por telefone', { 
                error: error.message,
                stack: error.stack,
                phoneNumber,
                instance
            });
            throw error;
        }
    }

    async getChatMessagesDetails(chatId) {
        try {
            // Buscar detalhes do chat
            const chat = await this.chatRepository.findById(chatId);
            if (!chat) {
                throw new Error('Chat não encontrado');
            }

            // Buscar detalhes do contato
            const contact = await this.contactRepository.findById(chat.contact_id);
            if (!contact) {
                throw new Error('Contato não encontrado');
            }

            // Buscar detalhes do canal
            const channel = await this.channelRepository.findById(chat.channel_id);
            if (!channel) {
                throw new Error('Canal não encontrado');
            }

            // Buscar mensagens do chat
            const messages = await this.chatMessageRepository.findByChatId(chatId);

            // Formatar as mensagens
            const formattedMessages = messages.map(message => ({
                id: message.message_id,
                content: message.content,
                contentType: message.content_type,
                senderId: message.sender_id,
                senderName: message.sender_name,
                createdAt: message.created_at,
                status: message.status?.type || 'PENDING',
                direction: message.direction,
                formattedTime: new Date(message.created_at).toLocaleTimeString()
            }));

            // Montar o payload final
            return {
                chat: {
                    id: chat.chat_id,
                    name: chat.chat_name,
                    status: chat.status,
                    unreadCount: chat.unread_count?.toString() || '0',
                    avatar: null, // Implementar lógica de avatar se necessário
                    isGroup: chat.is_group || false,
                    isMuted: chat.is_muted || false,
                    isPinned: chat.is_pinned || false,
                    channelType: channel.channel_name
                },
                contact: {
                    id: contact.contact_id,
                    name: contact.contact_value || contact.contact_name,  // valor do contato (ex: número do whatsapp)
                    contact_name: contact.contact_name,  // nome de exibição
                    contact_id: contact.contact_id,
                    contact_type: contact.contact_type,  // tipo do contato (whatsapp, telegram, etc)
                    contact_value: contact.contact_value,  // valor do contato
                    profile_pic_url: contact.profilePicUrl || null,  // foto do perfil
                    created_at: contact.created_at  // data de criação
                },
                channel: {
                    id: channel.channel_id,
                    name: channel.channel_name
                },
                messages: formattedMessages
            };
        } catch (error) {
            logger.error('Erro ao buscar detalhes do chat e mensagens', { error });
            throw error;
        }
    }

    async findByChatId(chatId, page = 1, limit = 20) {
        try {
            logger.info('Buscando mensagens do chat', { chatId, page, limit });
            const messages = await this.chatMessageRepository.findByChatId(chatId, page, limit);
            logger.info('Mensagens encontradas', { count: messages.items.length });
            return messages;
        } catch (error) {
            logger.error('Erro ao buscar mensagens do chat', { 
                error: error.message, 
                chatId 
            });
            throw error;
        }
    }

    async validateMessagePayload(payload) {
        try {
            // Log detalhado do payload original
            this.logger.info('Payload recebido para validação', { payload });

            const messageDto = plainToClass(CreateChatMessageDto, payload);

            const errors = await validate(messageDto, { 
                validationError: { 
                    target: false,
                    value: false 
                }
            });

            if (errors.length > 0) {
                const validationErrors = errors.map(error => ({
                    property: error.property,
                    constraints: error.constraints,
                    value: error.value
                }));

                this.logger.error('Erro de validação do payload', { 
                    errors: validationErrors,
                    payload 
                });

                throw new Error(`PAYLOAD INVÁLIDO - ${validationErrors.map(e => `${e.property}: ${Object.values(e.constraints).join(', ')}`).join('; ')}`);
            }

            return messageDto;
        } catch (error) {
            this.logger.error('Falha na validação do payload', { 
                error: error.message,
                payload 
            });
            throw error;
        }
    }

    async processAudioMessage(payload) {
        try {
            const validatedPayload = await this.validateMessagePayload(payload);

            if (validatedPayload.messageType !== 'audio') {
                throw new Error('Payload não é uma mensagem de áudio');
            }

            const audioBuffer = Buffer.from(validatedPayload.base64, 'base64');
            if (audioBuffer.length > 50 * 1024 * 1024) {
                throw new Error('Tamanho do arquivo de áudio excede o limite de 50MB');
            }

            const audioMetadata = {
                duration: payload.metadata?.duration || null,
                size: audioBuffer.length,
                mimetype: payload.metadata?.mime_type || 'audio/ogg'
            };

            const savedMessage = await this.chatMessageRepository.create({
                ...validatedPayload,
                metadata: {
                    ...validatedPayload.metadata,
                    ...audioMetadata
                },
                status: MESSAGE_STATUS.PENDING
            });

            this.logger.info('Mensagem de áudio processada com sucesso', { 
                messageId: savedMessage.id 
            });

            return savedMessage;
        } catch (error) {
            this.logger.error('Erro ao processar mensagem de áudio', { 
                error: error.message,
                payload 
            });
            throw error;
        }
    }

    prepareMessageStatus(status) {
        // Converte o status para um objeto JSON válido
        if (typeof status === 'string') {
            return {
                type: status,
                timestamp: new Date().toISOString()
            };
        }
        
        // Se já for um objeto, apenas garante que tem timestamp
        if (typeof status === 'object' && status !== null) {
            return {
                ...status,
                timestamp: status.timestamp || new Date().toISOString()
            };
        }
        
        // Caso contrário, retorna um objeto de status padrão
        return {
            type: 'UNKNOWN',
            timestamp: new Date().toISOString()
        };
    }

    async createMessage(payload) {
        try {
            this.logger.info(`Processando mensagem: ${payload.data?.id}`);

            // Detalhes completos do payload inicial
            this.logger.info('Payload completo recebido', { 
                fullPayload: payload 
            });

            // Encontrar/criar canal
            const channel = await this.findOrCreateChannelByInstance(
                payload.data?.instance || 'unknown', 
                payload.client
            );

            this.logger.info('Canal encontrado/criado', { 
                channelId: channel?.channel_id, 
                channelName: channel?.channel_name 
            });

            // Log adicional para rastrear payload
            this.logger.info('Payload de mensagem', { 
                remoteJid: payload.data?.remoteJid, 
                sender: payload.data?.sender,
                instance: payload.data?.instance
            });

            // Preparar dados do contato para log
            const contactPayload = { 
                ...payload.data, 
                channel,
                remoteJid: payload.data?.remoteJid || payload.data?.sender 
            };

            this.logger.info('Payload para busca de contato', { 
                contactPayload 
            });

            // Encontrar/criar contato
            const contact = await this.findOrCreateContactFromPayload(
                contactPayload, 
                payload.client
            );

            // Verificação explícita de contact_id
            if (!contact.id) {
                this.logger.error('FALHA CRÍTICA: contact ID INVÁLIDO', {
                    contact,
                    payload: contactPayload
                });
                throw new Error(`Contact ID inválido: ${JSON.stringify(contact)}`);
            }

            // Log para verificar o contato encontrado/criado
            this.logger.info('Contato encontrado/criado', { 
                contact_id: contact.id, 
                contact_details: contact,
                contactPayload 
            });

            // Verificação mais rigorosa para garantir criação do contato
            if (!contact) {
                this.logger.error('Falha crítica: Contato não encontrado ou criado', {
                    contactPayload,
                    channel: channel?.channel_id
                });
                throw new Error('Não foi possível encontrar ou criar um contato');
            }

            // Encontrar/criar chat
            const chatId = await this.findOrCreateChatByContactId(
                contact.id, 
                payload.client, 
                channel
            );

            // Log para verificar o chat criado
            this.logger.info('Chat encontrado/criado', { 
                chat_id: chatId,
                contact_id: contact.id,
                channel_id: channel?.channel_id
            });

            // Preparar o status corretamente
            const preparedStatus = this.prepareMessageStatus(payload.data?.status);

            // Preparar dados da mensagem
            const messageData = {
                chat_id: chatId,
                contact_id: contact.id,  
                direction: payload.data?.fromMe === 'true' ? 'OUTBOUND' : 'INBOUND',
                content: payload.data?.text || '',
                content_type: this.getContentType(payload.data?.messageType),
                external_id: payload.data?.id,
                status: preparedStatus,
                metadata: {
                    instance: payload.data?.instance,
                    remoteJid: payload.data?.remoteJid,
                    pushName: payload.data?.pushName
                },
                file_url: payload.data?.url,
                sent_at: payload.data?.date_time ? new Date(payload.data.date_time) : new Date(),
                delivered_at: payload.data?.status === 'DELIVERY_ACK' ? new Date() : null
            };

            this.logger.info('Dados da mensagem a ser criada', { 
                messageData 
            });

            // LOG CRÍTICO PARA RASTREAR contact_id
            this.logger.error('RASTREAMENTO CRÍTICO DE contact_id', {
                contact_id_type: typeof contact.id,
                contact_id_value: contact.id,
                contact_full_object: contact,
                contact_keys: Object.keys(contact),
                contact_id_is_null: contact.id === null,
                contact_id_is_undefined: contact.id === undefined
            });

            // Verifica se a mensagem já existe
            const existingMessage = await this.chatMessageRepository.findByExternalId(messageData.external_id);
            
            if (existingMessage) {
                this.logger.info('Mensagem já existe, retornando existente', {
                    messageId: existingMessage.message_id,
                    externalId: messageData.external_id
                });
                return {
                    message: existingMessage,
                    status: 'existing'
                };
            }

            // Se não existe, cria nova mensagem
            const createdMessage = await this.chatMessageRepository.create(messageData);

            this.logger.info('Nova mensagem criada com sucesso', {
                createdMessage
            });

            return {
                message: createdMessage,
                status: 'created'
            };
        } catch (error) {
            this.logger.error('Erro ao criar mensagem', {
                error: error.message,
                payload,
                fullError: error,
                stack: error.stack
            });
            throw error;
        }
    }

    getContentType(messageType) {
        const contentTypeMap = {
            'documentMessage': 'FILE',
            'imageMessage': 'IMAGE',
            'audioMessage': 'AUDIO',
            'videoMessage': 'VIDEO',
            'textMessage': 'TEXT'
        };
        
        return contentTypeMap[messageType] || 'TEXT';
    }

    async findOrCreateChannelByInstance(instanceName, client) {
        try {
            this.logger.info('INICIANDO BUSCA/CRIAÇÃO DE CANAL', {
                instanceName,
                clientProvided: !!client
            });

            let channel = await this.channelRepository.findByInstanceName(instanceName, { client });

            if (!channel) {
                channel = await this.channelRepository.create({
                    channel_name: instanceName,
                    contact_type: 'whatsapp',
                    is_active: true
                }, { client });
            }

            return channel;
        } catch (error) {
            this.logger.error('ERRO AO ENCONTRAR/CRIAR CANAL', {
                error: error.message,
                instanceName,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async findOrCreateChatByContactId(contactId, client, channel) {
        try {
            this.logger.info('Buscando ou criando chat', {
                contactId, 
                channelId: channel?.channel_id
            });

            // Primeiro busca chats existentes
            const existingChats = await this.chatMessageRepository.findChatsByContactId(contactId);
            
            if (existingChats && existingChats.length > 0) {
                this.logger.info('Chat existente encontrado', {
                    chatId: existingChats[0],
                    totalChats: existingChats.length
                });
                return existingChats[0];
            }

            // Se não encontrou nenhum chat, cria um novo
            const newChat = await this.chatRepository.create({
                contact_id: contactId,
                channel_id: channel.channel_id,
                status: 'ACTIVE'
            }, { client });

            this.logger.info('Novo chat criado', {
                chatId: newChat?.chat_id,
                newChat
            });

            return newChat.chat_id;
        } catch (error) {
            this.logger.error('Erro ao buscar/criar chat', {
                error: error.message,
                contactId,
                fullError: error
            });
            throw error;
        }
    }

    async createChatMessage(chatId, contactId, messageData, client) {
        // Validação de entrada
        if (!chatId) {
            throw new Error('Chat ID é obrigatório');
        }

        if (!contactId) {
            throw new Error('Contact ID é obrigatório');
        }

        try {
            // Log detalhado dos dados da mensagem
            this.logger.info('DADOS DA MENSAGEM RECEBIDOS', {
                chatId,
                contactId,
                messageDataFull: JSON.stringify(messageData, null, 2)
            });

            // Determina o tipo de conteúdo e extrai informações específicas
            const isAudioMessage = messageData.messageType === 'audioMessage';
            const content = isAudioMessage 
                ? messageData.transcricao || 'Mensagem de áudio' 
                : messageData.text || messageData.caption || 'Sem conteúdo';

            this.logger.info('TIPO DE MENSAGEM IDENTIFICADO', {
                isAudioMessage,
                contentType: isAudioMessage ? 'AUDIO' : 'TEXT',
                contentLength: content.length
            });

            // Prepara metadados com payload completo
            const metadata = {
                ...messageData,
                source: messageData.source || 'unknown'
            };

            // Determina o status da mensagem
            const status = messageData.status || MESSAGE_STATUS.PENDING;
            const messageStatus = MESSAGE_STATUS[status] || MESSAGE_STATUS.PENDING;

            this.logger.info('STATUS DA MENSAGEM', {
                status: messageStatus,
                originalStatus: status
            });

            // Converte timestamp para formato de data
            const messageTimestamp = messageData.messageTimestamp 
                ? new Date(messageData.messageTimestamp * 1000).toISOString() 
                : new Date().toISOString();

            this.logger.info('TIMESTAMP DA MENSAGEM', {
                timestamp: messageTimestamp,
                originalTimestamp: messageData.messageTimestamp
            });

            // Extrai o external_id da mensagem
            const externalId = messageData.id || null;

            this.logger.info('EXTERNAL ID', {
                externalId,
                hasExternalId: !!externalId
            });

            // Prepara metadados de mídia para mensagens de áudio
            const mediaMetadata = isAudioMessage ? {
                type: 'audio',
                mime_type: messageData.mimetype,
                filename: messageData.filename,
                size: messageData.base64 ? messageData.base64.length : null,
                duration: null, // Adicionar lógica para extrair duração se disponível
                transcription: messageData.transcricao
            } : null;

            this.logger.info('METADADOS DE MÍDIA', {
                isAudioMessage,
                mediaMetadata: JSON.stringify(mediaMetadata, null, 2)
            });

            // Prepara detalhes de entrega
            const deliveryDetails = {
                provider: messageData.server_url || 'WhatsApp',
                external_id: externalId,
                status: messageStatus,
                instance: messageData.instance
            };

            this.logger.info('DETALHES DE ENTREGA', {
                deliveryDetails: JSON.stringify(deliveryDetails, null, 2)
            });

            // Cria a mensagem de chat
            const chatMessage = await this.chatMessageRepository.create({
                chat_id: chatId,
                contact_id: contactId,
                content,
                direction: messageData.fromMe ? 'OUTBOUND' : 'INBOUND',
                status: messageStatus,
                metadata,
                media_metadata: mediaMetadata,
                sent_at: messageTimestamp,
                delivery_details: deliveryDetails
            });

            this.logger.info('MENSAGEM DE CHAT CRIADA', {
                chatMessageId: chatMessage.id,
                content: content.substring(0, 100) // Limita para não logar conteúdo muito longo
            });

            return chatMessage;
        } catch (error) {
            this.logger.error('ERRO AO CRIAR MENSAGEM DE CHAT', {
                errorMessage: error.message,
                stack: error.stack,
                messageData: JSON.stringify(messageData, null, 2)
            });
            throw error;
        }
    }

    async extractDynamicContent(data) {
        this.logger.info('Extração Dinâmica de Conteúdo', { 
            dadosOriginais: JSON.stringify(data) 
        });

        const extractionStrategies = [
            { 
                name: 'Texto Direto', 
                contentType: 'TEXT',
                extract: (data) => {
                    const content = data.text || data.caption || null;
                    return content ? { 
                        contentType: 'TEXT', 
                        content 
                    } : null;
                }
            },
            { 
                name: 'Áudio', 
                contentType: 'AUDIO',
                extract: (data) => {
                    if (data.audioUrl) {
                        return {
                            contentType: 'AUDIO',
                            content: data.text || 'Mensagem de Áudio',
                            fileUrl: data.audioUrl,
                            fileMetadata: {
                                transcription: data.text || null
                            }
                        };
                    }
                    return null;
                }
            },
            { 
                name: 'Arquivo', 
                contentType: 'FILE',
                extract: (data) => {
                    if (data.fileUrl) {
                        return {
                            contentType: 'FILE',
                            content: data.text || 'Arquivo Recebido',
                            fileUrl: data.fileUrl,
                            fileMetadata: {
                                originalName: data.fileName || null
                            }
                        };
                    }
                    return null;
                }
            }
        ];

        for (const strategy of extractionStrategies) {
            const result = strategy.extract(data);
            if (result) return result;
        }

        return { 
            contentType: 'TEXT', 
            content: 'Conteúdo não reconhecido' 
        };
    }

    async updateMessageStatus(messageId, status, metadata = {}) {
        try {
            const validStatus = MESSAGE_STATUS[status] || MESSAGE_STATUS.PENDING;

            this.logger.info('Iniciando atualização de status da mensagem', {
                messageId,
                status: validStatus
            });

            const messageStatus = await this.chatMessageStatusRepository.create({
                message_id: messageId,
                status: validStatus,
                metadata: {
                    ...metadata,
                    updatedAt: new Date().toISOString()
                }
            });

            await this.chatMessageRepository.update(messageId, {
                message_status: validStatus
            });

            this.logger.info('Status da mensagem atualizado com sucesso', {
                messageId,
                status: validStatus
            });

            return messageStatus;
        } catch (error) {
            this.logger.error('Erro ao atualizar status da mensagem', {
                error: error.message,
                messageId,
                status
            });
            throw error;
        }
    }

    async deleteMessage(messageId) {
        try {
            logger.info('Excluindo mensagem', { messageId });
            await this.chatMessageRepository.deleteMessage(messageId);
            logger.info('Mensagem excluída com sucesso', { messageId });
        } catch (error) {
            logger.error('Erro ao excluir mensagem', { 
                error: error.message, 
                messageId 
            });
            throw error;
        }
    }

    async findAll(filters = {}, page = 1, limit = 20) {
        try {
            this.logger.info('BUSCANDO MENSAGENS COM FILTROS DETALHADOS', { 
                filters, 
                page, 
                limit 
            });

            const messages = await this.chatMessageRepository.findAll(filters, page, limit);
            
            this.logger.info('RESULTADO DA BUSCA DE MENSAGENS', { 
                totalMessages: messages.items.length,
                filters,
                page,
                limit
            });

            return messages;
        } catch (error) {
            this.logger.error('Erro ao buscar mensagens', { 
                error: error.message, 
                filters,
                page,
                limit 
            });
            throw error;
        }
    }

    async processMessageWithTransaction(messageData) {
        const client = await this.chatMessageRepository.pool.connect();
        try {
            let contactId = null;
            try {
                let contact = await this.contactRepository.findByValueAndType(
                    messageData.remoteJid, 
                    'whatsapp', 
                    { client }
                );

                if (!contact) {
                    contact = await this.contactRepository.create({
                        contact_value: messageData.remoteJid,
                        contact_type: 'whatsapp',
                        contact_name: messageData.pushname || 'Contato WhatsApp'
                    }, { client });
                }

                contactId = contact.id;
            } catch (contactError) {
                this.logger.error('Erro ao processar contato', { 
                    error: contactError.message, 
                    remoteJid: messageData.remoteJid 
                });
                throw contactError;
            }

            let personContactId = null;
            try {
                const personContacts = await this.personContactRepository.findByPersonAndContact(
                    null, // Sem pessoa específica 
                    contactId, 
                    { client }
                );

                logger.info('Resultado busca person contacts', { 
                    contactId, 
                    personContactsCount: personContacts ? personContacts.length : 0 
                });

                if (personContacts && personContacts.length > 0) {
                    personContactId = personContacts[0].person_contact_id;
                    logger.info('Person Contact encontrado', { 
                        personContactId, 
                        personId: personContacts[0].person_id 
                    });
                } else {
                    logger.warn('Nenhum Person Contact encontrado', { contactId });
                }
            } catch (personContactError) {
                logger.error('Erro na busca de Person Contact', {
                    error: personContactError.message,
                    stack: personContactError.stack,
                    contactId
                });
                throw personContactError;
            }

            let chatId = null;
            const channelId = this.getChannelId(messageData.instance);
            
            try {
                const existingChats = await this.chatRepository.findAll(
                    { 
                        contact_id: contactId,
                        channel_id: channelId
                    }, 
                    1, 
                    1, 
                    { client }
                );

                logger.info('Busca de chats existentes', {
                    contactId,
                    channelId,
                    existingChatsCount: existingChats.items ? existingChats.items.length : 0
                });

                if (existingChats.items && existingChats.items.length > 0) {
                    chatId = existingChats.items[0].chat_id;
                    logger.info('Chat existente encontrado', { chatId });
                } else {
                    const newChat = await this.chatRepository.create({
                        type: 'conversation',
                        direction: 'incoming',
                        from: messageData.remoteJid,
                        to: JSON.stringify([messageData.remoteJid]),
                        channel_id: channelId,
                        status: 'ACTIVE'
                    }, { client });
                    
                    chatId = newChat.chat_id;
                    logger.info('Novo chat criado', { chatId });
                }
            } catch (chatError) {
                logger.error('Erro na busca/criação de chat', {
                    error: chatError.message,
                    stack: chatError.stack,
                    contactId,
                    channelId
                });
                throw chatError;
            }

            if (personContactId || contactId) {
                try {
                    await this.chatRepository.addChatParticipant({
                        chat_id: chatId,
                        person_contact_id: personContactId,
                        contact_id: contactId,
                        role: 'PARTICIPANT'
                    }, { client });
                    
                    logger.info('Participante adicionado ao chat', { 
                        chatId, 
                        personContactId, 
                        contactId 
                    });
                } catch (participantError) {
                    logger.error('Erro ao adicionar participante', {
                        error: participantError.message,
                        stack: participantError.stack,
                        chatId,
                        personContactId,
                        contactId
                    });
                    throw participantError;
                }
            }

            const newMessage = await this.chatMessageRepository.createMessage({
                chat_id: chatId,
                content: messageData.text,
                external_id: messageData.id,
                direction: 'incoming',
                status: 'RECEIVED',
                from: messageData.remoteJid,
                channel_id: channelId
            }, { client });
            
            logger.info('Mensagem criada', { 
                messageId: newMessage.message_id, 
                chatId 
            });

            await client.query('COMMIT');
            logger.info('Processamento de mensagem concluído com sucesso');

            return newMessage;
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erro no processamento da mensagem', { 
                error: error.message, 
                stack: error.stack,
                messageData 
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async findOrCreateContactFromPayload(messageData, client) {
        try {
            const remoteJid = messageData.remoteJid || 
                              messageData.key?.remoteJid || 
                              messageData.sender || 
                              messageData.data?.remoteJid;
            
            const pushName = messageData.pushName || 
                             messageData.data?.pushName || 
                             'Contato WhatsApp';

            this.logger.info('Detalhes de criação de contato', {
                remoteJid,
                pushName,
                fullMessageData: messageData
            });

            if (!remoteJid) {
                throw new Error('Identificador de remetente não encontrado');
            }

            let contact = await this.contactRepository.findByLastDigits(remoteJid, { 
                client, 
                createIfNotFound: true 
            });

            this.logger.info('Resultado findByLastDigits', { 
                contact, 
                remoteJid 
            });

            // Se o contato não foi encontrado ou criado, criar manualmente
            if (!contact) {
                const createContactDTO = new CreateContactDTO({
                    person_id: null, // Pode precisar de lógica para determinar pessoa
                    type: 'phone',
                    contact: remoteJid,
                    description: pushName
                });

                this.logger.info('Tentando criar contato', { 
                    createContactDTO 
                });

                contact = await this.contactService.create(createContactDTO);

                this.logger.info('Contato criado', { 
                    contact 
                });
            }

            return contact;
        } catch (error) {
            this.logger.error('Erro ao encontrar/criar contato', {
                error: error.message,
                remoteJid: messageData.remoteJid || messageData.key?.remoteJid,
                fullError: error
            });
            throw error;
        }
    }
}

module.exports = ChatMessageService;

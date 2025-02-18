const { logger } = require('../../middlewares/logger');
const ChatRepository = require('../chat/chat.repository');
const ContactRepository = require('../contacts/contact.repository');
const PersonContactRepository = require('../person-contacts/person-contact.repository');
const ChatMessageRepository = require('./chat-message.repository');
const ChatParticipantRepository = require('./chat-participant.repository');
const PersonRepository = require('../persons/person.repository');
const ChannelRepository = require('../channels/channel.repository');
const ChatMessageStatusRepository = require('../chat-message-status/chat-message-status.repository');

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

        // Mapeamento de canais para IDs
        this.channelMap = {
            'zapEsc': 1,
            'whatsapp': 2,
            'telegram': 3,
            'email': 4
        };
    }

    // Método para mapear nome do canal para ID
    getChannelId(channelName) {
        // Se for um número, retorna direto
        if (!isNaN(channelName)) return Number(channelName);

        // Busca no mapeamento, com fallback para 1
        return this.channelMap[channelName] || 1;
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

    async createMessage(payload) {
        try {
            // Log EXTREMAMENTE detalhado do payload completo
            this.logger.info('PAYLOAD COMPLETO RECEBIDO', {
                payloadFull: JSON.stringify(payload, null, 2)
            });

            // Log dos campos principais
            this.logger.info('CAMPOS PRINCIPAIS DO PAYLOAD', {
                hasData: !!payload.data,
                hasInstance: !!payload.data?.instance,
                hasRemoteJid: !!payload.data?.data?.key?.remoteJid,
                remoteJid: payload.data?.data?.key?.remoteJid
            });

            return await this.chatMessageRepository.transaction(async (client) => {
                // Verificação explícita e log de cada etapa
                const remoteJid = payload.data?.data?.key?.remoteJid;
                if (!remoteJid) {
                    this.logger.error('PAYLOAD INVÁLIDO - REMOTEJID AUSENTE', { 
                        payloadDetails: JSON.stringify(payload, null, 2)
                    });
                    throw new Error('RemoteJid é obrigatório');
                }

                this.logger.info('INICIANDO BUSCA DE CONTATO', { remoteJid });
                const contact = await this.contactRepository.findByLastDigits(remoteJid, { client });
                this.logger.info('RESULTADO BUSCA CONTATO', { 
                    contactFound: !!contact,
                    contactId: contact?.id,
                    contactName: contact?.name 
                });

                // Log da instância
                const instanceName = payload.data?.instance;
                this.logger.info('PROCESSANDO INSTÂNCIA', { instanceName });

                // Localiza ou cria o canal
                this.logger.info('BUSCANDO/CRIANDO CANAL');
                const channel = await this.findOrCreateChannelByInstance(instanceName, client);
                this.logger.info('CANAL PROCESSADO', { 
                    channelId: channel?.channel_id, 
                    channelName: channel?.channel_name 
                });

                // Busca ou cria chat para o contato
                let chatId = null;
                if (contact && contact.id) {
                    this.logger.info('BUSCANDO/CRIANDO CHAT PARA CONTATO');
                    chatId = await this.findOrCreateChatByContactId(contact.id, client, channel);
                    this.logger.info('CHAT PROCESSADO', { chatId });
                }

                // Cria a mensagem de chat
                let message = null;
                if (chatId && contact) {
                    this.logger.info('CRIANDO MENSAGEM DE CHAT');
                    message = await this.createChatMessage(chatId, contact.id, payload.data.data, client);
                    this.logger.info('MENSAGEM CRIADA', { 
                        messageId: message?.id,
                        messageContent: message?.content 
                    });

                    // Atualizar last_message_id do chat
                    if (message && message.id) {
                        await this.chatRepository.updateChatLastMessage(chatId, message.id);
                        this.logger.info('LAST MESSAGE ID ATUALIZADO', { 
                            chatId, 
                            lastMessageId: message.id 
                        });
                    }
                }

                return message;
            });
        } catch (error) {
            this.logger.error('FALHA CRÍTICA AO CRIAR MENSAGEM', { 
                error: error.message,
                stack: error.stack,
                payloadSummary: JSON.stringify(payload, null, 2)
            });
            throw error;
        }
    }

    async findOrCreateChannelByInstance(instanceName, client) {
        try {
            this.logger.info('INICIANDO BUSCA/CRIAÇÃO DE CANAL', {
                instanceName,
                clientProvided: !!client
            });

            // Busca o canal existente
            let channel = await this.channelRepository.findByInstanceName(instanceName, { client });

            // Se não existir, cria um novo canal
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
            // Busca chats existentes para o contato
            const existingChats = await this.chatRepository.findByContactId(contactId, { client });

            // Se já existir um chat, retorna o primeiro
            if (existingChats && existingChats.length > 0) {
                return existingChats[0].chat_id;
            }

            // Cria um novo chat
            const newChat = await this.chatRepository.create({
                contact_id: contactId,
                channel_id: channel.channel_id,
                status: 'ACTIVE'
            }, { client });

            return newChat.chat_id;
        } catch (error) {
            this.logger.error('Erro ao encontrar/criar chat', {
                error: error.message,
                contactId
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
            // Extrai o conteúdo da conversa
            const content = messageData.message?.conversation || 'Conteúdo não reconhecido';

            // Prepara metadados com payload completo
            const metadata = {
                ...messageData,
                source: messageData.source || 'unknown'
            };

            // Determina o status da mensagem
            const status = messageData.status || MESSAGE_STATUS.PENDING;
            const messageStatus = MESSAGE_STATUS[status] || MESSAGE_STATUS.PENDING;

            // Converte timestamp para formato de data
            const messageTimestamp = messageData.messageTimestamp 
                ? new Date(messageData.messageTimestamp * 1000).toISOString() 
                : new Date().toISOString();

            // Extrai o external_id da mensagem
            const externalId = messageData.key?.id || null;

            // Cria a mensagem de chat
            const chatMessage = await this.chatMessageRepository.create({
                chat_id: chatId,
                contact_id: contactId,
                content: content,
                content_type: 'TEXT',
                direction: 'INBOUND',
                metadata: metadata,
                status: messageStatus,
                message_status: messageStatus,
                external_id: externalId,
                created_at: messageTimestamp
            }, { client });

            // Cria o status da mensagem
            await this.chatMessageStatusRepository.create({
                message_id: chatMessage.message_id,
                status: messageStatus,
                metadata: {
                    source: 'message_creation',
                    originalPayload: metadata
                }
            });

            this.logger.info('Mensagem de chat criada', {
                chatId,
                contactId,
                content,
                status: messageStatus,
                externalId
            });

            return chatMessage;
        } catch (error) {
            this.logger.error('Erro ao criar mensagem de chat', {
                error: error.message,
                chatId,
                contactId
            });
            throw error;
        }
    }

    extractDynamicContent(data) {
        // Log para debug
        this.logger.info('Extração Dinâmica de Conteúdo', { 
            dadosOriginais: JSON.stringify(data) 
        });

        // Estratégias de extração com suporte a diferentes tipos
        const extractionStrategies = [
            // Texto normal
            { 
                name: 'Texto Direto', 
                contentType: 'TEXT',
                extract: (data) => {
                    // Prioriza campos de texto
                    const content = data.text || data.caption || null;
                    return content ? { 
                        contentType: 'TEXT', 
                        content 
                    } : null;
                }
            },
            // Áudio
            { 
                name: 'Áudio', 
                contentType: 'AUDIO',
                extract: (data) => {
                    // Verifica URL de áudio ou transcrição
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
            // Arquivo
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

        // Tenta extrair conteúdo usando as estratégias
        for (const strategy of extractionStrategies) {
            const result = strategy.extract(data);
            if (result) return result;
        }

        // Se nenhuma estratégia funcionar, retorna null
        return { 
            contentType: 'TEXT', 
            content: 'Conteúdo não reconhecido' 
        };
    }

    async updateMessageStatus(messageId, status, metadata = {}) {
        try {
            // Valida o status
            const validStatus = MESSAGE_STATUS[status] || MESSAGE_STATUS.PENDING;

            // Log de início da atualização
            this.logger.info('Iniciando atualização de status da mensagem', {
                messageId,
                status: validStatus
            });

            // Cria registro de status da mensagem
            const messageStatus = await this.chatMessageStatusRepository.create({
                message_id: messageId,
                status: validStatus,
                metadata: {
                    ...metadata,
                    updatedAt: new Date().toISOString()
                }
            });

            // Atualiza o status na mensagem original
            await this.chatMessageRepository.update(messageId, {
                message_status: validStatus
            });

            // Log de sucesso
            this.logger.info('Status da mensagem atualizado com sucesso', {
                messageId,
                status: validStatus
            });

            return messageStatus;
        } catch (error) {
            // Log de erro
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
            // Etapa 1: Localizar/Adicionar Contato
            let contactId = null;
            try {
                // Busca por valor completo
                let contact = await this.contactRepository.findByValueAndType(
                    messageData.remoteJid, 
                    'whatsapp', 
                    { client }
                );

                // Se não encontrar, cria novo contato
                if (!contact) {
                    contact = await this.contactRepository.create({
                        contact_value: messageData.remoteJid,
                        contact_type: 'whatsapp',
                        contact_name: messageData.pushname || 'Contato WhatsApp'
                    }, { client });
                }

                contactId = contact.contact_id;
            } catch (contactError) {
                this.logger.error('Erro ao processar contato', { 
                    error: contactError.message, 
                    remoteJid: messageData.remoteJid 
                });
                throw contactError;
            }

            // Restante do método permanece igual
            // Etapa 2: Localizar Person Contact
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
                    // Pega o primeiro person contact
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

            // Etapa 3: Verificar/Criar Chat
            let chatId = null;
            const channelId = this.getChannelId(messageData.instance);
            
            try {
                // Buscar chats existentes para este contato
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
                    // Criar novo chat
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

            // Adicionar participante ao chat
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

            // Criar mensagem
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

            // Commit da transação
            await client.query('COMMIT');
            logger.info('Processamento de mensagem concluído com sucesso');

            return newMessage;
        } catch (error) {
            // Rollback em caso de erro
            await client.query('ROLLBACK');
            logger.error('Erro no processamento da mensagem', { 
                error: error.message, 
                stack: error.stack,
                messageData 
            });
            throw error;
        } finally {
            // Liberar cliente de conexão
            client.release();
        }
    }

    async findOrCreateContactFromPayload(messageData, client) {
        try {
            const remoteJid = messageData.key.remoteJid;
            const pushName = messageData.pushName || 'Contato WhatsApp';

            if (!remoteJid) {
                throw new Error('Identificador de remetente não encontrado');
            }

            // Delega completamente para o repositório
            let contact = await this.contactRepository.findByValue(remoteJid);

            // Se não encontrar, deixa o repositório decidir
            if (!contact) {
                contact = await this.contactRepository.create({
                    contact_value: remoteJid,
                    contact_name: pushName,
                    contact_type: 'whatsapp'
                }, { client });
            }

            return contact;
        } catch (error) {
            this.logger.error('Erro ao encontrar/criar contato', {
                error: error.message,
                remoteJid: messageData.key.remoteJid
            });
            throw error;
        }
    }
}

module.exports = ChatMessageService;

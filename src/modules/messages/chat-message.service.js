const { logger } = require('../../middlewares/logger');
const ContactRepository = require('../contacts/contact.repository');
const PersonContactRepository = require('../person-contacts/person-contact.repository');
const ChatMessageRepository = require('./chat-message.repository');
const ChatRepository = require('./chat.repository');
const ChatParticipantRepository = require('./chat-participant.repository');
const PersonRepository = require('../persons/person.repository');
const ChannelRepository = require('../channels/channel.repository');

class ChatMessageService {
    constructor() {
        this.contactRepository = new ContactRepository();
        this.personContactRepository = new PersonContactRepository();
        this.chatMessageRepository = new ChatMessageRepository();
        this.chatRepository = new ChatRepository();
        this.chatParticipantRepository = new ChatParticipantRepository();
        this.personRepository = new PersonRepository();
        this.channelRepository = new ChannelRepository();
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
            // Log detalhado do payload
            this.logger.info('PAYLOAD RECEBIDO NO CREATEMESSAGE', {
                payloadKeys: Object.keys(payload),
                dataKeys: payload.data ? Object.keys(payload.data) : 'SEM DATA',
                remoteJid: payload.data?.data?.key?.remoteJid
            });

            return await this.chatMessageRepository.transaction(async (client) => {
                // Verificação explícita antes da chamada
                const remoteJid = payload.data?.data?.key?.remoteJid;
                if (!remoteJid) {
                    this.logger.error('PAYLOAD INVÁLIDO - REMOTEJID AUSENTE', { 
                        payload: JSON.stringify(payload) 
                    });
                    throw new Error('RemoteJid é obrigatório');
                }

                const contact = await this.contactRepository.findByLastDigits(remoteJid);

                // Localiza ou cria o canal
                const channel = await this.findOrCreateChannelByInstance(payload.data.instance, client);

                // Busca ou cria chat para o contato
                let chatId = null;
                if (contact && contact.id) {
                    chatId = await this.findOrCreateChatByContactId(contact.id, client, channel);
                }

                // Cria a mensagem de chat
                let message = null;
                if (chatId && contact) {
                    message = await this.createChatMessage(chatId, contact.id, payload.data.data, client);
                }

                return message;
            });
        } catch (error) {
            this.logger.error('Falha ao criar mensagem', { 
                error: error.message,
                payload: JSON.stringify(payload)
            });
            throw error;
        }
    }

    async findOrCreateChannelByInstance(instanceName, client) {
        try {
            // Mapeia o nome da instância para o ID do canal
            const channelId = this.getChannelId(instanceName);

            // Busca o canal existente
            let channel = await this.channelRepository.findById(channelId, { client });

            // Se não existir, cria um novo canal
            if (!channel) {
                channel = await this.channelRepository.create({
                    channel_id: channelId,
                    channel_name: instanceName || 'WhatsApp',
                    channel_type: 'WHATSAPP'
                }, { client });
            }

            return channel;
        } catch (error) {
            this.logger.error('Erro ao encontrar/criar canal', {
                error: error.message,
                instanceName
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

        // Extração de dados da mensagem
        const extractedData = this.extractDynamicContent(messageData);

        // Prepara dados para criação da mensagem
        const messagePayload = {
            chat_id: chatId,
            contact_id: contactId,
            content: extractedData.content,
            content_type: extractedData.contentType || 'TEXT',
            direction: messageData.fromMe ? 'OUTBOUND' : 'INBOUND',
            external_id: messageData.id,
            file_url: extractedData.fileUrl,
            metadata: {
                pushname: messageData.pushname,
                source: messageData.source
            }
        };

        // Cria a mensagem usando o repositório
        const message = await this.chatMessageRepository.create(messagePayload, client);

        // Registra log de criação da mensagem
        this.logger.info('Mensagem de chat criada', {
            chatId,
            contactId,
            messageId: message.message_id,
            contentType: messagePayload.content_type
        });

        return message;
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

    async updateMessageStatus(messageId, status) {
        try {
            logger.info('Atualizando status da mensagem', { messageId, status });
            const updatedMessage = await this.chatMessageRepository.updateMessageStatus(messageId, status);
            logger.info('Status da mensagem atualizado', { messageId });
            return updatedMessage;
        } catch (error) {
            logger.error('Erro ao atualizar status da mensagem', { 
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

    async findAll(page = 1, limit = 20, filters = {}, options = {}) {
        try {
            logger.info('Buscando mensagens', { 
                page, 
                limit, 
                filters, 
                options,
                pageType: typeof page,
                limitType: typeof limit,
                filtersType: typeof filters
            });
            
            const result = await this.chatMessageRepository.findAll(
                page, 
                limit, 
                filters,
                options
            );
            
            logger.info('Mensagens encontradas', { count: result.items.length });
            return result;
        } catch (error) {
            logger.error('Erro ao listar mensagens', {
                error: error.message,
                page,
                limit,
                filters,
                options
            });
            throw error;
        }
    }

    async processMessageWithTransaction(messageData) {
        // Log inicial com todos os detalhes da mensagem
        logger.info('INÍCIO processMessageWithTransaction', {
            fullMessageData: JSON.stringify(messageData),
            remoteJid: messageData.remoteJid
        });

        const client = await this.chatMessageRepository.pool.connect();
        
        try {
            // Iniciar transação
            await client.query('BEGIN');

            // Extração de número
          //  const originalPhoneNumber = messageData.remoteJid.split('@')[0];
          //  const cleanPhoneNumber = originalPhoneNumber.replace(/\D/g, '');

            logger.info('PREPARAÇÃO BUSCA CONTATO', {
                originalPhoneNumber: messageData.remoteJid.split('@')[0],
                cleanPhoneNumber: messageData.remoteJid.split('@')[0].replace(/\D/g, ''),
                cleanPhoneNumberLength: messageData.remoteJid.split('@')[0].replace(/\D/g, '').length
            });

            // Verificação de método de busca
            logger.info('MÉTODOS DISPONÍVEIS NO REPOSITÓRIO', {
                repositoryMethods: Object.keys(this.contactRepository)
            });

            // Log antes da chamada
            logger.info('PRÉ-BUSCA CONTATO', {
                method: 'findByLastDigits',
                phoneNumberToSearch: messageData.remoteJid.split('@')[0].replace(/\D/g, '').slice(-7)
            });

            // Chamada do método com try/catch específico
            let existingContact = null;
            try {
                existingContact = await this.contactRepository.findByLastDigits(
                    messageData.remoteJid.split('@')[0].replace(/\D/g, '').slice(-7), 
                    { client }
                );
            } catch (findError) {
                logger.error('ERRO NA BUSCA DE CONTATO', {
                    errorMessage: findError.message,
                    errorStack: findError.stack,
                    method: 'findByLastDigits',
                    phoneNumber: messageData.remoteJid.split('@')[0].replace(/\D/g, '').slice(-7)
                });
                throw findError;
            }

            // Log após a chamada
            logger.info('PÓS-BUSCA CONTATO', {
                contactFound: existingContact ? 'SIM' : 'NÃO',
                contactDetails: existingContact ? {
                    contact_id: existingContact.contact_id,
                    contact_value: existingContact.contact_value
                } : null
            });

            // Etapa 1: Localizar/Adicionar Contato
            let contactId = null;
            try {
                // Busca por últimos dígitos
                const existingContact = await this.contactRepository.findByLastDigits(
                    messageData.remoteJid.split('@')[0].replace(/\D/g, '').slice(-7), 
                    { client }
                );

                if (existingContact) {
                    contactId = existingContact.contact_id;
                    logger.info('Contato encontrado pelos últimos dígitos', { 
                        contactId, 
                        contactValue: existingContact.contact_value 
                    });
                } else {
                    // Tenta busca por valor completo
                    const fullContact = await this.contactRepository.findByValueAndType(
                        messageData.remoteJid, 
                        'whatsapp', 
                        { client }
                    );

                    if (fullContact) {
                        contactId = fullContact.contact_id;
                        logger.info('Contato encontrado por valor completo', { 
                            contactId, 
                            contactValue: fullContact.contact_value 
                        });
                    } else {
                        // Criar novo contato
                        const newContact = await this.contactRepository.create({
                            contact_value: messageData.remoteJid,
                            contact_type: 'whatsapp',
                            contact_name: messageData.pushname || 'Contato WhatsApp'
                        }, { client });
                        
                        contactId = newContact.contact_id;
                        logger.info('Novo contato criado', { 
                            contactId, 
                            contactValue: newContact.contact_value 
                        });
                    }
                }
            } catch (contactError) {
                logger.error('Erro na busca/criação de contato', {
                    error: contactError.message,
                    stack: contactError.stack
                });
                throw contactError;
            }

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
            const remoteJid = messageData.sender || messageData.key?.remoteJid;
            const pushName = messageData.pushName || 'Contato WhatsApp';

            if (!remoteJid) {
                throw new Error('Identificador de remetente não encontrado');
            }

            // Remove @s.whatsapp.net e busca pelos últimos 7 dígitos
            const lastDigits = remoteJid.split('@')[0].replace(/\D/g, '').slice(-7);

            // Busca por contato existente
            let contact = await this.contactRepository.findByLastDigits(lastDigits, { client });

            // Se não encontrar, cria novo contato
            if (!contact) {
                contact = await this.contactRepository.create({
                    contact_value: remoteJid,
                    contact_type: 'whatsapp',
                    contact_name: pushName
                }, { client });
            }

            return contact.contact_id;
        } catch (error) {
            this.logger.error('Erro ao encontrar/criar contato', {
                error: error.message,
                messageData: JSON.stringify(messageData),
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = ChatMessageService;

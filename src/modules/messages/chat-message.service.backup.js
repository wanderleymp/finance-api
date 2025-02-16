async createMessage(payload) {
    try {
        // Extração dinâmica de conteúdo
        const messageData = this.extractDynamicContent(payload.data);

        // Mapeia o channel_id para um valor inteiro
        const channelId = this.getChannelId(payload.api.instance);

        // Recupera ou cria chat_id
        const chatId = await this.findOrCreateChat(payload);

        // Prepara dados da mensagem
        const chatMessageData = {
            chat_id: chatId,
            channel_id: channelId,
            direction: payload.data.fromMe ? 'OUTBOUND' : 'INBOUND',
            status: 'SENT',
            content: messageData.content,
            content_type: messageData.contentType,
            file_url: messageData.fileUrl || null,
            file_metadata: messageData.fileMetadata || null,
            metadata: {
                api: payload.api || {},
                rawData: payload
            }
        };

        // Cria mensagem
        const message = await this.chatMessageRepository.create(chatMessageData);

        // Atualiza última mensagem do chat
        await this.chatRepository.updateChatLastMessage(chatId, message.message_id);

        this.logger.info('Mensagem criada com sucesso', { 
            messageId: message.id, 
            content: message.content,
            contentType: message.content_type,
            channelId: message.channel_id,
            chatId: message.chat_id
        });

        return message;
    } catch (error) {
        this.logger.error('Falha ao criar mensagem', { 
            error: error.message,
            payload: JSON.stringify(payload)
        });
        throw error;
    }
}

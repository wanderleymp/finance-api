import { Injectable } from '@nestjs/common';
import { logger } from '../../middlewares/logger';
import { ChatMessageTypeOrmRepository } from './chat-message.repository';
import { ChatMessage } from './entities/chat-message.entity';
import { Chat } from './entities/chat.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ChatMessageService {
    constructor(
        private readonly chatMessageRepository: ChatMessageTypeOrmRepository,
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>
    ) {}

    async findByChatId(
        chatId: number, 
        page = 1, 
        limit = 20
    ): Promise<{ items: ChatMessage[], meta: any }> {
        try {
            logger.info('Buscando mensagens do chat', { chatId, page, limit });
            
            const messages = await this.chatMessageRepository.findMessagesByChat(
                chatId, 
                page, 
                limit
            );
            
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

    async createMessage(
        chatId: number, 
        data: Partial<ChatMessage>
    ): Promise<ChatMessage> {
        try {
            logger.info('Criando nova mensagem', { chatId, data });
            
            // Preparar dados da mensagem
            const messageData: Partial<ChatMessage> = {
                chatId,
                content: data.content,
                direction: data.direction || 'OUTBOUND',
                status: data.status || 'SENT',
                metadata: data.metadata || {},
                createdAt: new Date()
            };

            // Criar mensagem
            const message = await this.chatMessageRepository.createMessage(messageData);
            
            // Atualizar última mensagem do chat
            await this.chatRepository.update(chatId, { 
                lastMessageId: message.messageId 
            });

            logger.info('Mensagem criada com sucesso', { 
                messageId: message.messageId 
            });

            return message;
        } catch (error) {
            logger.error('Erro ao criar mensagem', { 
                error: error.message, 
                chatId, 
                data 
            });
            throw error;
        }
    }

    async updateMessageStatus(
        messageId: number, 
        status: string
    ): Promise<ChatMessage> {
        try {
            logger.info('Atualizando status da mensagem', { messageId, status });
            
            const updatedMessage = await this.chatMessageRepository.updateMessageStatus(
                messageId, 
                status
            );
            
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

    async deleteMessage(messageId: number): Promise<void> {
        try {
            logger.info('Excluindo mensagem', { messageId });
            
            await this.chatMessageRepository.delete(messageId);
            
            logger.info('Mensagem excluída com sucesso', { messageId });
        } catch (error) {
            logger.error('Erro ao excluir mensagem', { 
                error: error.message, 
                messageId 
            });
            throw error;
        }
    }

    async findAll(
        page = 1, 
        limit = 20, 
        filters = {}, 
        options = {}
    ): Promise<{ items: ChatMessage[], meta: any }> {
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
}

export default ChatMessageService;

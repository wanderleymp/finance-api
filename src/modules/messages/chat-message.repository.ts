import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import BaseRepository from '../../repositories/base/BaseRepository';
import { ChatMessage } from './entities/chat-message.entity';
import { Chat } from './entities/chat.entity';
import { logger } from '../../middlewares/logger';

@Injectable()
export class ChatMessageTypeOrmRepository extends BaseRepository {
    constructor(
        @InjectRepository(ChatMessage)
        private readonly chatMessageRepository: Repository<ChatMessage>,
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>
    ) {
        super('chat_messages', 'message_id');
    }

    // Método para criar mensagem usando TypeORM
    async createMessage(data: Partial<ChatMessage>): Promise<ChatMessage> {
        try {
            const message = this.chatMessageRepository.create(data);
            return await this.chatMessageRepository.save(message);
        } catch (error) {
            logger.error('Erro ao criar mensagem', { 
                error: error.message, 
                data 
            });
            throw error;
        }
    }

    // Método para buscar mensagens de um chat
    async findMessagesByChat(
        chatId: number, 
        page = 1, 
        limit = 20
    ): Promise<{ items: ChatMessage[], meta: any }> {
        try {
            const [items, total] = await this.chatMessageRepository.findAndCount({
                where: { chatId },
                order: { createdAt: 'DESC' },
                skip: (page - 1) * limit,
                take: limit
            });

            return {
                items,
                meta: {
                    totalItems: total,
                    itemCount: items.length,
                    itemsPerPage: limit,
                    totalPages: Math.ceil(total / limit),
                    currentPage: page
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar mensagens do chat', { 
                error: error.message, 
                chatId, 
                page, 
                limit 
            });
            throw error;
        }
    }

    // Método para atualizar status da mensagem
    async updateMessageStatus(
        messageId: number, 
        status: string
    ): Promise<ChatMessage> {
        try {
            await this.chatMessageRepository.update(
                messageId, 
                { 
                    status,
                    updatedAt: new Date() 
                }
            );

            return await this.chatMessageRepository.findOneOrFail({ 
                where: { messageId } 
            });
        } catch (error) {
            logger.error('Erro ao atualizar status da mensagem', { 
                error: error.message, 
                messageId, 
                status 
            });
            throw error;
        }
    }

    // Sobrescrevendo método findAll do BaseRepository para usar TypeORM
    async findAll(
        page = 1, 
        limit = 20, 
        filters = {}, 
        options = {}
    ): Promise<{ items: ChatMessage[], meta: any }> {
        try {
            const queryBuilder = this.chatMessageRepository.createQueryBuilder('chatMessage');

            // Aplicar filtros personalizados
            Object.entries(filters).forEach(([key, value]) => {
                queryBuilder.andWhere(`chatMessage.${key} = :${key}`, { [key]: value });
            });

            // Ordenação
            queryBuilder.orderBy('chatMessage.createdAt', 'DESC');

            // Paginação
            queryBuilder.skip((page - 1) * limit);
            queryBuilder.take(limit);

            const [items, total] = await queryBuilder.getManyAndCount();

            return {
                items,
                meta: {
                    totalItems: total,
                    itemCount: items.length,
                    itemsPerPage: limit,
                    totalPages: Math.ceil(total / limit),
                    currentPage: page
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar mensagens', { 
                error: error.message, 
                page, 
                limit, 
                filters 
            });
            throw error;
        }
    }
}

export default ChatMessageTypeOrmRepository;

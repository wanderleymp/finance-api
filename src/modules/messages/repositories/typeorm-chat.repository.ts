import { Repository, FindManyOptions, FindOptionsWhere } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from '../entities/chat.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatParticipant } from '../entities/chat-participant.entity';

@Injectable()
export class TypeOrmChatRepository {
    constructor(
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,
        @InjectRepository(ChatMessage)
        private readonly chatMessageRepository: Repository<ChatMessage>,
        @InjectRepository(ChatParticipant)
        private readonly chatParticipantRepository: Repository<ChatParticipant>
    ) {}

    // Métodos para Chat
    async createChat(chatData: Partial<Chat>): Promise<Chat> {
        const chat = this.chatRepository.create(chatData);
        return await this.chatRepository.save(chat);
    }

    async findChatById(chatId: number): Promise<Chat | null> {
        return await this.chatRepository.findOne({ 
            where: { chatId },
            relations: ['messages', 'participants']
        });
    }

    async findChats(options?: FindManyOptions<Chat>): Promise<Chat[]> {
        return await this.chatRepository.find(options);
    }

    // Métodos para Mensagens
    async createMessage(messageData: Partial<ChatMessage>): Promise<ChatMessage> {
        const message = this.chatMessageRepository.create(messageData);
        return await this.chatMessageRepository.save(message);
    }

    async findMessagesByChatId(
        chatId: number, 
        page = 1, 
        limit = 20
    ): Promise<{ items: ChatMessage[], total: number }> {
        const [items, total] = await this.chatMessageRepository.findAndCount({
            where: { chatId } as FindOptionsWhere<ChatMessage>,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit
        });

        return {
            items,
            total
        };
    }

    // Métodos para Participantes
    async addChatParticipant(participantData: Partial<ChatParticipant>): Promise<ChatParticipant> {
        const participant = this.chatParticipantRepository.create(participantData);
        return await this.chatParticipantRepository.save(participant);
    }

    async findChatParticipants(chatId: number): Promise<ChatParticipant[]> {
        return await this.chatParticipantRepository.find({
            where: { chatId },
            relations: ['chat']
        });
    }
}

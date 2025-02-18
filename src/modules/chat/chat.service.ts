import { Injectable } from '@nestjs/common';
import { CreateChatDto, ChatResponseDto } from './chat.dto';
import { ChatRepository } from '../messages/chat.repository';

@Injectable()
export class ChatService {
    private chatRepository: ChatRepository;

    constructor() {
        this.chatRepository = new ChatRepository();
    }

    async create(createChatDto: CreateChatDto): Promise<ChatResponseDto> {
        const chat = await this.chatRepository.createChat();
        return { 
            chat: {
                id: chat.chat_id, 
                status: 'ACTIVE',
                createdAt: new Date(),
                channelId: 1, // Canal padrão
                allowReply: true,
                unreadCount: 0
            },
            channel: {
                id: 1,
                name: 'zapEsc'
            },
            participants: [],
            lastMessage: null,
            messageStatus: null
        };
    }

    async findAll(page = 1, limit = 20): Promise<any> {
        return await this.chatRepository.findAll({}, page, limit);
    }

    async findById(id: number): Promise<ChatResponseDto> {
        const chats = await this.chatRepository.findAll({ id }, 1, 1);
        return chats.items[0] || null;
    }
}
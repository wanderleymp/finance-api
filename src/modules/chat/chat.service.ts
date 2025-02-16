import { Injectable } from '@nestjs/common';
import { CreateChatDto, ChatResponseDto } from './chat.dto';

@Injectable()
export class ChatService {
    async create(createChatDto: CreateChatDto): Promise<ChatResponseDto> {
        // Implementação de criação
        return { id: 1, ...createChatDto };
    }

    async findAll(): Promise<ChatResponseDto[]> {
        // Implementação de listagem
        return [];
    }

    async findById(id: number): Promise<ChatResponseDto> {
        // Implementação de busca por ID
        return { id, name: 'Exemplo' };
    }
}
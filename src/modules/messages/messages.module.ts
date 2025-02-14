import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { TypeOrmChatRepository } from './repositories/typeorm-chat.repository';
import { ChatMessageTypeOrmRepository } from './chat-message.repository';
import { ChatMessageService } from './chat-message.service';
import { ChatMessageController } from './chat-message.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Chat, 
            ChatMessage, 
            ChatParticipant
        ])
    ],
    controllers: [ChatMessageController],
    providers: [
        TypeOrmChatRepository,
        ChatMessageTypeOrmRepository,
        ChatMessageService
    ],
    exports: [
        TypeOrmChatRepository,
        ChatMessageTypeOrmRepository,
        ChatMessageService
    ]
})
export class MessagesModule {}

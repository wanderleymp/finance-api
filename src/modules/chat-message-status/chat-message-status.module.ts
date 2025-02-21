import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessageStatusController } from './chat-message-status.controller';
import { ChatMessageStatusService } from './chat-message-status.service';
import { ChatMessageStatus } from './entities/chat-message-status.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ChatMessageStatus])],
    controllers: [ChatMessageStatusController],
    providers: [ChatMessageStatusService],
    exports: [ChatMessageStatusService]
})
export class ChatMessageStatusModule {}
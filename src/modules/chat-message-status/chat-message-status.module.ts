import { Module } from '@nestjs/common';
import { Chat-message-statusController } from './chat-message-status.controller';
import { Chat-message-statusService } from './chat-message-status.service';

@Module({
    controllers: [Chat-message-statusController],
    providers: [Chat-message-statusService]
})
export class Chat-message-statusModule {}
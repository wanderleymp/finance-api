import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatContactStatusController } from './chat-contact-status.controller';
import { ChatContactStatusService } from './chat-contact-status.service';
import { ChatContactStatus } from './entities/chat-contact-status.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ChatContactStatus])],
    controllers: [ChatContactStatusController],
    providers: [ChatContactStatusService],
    exports: [ChatContactStatusService]
})
export class ChatContactStatusModule {}
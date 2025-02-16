import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entidades
import { ChatMessage } from './entities/chat-message.entity';
import { Chat } from './entities/chat.entity';
import { Channel } from '../channels/entities/channel.entity';
import { Contact } from '../contacts/entities/contact.entity';

// Repositórios
import { ChatMessageRepository } from './chat-message.repository';
import { ChatRepository } from './repositories/chat.repository';
import { ChannelRepository } from '../channels/repositories/channel.repository';
import { ContactRepository } from '../contacts/repositories/contact.repository';

// Serviços
import { MessageSenderService } from './message-sender.service';

// Estratégias
import { MessageSendStrategySelector } from './strategies/message-send-strategy.selector';
import { WhatsappMessageSendStrategy } from './strategies/whatsapp-message-send.strategy';

// Integrações
import { EvolutionApiClient } from '../../integrations/providers/evolution-api.provider';

// Controladores
import { MessageController } from './message.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatMessage, 
      Chat, 
      Channel, 
      Contact
    ])
  ],
  controllers: [MessageController],
  providers: [
    // Repositórios
    ChatMessageRepository,
    ChatRepository,
    ChannelRepository,
    ContactRepository,

    // Serviços
    MessageSenderService,
    MessageSendStrategySelector,

    // Estratégias
    WhatsappMessageSendStrategy,

    // Integrações
    EvolutionApiClient
  ],
  exports: [
    MessageSenderService
  ]
})
export class MessageModule {}

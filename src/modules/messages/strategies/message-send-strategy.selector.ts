import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { MessageSendStrategy } from './message-send-strategy.interface';
import { WhatsappMessageSendStrategy } from './whatsapp-message-send.strategy';
import { ChannelRepository } from '../../channels/repositories/channel.repository';
import { Logger } from '../../../utils/logger';

@Injectable()
export class MessageSendStrategySelector {
  private logger: Logger;

  constructor(
    private channelRepository: ChannelRepository,
    private whatsappStrategy: WhatsappMessageSendStrategy
  ) {
    this.logger = new Logger(MessageSendStrategySelector.name);
  }

  async selectStrategy(channelId: number): Promise<MessageSendStrategy> {
    try {
      const channel = await this.channelRepository.findById(channelId, {
        include: ['integration']
      });

      if (!channel) {
        throw new UnprocessableEntityException('Canal não encontrado');
      }

      switch(channel.type) {
        case 'WHATSAPP':
          return this.whatsappStrategy;
        default:
          this.logger.warn('Canal não suportado', { 
            channelId, 
            channelType: channel.type 
          });
          throw new UnprocessableEntityException(`Canal ${channel.type} não suportado`);
      }
    } catch (error) {
      this.logger.error('Erro ao selecionar estratégia de envio', {
        error: error.message,
        channelId
      });
      throw error;
    }
  }
}

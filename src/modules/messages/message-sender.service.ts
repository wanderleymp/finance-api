import { Injectable, Logger } from '@nestjs/common';
import { MessageSendStrategySelector } from './strategies/message-send-strategy.selector';
import { ChatMessageRepository } from './chat-message.repository';
import { ChannelRepository } from '../channels/repositories/channel.repository';
import { ContactRepository } from '../contacts/repositories/contact.repository';
import { ChatRepository } from './repositories/chat.repository';

@Injectable()
export class MessageSenderService {
  private readonly logger = new Logger(MessageSenderService.name);

  constructor(
    private readonly strategySelector: MessageSendStrategySelector,
    private readonly chatMessageRepository: ChatMessageRepository,
    private readonly channelRepository: ChannelRepository,
    private readonly contactRepository: ContactRepository,
    private readonly chatRepository: ChatRepository
  ) {}

  async sendMessage(payload: {
    channelId: number,
    chatId: number,
    contactId: number,
    content: string,
    contentType: string
  }) {
    try {
      // 1. Seleciona estratégia correta
      const strategy = await this.strategySelector.selectStrategy(payload.channelId);

      // 2. Busca dados complementares
      const [chat, contact, channel] = await Promise.all([
        this.chatRepository.findById(payload.chatId),
        this.contactRepository.findById(payload.contactId),
        this.channelRepository.findById(payload.channelId)
      ]);

      // 3. Executa envio
      const sendResult = await strategy.send({
        channel,
        chat,
        contact,
        content: payload.content,
        contentType: payload.contentType
      });

      // 4. Registra mensagem
      const savedMessage = await this.chatMessageRepository.createMessage({
        chat_id: payload.chatId,
        contact_id: payload.contactId,
        content: payload.content,
        content_type: payload.contentType,
        direction: 'OUTBOUND',
        external_id: sendResult.externalId,
        status: 'SENT',
        metadata: { 
          providerResponse: sendResult.providerResponse 
        }
      });

      // 5. Log de sucesso
      this.logger.log('Mensagem enviada com sucesso', {
        messageId: savedMessage.message_id,
        externalId: sendResult.externalId
      });

      return savedMessage;
    } catch (error) {
      // Log de erro
      this.logger.error('Falha ao enviar mensagem', {
        error: error.message,
        payload
      });

      throw error;
    }
  }
}

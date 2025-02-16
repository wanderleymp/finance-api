import { Injectable } from '@nestjs/common';
import { 
  MessageSendStrategy, 
  MessageSendParams, 
  MessageSendResult 
} from './message-send-strategy.interface';
import { EvolutionApiClient } from '../../../integrations/providers/evolution-api.provider';
import { Logger } from '../../../utils/logger';

@Injectable()
export class WhatsappMessageSendStrategy implements MessageSendStrategy {
  private logger: Logger;

  constructor(
    private readonly evolutionApiClient: EvolutionApiClient
  ) {
    this.logger = new Logger(WhatsappMessageSendStrategy.name);
  }

  async send(params: MessageSendParams): Promise<MessageSendResult> {
    try {
      // Formata número de telefone
      const formattedPhone = this.formatPhoneNumber(params.contact.contactValue);

      // Envia mensagem via Evolution
      const result = await this.evolutionApiClient.sendTextMessage(
        formattedPhone, 
        params.content
      );

      // Log de sucesso
      this.logger.info('Mensagem enviada com sucesso', {
        contactId: params.contact.contactId,
        channelId: params.channel.channelId,
        externalId: result.messageId
      });

      return {
        externalId: result.messageId,
        providerResponse: result
      };
    } catch (error) {
      // Log de erro
      this.logger.error('Falha ao enviar mensagem', {
        error: error.message,
        contactId: params.contact.contactId,
        channelId: params.channel.channelId
      });

      throw error;
    }
  }

  // Método para formatar número de telefone
  private formatPhoneNumber(phone: string): string {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Adiciona código do país se não existir
    return cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  }
}

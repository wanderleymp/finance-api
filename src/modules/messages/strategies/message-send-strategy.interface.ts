import { Channel } from '../../channels/entities/channel.entity';
import { Chat } from '../entities/chat.entity';
import { Contact } from '../../contacts/entities/contact.entity';

export interface MessageSendParams {
  channel: Channel;
  chat: Chat;
  contact: Contact;
  content: string;
  contentType: string;
}

export interface MessageSendResult {
  externalId: string;
  providerResponse: any;
}

export interface MessageSendStrategy {
  send(params: MessageSendParams): Promise<MessageSendResult>;
}

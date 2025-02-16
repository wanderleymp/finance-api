import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';

@Injectable()
export class ChatMessageRepository {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly repository: Repository<ChatMessage>
  ) {}

  async create(data: Partial<ChatMessage>): Promise<ChatMessage> {
    const message = this.repository.create(data);
    return this.repository.save(message);
  }

  async update(id: number, data: Partial<ChatMessage>): Promise<ChatMessage> {
    await this.repository.update(id, {
      ...data,
      updatedAt: new Date()
    });
    return this.findById(id);
  }

  async findById(id: number): Promise<ChatMessage | null> {
    return this.repository.findOne({ 
      where: { messageId: id },
      relations: ['chat', 'contact']
    });
  }

  async findByExternalId(externalId: string): Promise<ChatMessage | null> {
    return this.repository.findOne({ 
      where: { externalId },
      relations: ['chat', 'contact']
    });
  }

  async findByChatId(chatId: number, options?: {
    limit?: number;
    offset?: number;
    order?: 'ASC' | 'DESC';
  }): Promise<ChatMessage[]> {
    return this.repository.find({
      where: { chatId },
      order: { createdAt: options?.order || 'DESC' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      relations: ['contact']
    });
  }
}

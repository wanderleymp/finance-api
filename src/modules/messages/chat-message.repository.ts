import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { logger } from '../../middlewares/logger';
import BaseRepository from '../../repositories/base/BaseRepository';

interface MessagePaginationResult {
  items: any[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

@Injectable()
export class ChatMessageRepository extends BaseRepository {
  private pool: Pool;

  constructor() {
    super('chat_messages', 'message_id');
    this.pool = new Pool(); // Configuração do pool de conexão
  }

  async findByChatId(
    chatId: number, 
    page = 1, 
    limit = 20
  ): Promise<MessagePaginationResult> {
    const client = await this.pool.connect();
    try {
      const offset = (page - 1) * limit;
      const query = `
        SELECT 
          m.*,
          COUNT(*) OVER() as total_count
        FROM chat_messages m
        WHERE m.chat_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const values = [chatId, limit, offset];

      const result = await client.query(query, values);
      const totalItems = parseInt(result.rows[0]?.total_count || '0');
      
      return {
        items: result.rows || [],
        meta: {
          totalItems,
          itemCount: result.rows?.length || 0,
          itemsPerPage: parseInt(limit.toString()),
          totalPages: Math.ceil(totalItems / limit),
          currentPage: parseInt(page.toString())
        }
      };
    } catch (error) {
      logger.error('Erro ao buscar mensagens do chat', {
        error: (error as Error).message,
        chatId,
        page,
        limit
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async findMessagesByChat(
    chatId: number, 
    page = 1, 
    limit = 20
  ): Promise<MessagePaginationResult> {
    return this.findByChatId(chatId, page, limit);
  }

  async createMessage(data: any): Promise<any> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO chat_messages (message, chat_id, created_at)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const values = [data.message, data.chatId, new Date()];

      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Erro ao criar mensagem', {
        error: (error as Error).message,
        data
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async updateMessageStatus(
    messageId: number, 
    status: string
  ): Promise<any> {
    const client = await this.pool.connect();
    try {
      const query = `
        UPDATE chat_messages
        SET status = $1, updated_at = $2
        WHERE message_id = $3
        RETURNING *
      `;
      const values = [status, new Date(), messageId];

      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Erro ao atualizar status da mensagem', {
        error: (error as Error).message,
        messageId,
        status
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async findAll(
    page = 1, 
    limit = 20, 
    filters = {}, 
    options = {}
  ): Promise<MessagePaginationResult> {
    const client = await this.pool.connect();
    try {
      const offset = (page - 1) * limit;
      const query = `
        SELECT 
          m.*,
          COUNT(*) OVER() as total_count
        FROM chat_messages m
        WHERE 1 = 1
        ${Object.keys(filters).map((key, index) => `AND m.${key} = $${index + 1}`).join(' ')}
        ORDER BY m.created_at DESC
        LIMIT $${Object.keys(filters).length + 1} OFFSET $${Object.keys(filters).length + 2}
      `;
      const values = [...Object.values(filters), limit, offset];

      const result = await client.query(query, values);
      const totalItems = parseInt(result.rows[0]?.total_count || '0');
      
      return {
        items: result.rows || [],
        meta: {
          totalItems,
          itemCount: result.rows?.length || 0,
          itemsPerPage: parseInt(limit.toString()),
          totalPages: Math.ceil(totalItems / limit),
          currentPage: parseInt(page.toString())
        }
      };
    } catch (error) {
      logger.error('Erro ao buscar mensagens', {
        error: (error as Error).message,
        page,
        limit,
        filters
      });
      throw error;
    } finally {
      client.release();
    }
  }
}

export default ChatMessageRepository;

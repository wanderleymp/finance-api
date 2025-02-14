import { 
    Controller, 
    Get, 
    Post, 
    Patch, 
    Delete, 
    Param, 
    Body, 
    Query, 
    UseGuards 
} from '@nestjs/common';
import { logger } from '../../middlewares/logger';
import { ChatMessageService } from './chat-message.service';
import { AuthGuard } from '../../middlewares/auth.guard'; // Assumindo que existe um guard de autenticação
import { CreateChatMessageDto } from './dtos/create-chat-message.dto';
import { UpdateChatMessageStatusDto } from './dtos/update-chat-message-status.dto';

@Controller('chat-messages')
@UseGuards(AuthGuard)
export class ChatMessageController {
    constructor(
        private readonly chatMessageService: ChatMessageService
    ) {}

    // Buscar mensagens de um chat
    @Get('/:chatId/messages')
    async findByChatId(
        @Param('chatId') chatId: number,
        @Query('page') page = 1,
        @Query('limit') limit = 20
    ) {
        try {
            logger.info('Buscando mensagens do chat', { chatId, page, limit });
            
            const messages = await this.chatMessageService.findByChatId(
                chatId, 
                Number(page), 
                Number(limit)
            );
            
            logger.info('Mensagens encontradas', { 
                count: messages.items.length,
                total: messages.meta.totalItems
            });
            
            return messages;
        } catch (error) {
            logger.error('Erro ao buscar mensagens', { 
                error: error.message,
                chatId,
                page,
                limit
            });
            throw error;
        }
    }

    // Criar nova mensagem
    @Post('/:chatId/messages')
    async createMessage(
        @Param('chatId') chatId: number,
        @Body() messageData: CreateChatMessageDto
    ) {
        try {
            logger.info('Criando nova mensagem', { chatId, messageData });
            
            const message = await this.chatMessageService.createMessage(
                chatId, 
                messageData
            );
            
            logger.info('Mensagem criada com sucesso', { 
                messageId: message.messageId,
                chatId: message.chatId 
            });
            
            return message;
        } catch (error) {
            logger.error('Erro ao criar mensagem', { 
                error: error.message,
                chatId,
                messageData
            });
            throw error;
        }
    }

    // Atualizar status da mensagem
    @Patch('/:messageId/status')
    async updateMessageStatus(
        @Param('messageId') messageId: number,
        @Body() statusData: UpdateChatMessageStatusDto
    ) {
        try {
            logger.info('Atualizando status da mensagem', { messageId, status: statusData.status });
            
            const updatedMessage = await this.chatMessageService.updateMessageStatus(
                messageId, 
                statusData.status
            );
            
            logger.info('Status da mensagem atualizado', { 
                messageId,
                newStatus: statusData.status 
            });
            
            return updatedMessage;
        } catch (error) {
            logger.error('Erro ao atualizar status da mensagem', { 
                error: error.message,
                messageId,
                status: statusData.status
            });
            throw error;
        }
    }

    // Excluir mensagem
    @Delete('/:messageId')
    async deleteMessage(
        @Param('messageId') messageId: number
    ) {
        try {
            logger.info('Excluindo mensagem', { messageId });
            
            await this.chatMessageService.deleteMessage(messageId);
            
            logger.info('Mensagem excluída com sucesso', { messageId });
            
            return { message: 'Mensagem excluída com sucesso' };
        } catch (error) {
            logger.error('Erro ao excluir mensagem', { 
                error: error.message,
                messageId
            });
            throw error;
        }
    }

    // Buscar todas as mensagens (com filtros)
    @Get()
    async findAll(
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query() filters = {}
    ) {
        try {
            logger.info('Buscando mensagens', { page, limit, filters });
            
            const result = await this.chatMessageService.findAll(
                Number(page), 
                Number(limit), 
                filters
            );
            
            logger.info('Mensagens encontradas', { 
                count: result.items.length,
                total: result.meta.totalItems
            });
            
            return result;
        } catch (error) {
            logger.error('Erro ao listar mensagens', {
                error: error.message,
                page,
                limit,
                filters
            });
            throw error;
        }
    }
}

export default ChatMessageController;

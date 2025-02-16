import { 
  Controller, 
  Post, 
  Body, 
  Req, 
  UseGuards, 
  HttpStatus, 
  HttpCode 
} from '@nestjs/common';
import { MessageSenderService } from './message-sender.service';
import { AuthGuard } from '../auth/auth.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('chat-messages')
export class MessageController {
  constructor(
    private readonly messageSenderService: MessageSenderService
  ) {}

  @Post('send')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Req() req: RequestWithUser,
    @Body() body: {
      channelId: number,
      chatId: number,
      contactId: number,
      content: string,
      contentType: string
    }
  ) {
    // Adiciona metadados do usuário logado
    const messagePayload = {
      ...body,
      metadata: {
        sentBy: req.user.id
      }
    };

    // Envia mensagem
    const message = await this.messageSenderService.sendMessage({
      channelId: body.channelId,
      chatId: body.chatId,
      contactId: body.contactId,
      content: body.content,
      contentType: body.contentType
    });

    return message;
  }
}

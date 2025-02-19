import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Param, 
    Query, 
    UseGuards, 
    ParseIntPipe 
} from '@nestjs/common';
import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiQuery 
} from '@nestjs/swagger';
import { AuthGuard } from '../../guards/auth.guard';
import { ChatService } from './chat.service';
import { 
    CreateChatDto, 
    ChatResponseDto, 
    ChatListResponseDto 
} from './chat.dto';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { UserPayload } from '../auth/auth.interface';

@ApiTags('Chats')
@Controller('chats')
@UseGuards(AuthGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Post()
    @ApiOperation({ summary: 'Criar um novo chat' })
    @ApiResponse({ 
        status: 201, 
        description: 'Chat criado com sucesso', 
        type: ChatResponseDto 
    })
    async create(
        @Body() createChatDto: CreateChatDto,
        @CurrentUser() user: UserPayload
    ): Promise<ChatResponseDto> {
        createChatDto.userId = user.id;
        return this.chatService.create(createChatDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar chats' })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de chats', 
        type: ChatListResponseDto 
    })
    @ApiQuery({ 
        name: 'page', 
        required: false, 
        type: Number 
    })
    @ApiQuery({ 
        name: 'limit', 
        required: false, 
        type: Number 
    })
    @ApiQuery({ 
        name: 'channelId', 
        required: false, 
        type: Number 
    })
    async findAll(
        @Query('page', new ParseIntPipe({ optional: true })) page = 1,
        @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
        @Query('channelId', new ParseIntPipe({ optional: true })) channelId?: number
    ): Promise<ChatListResponseDto> {
        const filters = channelId ? { channelId } : {};
        return this.chatService.findAll(page, limit, filters);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar chat por ID' })
    @ApiResponse({ 
        status: 200, 
        description: 'Detalhes do chat', 
        type: ChatResponseDto 
    })
    @ApiQuery({ 
        name: 'page', 
        required: false, 
        type: Number 
    })
    @ApiQuery({ 
        name: 'limit', 
        required: false, 
        type: Number 
    })
    async findById(
        @Param('id', ParseIntPipe) id: number,
        @Query('page', new ParseIntPipe({ optional: true })) page = 1,
        @Query('limit', new ParseIntPipe({ optional: true })) limit = 20
    ): Promise<ChatResponseDto | null> {
        return this.chatService.findById(id, page, limit);
    }
}
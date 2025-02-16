import { 
    Controller, 
    Post, 
    Get, 
    Put, 
    Delete, 
    Body, 
    Param 
} from '@nestjs/common';
import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiBody 
} from '@nestjs/swagger';
import { CreateChatDto, ChatResponseDto } from './chat.dto';
import { ChatService } from './chat.service';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Post()
    @ApiOperation({ summary: 'Criar novo chat' })
    @ApiBody({ type: CreateChatDto })
    @ApiResponse({ 
        status: 201, 
        description: 'chat criado com sucesso',
        type: ChatResponseDto 
    })
    async create(@Body() createChatDto: CreateChatDto): Promise<ChatResponseDto> {
        return this.chatService.create(createChatDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos os chats' })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de chats',
        type: [ChatResponseDto] 
    })
    async findAll(): Promise<ChatResponseDto[]> {
        return this.chatService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar chat por ID' })
    @ApiResponse({ 
        status: 200, 
        description: 'chat encontrado',
        type: ChatResponseDto 
    })
    @ApiResponse({ 
        status: 404, 
        description: 'chat não encontrado' 
    })
    async findById(@Param('id') id: number): Promise<ChatResponseDto> {
        return this.chatService.findById(id);
    }
}
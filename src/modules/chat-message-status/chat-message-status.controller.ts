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
import { CreateChat-message-statusDto, Chat-message-statusResponseDto } from './chat-message-status.dto';
import { Chat-message-statusService } from './chat-message-status.service';

@ApiTags('Chat-message-status')
@Controller('chat-message-status')
export class Chat-message-statusController {
    constructor(private readonly chat-message-statusService: Chat-message-statusService) {}

    @Post()
    @ApiOperation({ summary: 'Criar novo chat-message-status' })
    @ApiBody({ type: CreateChat-message-statusDto })
    @ApiResponse({ 
        status: 201, 
        description: 'chat-message-status criado com sucesso',
        type: Chat-message-statusResponseDto 
    })
    async create(@Body() createChat-message-statusDto: CreateChat-message-statusDto): Promise<Chat-message-statusResponseDto> {
        return this.chat-message-statusService.create(createChat-message-statusDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos os chat-message-statuss' })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de chat-message-statuss',
        type: [Chat-message-statusResponseDto] 
    })
    async findAll(): Promise<Chat-message-statusResponseDto[]> {
        return this.chat-message-statusService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar chat-message-status por ID' })
    @ApiResponse({ 
        status: 200, 
        description: 'chat-message-status encontrado',
        type: Chat-message-statusResponseDto 
    })
    @ApiResponse({ 
        status: 404, 
        description: 'chat-message-status não encontrado' 
    })
    async findById(@Param('id') id: number): Promise<Chat-message-statusResponseDto> {
        return this.chat-message-statusService.findById(id);
    }
}
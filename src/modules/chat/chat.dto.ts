import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChatDto {
    @ApiProperty({ description: 'Nome do chat' })
    @IsNotEmpty()
    @IsString()
    name: string;
}

export class ChatResponseDto {
    @ApiProperty({ description: 'ID do chat' })
    id: number;

    @ApiProperty({ description: 'Nome do chat' })
    name: string;
}
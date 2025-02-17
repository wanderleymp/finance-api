import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChat-message-statusDto {
    @ApiProperty({ description: 'Nome do chat-message-status' })
    @IsNotEmpty()
    @IsString()
    name: string;
}

export class Chat-message-statusResponseDto {
    @ApiProperty({ description: 'ID do chat-message-status' })
    id: number;

    @ApiProperty({ description: 'Nome do chat-message-status' })
    name: string;
}
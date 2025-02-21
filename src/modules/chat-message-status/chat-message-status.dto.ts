import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChatMessageStatusDto {
    @ApiProperty({ description: 'ID da mensagem' })
    @IsNotEmpty()
    @IsNumber()
    messageId: number;

    @ApiProperty({ description: 'ID do contato' })
    @IsNotEmpty()
    @IsNumber()
    contactId: number;

    @ApiProperty({ description: 'Status da mensagem', enum: ['UNREAD', 'READ'] })
    @IsNotEmpty()
    @IsString()
    status: string;
}

export class UpdateChatMessageStatusDto {
    @ApiProperty({ description: 'Status da mensagem', enum: ['UNREAD', 'READ'] })
    @IsNotEmpty()
    @IsString()
    status: string;
}

export class ChatMessageStatusResponseDto {
    @ApiProperty({ description: 'ID da mensagem' })
    messageId: number;

    @ApiProperty({ description: 'ID do contato' })
    contactId: number;

    @ApiProperty({ description: 'Status da mensagem', enum: ['UNREAD', 'READ'] })
    status: string;

    @ApiProperty({ description: 'Data de leitura' })
    @Type(() => Date)
    @IsOptional()
    readAt?: Date;

    @ApiProperty({ description: 'Data de criação' })
    @Type(() => Date)
    createdAt: Date;

    @ApiProperty({ description: 'Data de atualização' })
    @Type(() => Date)
    updatedAt: Date;
}
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsDate, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChatContactStatusDto {
    @ApiProperty({ description: 'ID do contato' })
    @IsNotEmpty()
    @IsNumber()
    contactId: number;

    @ApiProperty({ description: 'ID do chat' })
    @IsNotEmpty()
    @IsNumber()
    chatId: number;

    @ApiProperty({ description: 'Status online' })
    @IsBoolean()
    isOnline: boolean;

    @ApiProperty({ description: 'Status de digitação' })
    @IsBoolean()
    isTyping: boolean;
}

export class UpdateChatContactStatusDto {
    @ApiProperty({ description: 'Status online' })
    @IsOptional()
    @IsBoolean()
    isOnline?: boolean;

    @ApiProperty({ description: 'Status de digitação' })
    @IsOptional()
    @IsBoolean()
    isTyping?: boolean;
}

export class ChatContactStatusResponseDto {
    @ApiProperty({ description: 'ID do contato' })
    contactId: number;

    @ApiProperty({ description: 'ID do chat' })
    chatId: number;

    @ApiProperty({ description: 'Status online' })
    isOnline: boolean;

    @ApiProperty({ description: 'Último acesso' })
    @Type(() => Date)
    @IsOptional()
    lastSeen?: Date;

    @ApiProperty({ description: 'Status de digitação' })
    isTyping: boolean;

    @ApiProperty({ description: 'Data de atualização' })
    @Type(() => Date)
    updatedAt: Date;
}
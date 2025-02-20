import { 
    IsString, 
    IsOptional, 
    IsEnum, 
    IsObject,
    ValidateIf,
    IsNotEmpty,
    MaxLength,
    IsBoolean,
    IsNumber
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateChatMessageDto {
    @ApiProperty({ description: 'ID do chat', required: true })
    @IsNotEmpty({ message: 'ID do chat é obrigatório' })
    @IsNumber()
    chat_id: number;

    @ApiProperty({ description: 'Remote JID do contato', required: true })
    @IsNotEmpty({ message: 'Remote JID é obrigatório' })
    @IsString()
    remoteJid: string;

    @ApiProperty({ 
        description: 'Tipo de mensagem', 
        required: true, 
        enum: ['text', 'audio', 'image', 'video', 'document'] 
    })
    @IsNotEmpty({ message: 'Tipo de mensagem é obrigatório' })
    @IsEnum(['text', 'audio', 'image', 'video', 'document'], { message: 'Tipo de mensagem inválido' })
    messageType: 'text' | 'audio' | 'image' | 'video' | 'document';

    @ApiProperty({ description: 'Conteúdo da mensagem', required: false })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiProperty({ description: 'Conteúdo de áudio em base64', required: false })
    @ValidateIf(o => o.messageType === 'audio')
    @IsNotEmpty({ message: 'Conteúdo de áudio base64 é obrigatório para mensagens de áudio' })
    @IsString()
    @MaxLength(50 * 1024 * 1024, { message: 'Tamanho máximo do arquivo de áudio excedido (50MB)' })
    base64?: string;

    @ApiProperty({ 
        description: 'Direção da mensagem', 
        required: false, 
        default: 'INBOUND', 
        enum: ['INBOUND', 'OUTBOUND'] 
    })
    @IsOptional()
    @IsEnum(['INBOUND', 'OUTBOUND'])
    direction?: 'INBOUND' | 'OUTBOUND' = 'INBOUND';

    @ApiProperty({ 
        description: 'Status da mensagem', 
        required: false, 
        default: 'PENDING',
        enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'] 
    })
    @IsOptional()
    @IsEnum(['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'])
    status?: string = 'PENDING';

    @ApiProperty({ description: 'Metadados da mensagem', required: false })
    @IsOptional()
    @IsObject()
    metadata?: {
        duration?: number;
        filename?: string;
        size?: number;
        mime_type?: string;
        instance?: string;
        apikey?: string;
    } = {};

    @ApiProperty({ description: 'Indica se a mensagem foi enviada pelo usuário', required: false, default: false })
    @IsOptional()
    @IsBoolean()
    fromMe?: boolean = false;

    @ApiProperty({ description: 'Remetente da mensagem', required: false })
    @IsOptional()
    @IsString()
    sender?: string;

    @ApiProperty({ description: 'Nome do remetente', required: false })
    @IsOptional()
    @IsString()
    pushName?: string;

    @ApiProperty({ description: 'URL do servidor', required: false })
    @IsOptional()
    @IsString()
    serverUrl?: string;
}

module.exports = {
    CreateChatMessageDto
};

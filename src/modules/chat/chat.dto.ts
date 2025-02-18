import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsDate, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class ChannelDto {
    @ApiProperty({ description: 'ID do canal' })
    @IsNumber()
    id: number;

    @ApiProperty({ description: 'Nome do canal' })
    @IsString()
    name: string;
}

export class ContactDto {
    @ApiProperty({ description: 'ID do contato' })
    @IsNumber()
    contactId: number;

    @ApiProperty({ description: 'Nome do contato' })
    @IsString()
    contactName: string;

    @ApiProperty({ description: 'Valor do contato (número/email)' })
    @IsString()
    @IsOptional()
    contactValue?: string;

    @ApiProperty({ description: 'URL da foto de perfil' })
    @IsString()
    @IsOptional()
    profilePicUrl?: string;
}

export class MessageStatusDto {
    @ApiProperty({ description: 'ID da mensagem' })
    @IsNumber()
    @IsOptional()
    messageId?: number;

    @ApiProperty({ description: 'Status da mensagem' })
    @IsString()
    @IsOptional()
    status?: string;
}

export class LastMessageDto {
    @ApiProperty({ description: 'ID da mensagem' })
    @IsNumber()
    @IsOptional()
    id?: number;

    @ApiProperty({ description: 'Conteúdo da mensagem' })
    @IsString()
    @IsOptional()
    content?: string;

    @ApiProperty({ description: 'Tipo de conteúdo' })
    @IsString()
    @IsOptional()
    contentType?: string;

    @ApiProperty({ description: 'Direção da mensagem' })
    @IsString()
    @IsOptional()
    direction?: string;

    @ApiProperty({ description: 'Data de criação' })
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    createdAt?: Date;

    @ApiProperty({ description: 'Hora formatada' })
    @IsString()
    @IsOptional()
    formattedTime?: string;
}

export class ChatDetailsDto {
    @ApiProperty({ description: 'ID do chat' })
    @IsNumber()
    id: number;

    @ApiProperty({ description: 'Status do chat' })
    @IsString()
    status: string;

    @ApiProperty({ description: 'Data de criação' })
    @IsDate()
    @Type(() => Date)
    createdAt: Date;

    @ApiProperty({ description: 'Data de atualização' })
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    updatedAt?: Date;

    @ApiProperty({ description: 'ID do canal' })
    @IsNumber()
    channelId: number;

    @ApiProperty({ description: 'Permite resposta' })
    @IsBoolean()
    allowReply: boolean;

    @ApiProperty({ description: 'Contagem de mensagens não lidas' })
    @IsNumber()
    unreadCount: number;
}

export class ChatResponseDto {
    @ApiProperty({ description: 'Detalhes do chat' })
    @Type(() => ChatDetailsDto)
    chat: ChatDetailsDto;

    @ApiProperty({ description: 'Detalhes do canal' })
    @Type(() => ChannelDto)
    channel: ChannelDto;

    @ApiProperty({ description: 'Última mensagem' })
    @Type(() => LastMessageDto)
    @IsOptional()
    lastMessage?: LastMessageDto;

    @ApiProperty({ description: 'Participantes do chat' })
    @Type(() => ContactDto)
    @IsArray()
    participants: ContactDto[];

    @ApiProperty({ description: 'Status da mensagem' })
    @Type(() => MessageStatusDto)
    @IsOptional()
    messageStatus?: MessageStatusDto;
}

export class ChatListResponseDto {
    @ApiProperty({ description: 'Itens da lista de chats' })
    @Type(() => ChatResponseDto)
    items: ChatResponseDto[];

    @ApiProperty({ description: 'Metadados da lista' })
    @IsNumber()
    meta: {
        @ApiProperty({ description: 'Total de itens' })
        totalItems: number;

        @ApiProperty({ description: 'Contagem de itens' })
        itemCount: number;

        @ApiProperty({ description: 'Itens por página' })
        itemsPerPage: number;

        @ApiProperty({ description: 'Total de páginas' })
        totalPages: number;

        @ApiProperty({ description: 'Página atual' })
        currentPage: number;
    };
}
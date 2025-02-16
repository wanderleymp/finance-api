import { 
    IsString, 
    IsOptional, 
    IsEnum, 
    IsObject,
    ValidateIf 
} from 'class-validator';

export class CreateChatMessageDto {
    @IsOptional()
    @IsString()
    chat_id?: number;

    @IsOptional()
    @IsString()
    remoteJid?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsEnum(['INBOUND', 'OUTBOUND'])
    direction?: 'INBOUND' | 'OUTBOUND' = 'OUTBOUND';

    @IsOptional()
    @IsEnum(['SENT', 'DELIVERED', 'READ'])
    status?: string = 'SENT';

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any> = {};

    @IsOptional()
    @IsString()
    text?: string;

    @IsOptional()
    fromMe?: boolean;

    @IsOptional()
    source?: string;
}

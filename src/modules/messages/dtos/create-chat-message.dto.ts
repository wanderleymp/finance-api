import { 
    IsString, 
    IsOptional, 
    IsEnum, 
    IsObject 
} from 'class-validator';

export class CreateChatMessageDto {
    @IsString()
    content: string;

    @IsOptional()
    @IsEnum(['INBOUND', 'OUTBOUND'])
    direction?: 'INBOUND' | 'OUTBOUND' = 'OUTBOUND';

    @IsOptional()
    @IsEnum(['SENT', 'DELIVERED', 'READ'])
    status?: string = 'SENT';

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any> = {};
}

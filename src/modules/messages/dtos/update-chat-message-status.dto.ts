import { 
    IsString, 
    IsEnum 
} from 'class-validator';

export class UpdateChatMessageStatusDto {
    @IsString()
    @IsEnum(['SENT', 'DELIVERED', 'READ', 'FAILED'])
    status: string;
}

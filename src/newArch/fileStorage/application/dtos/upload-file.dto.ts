import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UploadFileDto {
  @IsString()
  fileName: string;

  @IsString()
  contentType: string;

  @IsNumber()
  size: number;

  @IsOptional()
  metadata?: Record<string, string>;
}

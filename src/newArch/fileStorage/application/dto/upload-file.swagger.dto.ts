import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class UploadFileSwaggerDto {
  @ApiProperty({
    description: 'Nome do arquivo',
    example: 'documento.pdf'
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'Tipo de conteúdo do arquivo',
    example: 'application/pdf'
  })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
    example: 1024
  })
  @IsNumber()
  @IsNotEmpty()
  size: number;

  @ApiProperty({
    description: 'Metadados adicionais do arquivo (opcional)',
    example: { description: 'Relatório financeiro' },
    required: false
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UploadFileResponseDto {
  @ApiProperty({
    description: 'ID único do arquivo armazenado',
    example: '1705987200-arquivo.pdf'
  })
  @IsString()
  @IsNotEmpty()
  fileId: string;
}

export class FileMetadataSwaggerDto {
  @ApiProperty({
    description: 'Nome do arquivo',
    example: 'documento.pdf'
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'Tipo de conteúdo do arquivo',
    example: 'application/pdf'
  })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
    example: 1024
  })
  @IsNumber()
  @IsNotEmpty()
  size: number;

  @ApiProperty({
    description: 'Data da última modificação',
    example: '2024-01-22T10:30:00Z'
  })
  @IsString()
  @IsNotEmpty()
  lastModified: Date;
}

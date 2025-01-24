import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class FileUploadSwaggerDto {
  @ApiProperty({ 
    description: 'Nome do arquivo', 
    example: 'documento.pdf' 
  })
  @IsString()
  fileName: string;

  @ApiProperty({ 
    description: 'Tipo de conteúdo do arquivo', 
    example: 'application/pdf' 
  })
  @IsString()
  contentType: string;

  @ApiProperty({ 
    description: 'Tamanho do arquivo em bytes', 
    example: 1024 
  })
  @IsNumber()
  size: number;

  @ApiProperty({ 
    description: 'Metadados adicionais do arquivo', 
    required: false,
    example: { 
      category: 'documentos', 
      owner: 'usuario123' 
    } 
  })
  @IsOptional()
  metadata?: Record<string, string>;
}

export class FileUploadResponseSwaggerDto {
  @ApiProperty({ 
    description: 'ID único do arquivo armazenado', 
    example: 'file-123456' 
  })
  fileId: string;
}

export class FileListItemSwaggerDto {
  @ApiProperty({ 
    description: 'Nome do arquivo', 
    example: 'documento.pdf' 
  })
  fileName: string;

  @ApiProperty({ 
    description: 'Tipo de conteúdo do arquivo', 
    example: 'application/pdf' 
  })
  contentType: string;

  @ApiProperty({ 
    description: 'Tamanho do arquivo em bytes', 
    example: 1024 
  })
  size: number;

  @ApiProperty({ 
    description: 'Data de upload do arquivo', 
    example: '2025-01-24T08:00:00Z' 
  })
  uploadDate?: Date;
}

import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Param, 
  UploadedFile, 
  UseInterceptors, 
  Query, 
  UseFilters 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiConsumes, 
  ApiBody, 
  ApiQuery 
} from '@nestjs/swagger';
import { FileStorageDomainService } from '../../domain/services/file-storage.domain.service';
import { FileStorageExceptionFilter } from '../filters/file-storage-exception.filter';
import { 
  UploadFileSwaggerDto, 
  UploadFileResponseDto, 
  FileMetadataSwaggerDto 
} from '../dto/upload-file.swagger.dto';

@ApiTags('Armazenamento de Arquivos')
@Controller('files')
@UseFilters(FileStorageExceptionFilter)
export class FileStorageController {
  constructor(
    private readonly fileStorageService: FileStorageDomainService
  ) {}

  @Post('upload')
  @ApiOperation({ 
    summary: 'Fazer upload de um arquivo', 
    description: 'Realiza o upload de um arquivo para armazenamento' 
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Arquivo para upload',
    type: UploadFileSwaggerDto
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Upload realizado com sucesso', 
    type: UploadFileResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Erro de validação ou tamanho de arquivo inválido' 
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File
  ): Promise<{ fileId: string }> {
    const fileBuffer = file.buffer;
    const metadata = {
      fileName: file.originalname,
      contentType: file.mimetype,
      size: file.size
    };

    const fileId = await this.fileStorageService.uploadFile(fileBuffer, metadata);
    return { fileId };
  }

  @Get('download/:fileId')
  @ApiOperation({ 
    summary: 'Baixar um arquivo', 
    description: 'Realiza o download de um arquivo pelo seu ID' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Download realizado com sucesso' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Arquivo não encontrado' 
  })
  async downloadFile(
    @Param('fileId') fileId: string
  ): Promise<Buffer> {
    return this.fileStorageService.downloadFile(fileId);
  }

  @Delete(':fileId')
  @ApiOperation({ 
    summary: 'Excluir um arquivo', 
    description: 'Exclui um arquivo pelo seu ID' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Arquivo excluído com sucesso' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Arquivo não encontrado' 
  })
  async deleteFile(
    @Param('fileId') fileId: string
  ): Promise<void> {
    await this.fileStorageService.deleteFile(fileId);
  }

  @Get('list')
  @ApiOperation({ 
    summary: 'Listar arquivos', 
    description: 'Lista arquivos armazenados, com suporte a prefixo e limite' 
  })
  @ApiQuery({ 
    name: 'prefix', 
    required: false, 
    description: 'Prefixo para filtrar arquivos' 
  })
  @ApiQuery({ 
    name: 'maxKeys', 
    required: false, 
    description: 'Número máximo de arquivos a retornar' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de arquivos retornada com sucesso', 
    type: [FileMetadataSwaggerDto] 
  })
  async listFiles(
    @Query('prefix') prefix?: string,
    @Query('maxKeys') maxKeys?: number
  ): Promise<FileMetadataSwaggerDto[]> {
    return this.fileStorageService.listFiles(prefix, maxKeys);
  }
}

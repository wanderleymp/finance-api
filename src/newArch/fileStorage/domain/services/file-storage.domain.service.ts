import { Injectable } from '@nestjs/common';
import { FileStorageAdapter } from '../../infra/adapters/file-storage.adapter';
import { FileMetadata } from '../interfaces/file-metadata.interface';
import { FileStorageLoggerService } from '../../infra/services/file-storage-logger.service';
import { FileStorageMetricsService } from '../../infra/services/file-storage-metrics.service';

@Injectable()
export class FileStorageDomainService {
  constructor(
    private readonly fileStorageAdapter: FileStorageAdapter,
    private readonly loggerService: FileStorageLoggerService,
    private readonly metricsService: FileStorageMetricsService
  ) {}

  async uploadFile(
    file: Buffer, 
    metadata: FileMetadata, 
    maxSizeInMB: number = 10
  ): Promise<string> {
    const startTime = Date.now();
    console.log('Iniciando upload de arquivo', { metadata, fileSize: file.length });

    try {
      // Validações de negócio
      this.validateFileSize(metadata.size, maxSizeInMB);
      this.validateFileType(metadata.contentType);

      const defaultBucketName = 'finance';
      const finalMetadata = {
        ...metadata,
        bucketName: metadata.bucketName || defaultBucketName
      };

      console.log('Metadados finais', { finalMetadata });

      // Upload do arquivo
      const fileId = await this.fileStorageAdapter.uploadFile(file, finalMetadata);

      console.log('Upload concluído', { fileId });

      // Log e métricas
      this.loggerService.logFileUpload(finalMetadata, fileId);
      this.metricsService.recordUpload(finalMetadata.contentType, finalMetadata.size);
      this.loggerService.logPerformance('uploadFile', startTime);

      return fileId;
    } catch (error) {
      console.error('Erro no upload de arquivo', error);
      this.loggerService.logError('uploadFile', error);
      this.metricsService.recordError(error.constructor.name);
      throw error;
    }
  }

  private validateFileSize(fileSize: number, maxSizeInMB: number): void {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (fileSize > maxSizeInBytes) {
      throw new Error('Arquivo excede o tamanho máximo');
    }
  }

  private validateFileType(contentType: string): void {
    const allowedTypes = [
      'text/plain', 
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'application/json', 
      'text/csv'
    ];

    if (!allowedTypes.includes(contentType)) {
      throw new Error('Tipo de arquivo não permitido');
    }
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      const startTime = Date.now();
      const file = await this.fileStorageAdapter.downloadFile(fileId);

      this.loggerService.logFileDownload(fileId);
      this.metricsService.recordDownload('application/octet-stream', file.length);
      this.loggerService.logPerformance('downloadFile', startTime);

      return file;
    } catch (error) {
      this.loggerService.logError('downloadFile', error);
      this.metricsService.recordError(error.constructor.name);
      throw error;
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      const startTime = Date.now();
      await this.fileStorageAdapter.deleteFile(fileId);

      this.loggerService.logFileDelete(fileId);
      this.metricsService.recordDelete();
      this.loggerService.logPerformance('deleteFile', startTime);
    } catch (error) {
      this.loggerService.logError('deleteFile', error);
      this.metricsService.recordError(error.constructor.name);
      throw error;
    }
  }

  async listFiles(prefix?: string, bucketName?: string): Promise<FileMetadata[]> {
    try {
      const startTime = Date.now();
      const defaultBucketName = 'finance';
      const files = await this.fileStorageAdapter.listFiles(prefix, defaultBucketName);

      this.loggerService.logPerformance('listFiles', startTime);

      return files;
    } catch (error) {
      this.loggerService.logError('listFiles', error);
      this.metricsService.recordError(error.constructor.name);
      throw error;
    }
  }
}

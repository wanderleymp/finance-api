import { Injectable, Logger } from '@nestjs/common';
import { FileMetadata } from '../../domain/interfaces/file-metadata.interface';

@Injectable()
export class FileStorageLoggerService {
  private readonly logger = new Logger(FileStorageLoggerService.name);

  logFileUpload(metadata: FileMetadata, fileId: string): void {
    this.logger.log(JSON.stringify({
      event: 'FILE_UPLOAD',
      fileName: metadata.fileName,
      fileSize: metadata.size,
      contentType: metadata.contentType,
      fileId: fileId
    }));
  }

  logFileDownload(fileId: string, metadata?: FileMetadata): void {
    this.logger.log(JSON.stringify({
      event: 'FILE_DOWNLOAD',
      fileId: fileId,
      fileName: metadata?.fileName,
      contentType: metadata?.contentType
    }));
  }

  logFileDelete(fileId: string, metadata?: FileMetadata): void {
    this.logger.log(JSON.stringify({
      event: 'FILE_DELETE',
      fileId: fileId,
      fileName: metadata?.fileName
    }));
  }

  logError(context: string, error: Error): void {
    this.logger.error(JSON.stringify({
      event: 'FILE_STORAGE_ERROR',
      context: context,
      errorMessage: error.message,
      errorStack: error.stack
    }));
  }

  logPerformance(method: string, startTime: number): void {
    const duration = Date.now() - startTime;
    this.logger.log(JSON.stringify({
      event: 'FILE_STORAGE_PERFORMANCE',
      method: method,
      durationMs: duration
    }));
  }
}

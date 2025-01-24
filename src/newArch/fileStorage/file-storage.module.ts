import { Module } from '@nestjs/common';
import { FileStorageDomainService } from './domain/services/file-storage.domain.service';
import { FileStorageAdapter } from './infra/adapters/file-storage.adapter';
import { MinioStorageProvider } from './infra/providers/minio-storage.provider';
import { FileStorageLoggerService } from './infra/services/file-storage-logger.service';
import { FileStorageMetricsService } from './infra/services/file-storage-metrics.service';

@Module({
  providers: [
    FileStorageDomainService,
    FileStorageAdapter,
    MinioStorageProvider,
    FileStorageLoggerService,
    FileStorageMetricsService
  ],
  exports: [FileStorageDomainService]
})
export class FileStorageModule {}

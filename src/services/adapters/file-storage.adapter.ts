import { FileStorageInterface } from '../../domain/interfaces/file-storage.interface';
import { FileMetadata } from '../../domain/interfaces/file-metadata.interface';
import { MinioStorageProvider } from '../providers/minio-storage.provider';

export class FileStorageAdapter implements FileStorageInterface {
  private storageProvider: FileStorageInterface;

  constructor(provider?: FileStorageInterface) {
    this.storageProvider = provider || new MinioStorageProvider();
  }

  async uploadFile(file: Buffer, metadata: FileMetadata): Promise<string> {
    return this.storageProvider.uploadFile(file, metadata);
  }

  async downloadFile(fileId: string, bucketName?: string): Promise<Buffer> {
    return this.storageProvider.downloadFile(fileId, bucketName);
  }

  async deleteFile(fileId: string, bucketName?: string): Promise<void> {
    return this.storageProvider.deleteFile(fileId, bucketName);
  }

  async listFiles(options: { prefix?: string; bucketName?: string; maxKeys?: number }): Promise<FileMetadata[]> {
    return this.storageProvider.listFiles(options);
  }
}

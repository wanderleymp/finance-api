import { FileMetadata } from './file-metadata.interface';

export interface ListFilesOptions {
  prefix?: string;
  bucketName?: string;
  maxKeys?: number;
}

export interface FileStorageInterface {
  uploadFile(file: Buffer, metadata: FileMetadata): Promise<string>;
  downloadFile(fileId: string, bucketName?: string): Promise<Buffer>;
  deleteFile(fileId: string, bucketName?: string): Promise<void>;
  listFiles(options?: ListFilesOptions): Promise<FileMetadata[]>;
}

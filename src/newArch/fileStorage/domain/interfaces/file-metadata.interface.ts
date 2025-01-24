export interface FileMetadata {
  id?: string;
  fileName: string;
  contentType: string;
  size: number;
  bucketName?: string;
  uploadDate?: Date;
  metadata?: Record<string, string>;
}

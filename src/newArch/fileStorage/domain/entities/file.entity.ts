import { FileMetadata } from '../interfaces/file-metadata.interface';

export class FileEntity {
  private metadata: FileMetadata;
  private content: Buffer;

  constructor(metadata: FileMetadata, content: Buffer) {
    this.metadata = metadata;
    this.content = content;
  }

  getMetadata(): FileMetadata {
    return this.metadata;
  }

  getContent(): Buffer {
    return this.content;
  }
}

import { FileStorageInterface } from '../interfaces/file-storage.interface';
import { FileMetadata } from '../interfaces/file-metadata.interface';

export class UploadFileUseCase {
  constructor(private fileStorageService: FileStorageInterface) {}

  async execute(file: Buffer, metadata: FileMetadata): Promise<string> {
    // Validações e regras de negócio podem ser adicionadas aqui
    return this.fileStorageService.uploadFile(file, metadata);
  }
}

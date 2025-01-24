import { Test, TestingModule } from '@nestjs/testing';
import { FileStorageModule } from '../file-storage.module';
import { FileStorageDomainService } from '../domain/services/file-storage.domain.service';
import { FileStorageAdapter } from '../infra/adapters/file-storage.adapter';
import { MinioStorageProvider } from '../infra/providers/minio-storage.provider';
import { FileMetadata } from '../domain/interfaces/file-metadata.interface';
import { FileStorageLoggerService } from '../infra/services/file-storage-logger.service';
import { FileStorageMetricsService } from '../infra/services/file-storage-metrics.service';

describe('FileStorageModule (Integração)', () => {
  let moduleRef: TestingModule;
  let fileStorageService: FileStorageDomainService;

  // Dados de teste
  const testFile = Buffer.from('Conteúdo de teste para arquivo');
  const testMetadata: FileMetadata = {
    fileName: 'teste.txt',
    contentType: 'text/plain',
    size: testFile.length,
    bucketName: 'finance'
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [FileStorageModule]
    }).compile();

    fileStorageService = moduleRef.get<FileStorageDomainService>(FileStorageDomainService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('Upload de Arquivos', () => {
    it('deve fazer upload de um arquivo com sucesso', async () => {
      const fileId = await fileStorageService.uploadFile(testFile, testMetadata);
      
      expect(fileId).toBeDefined();
      expect(typeof fileId).toBe('string');
    });

    it('deve lançar erro para arquivo muito grande', async () => {
      const largeFile = Buffer.alloc(20 * 1024 * 1024); // 20MB
      const largeFileMetadata: FileMetadata = {
        fileName: 'large-file.txt',
        contentType: 'text/plain',
        size: largeFile.length,
        bucketName: 'finance'
      };

      await expect(
        fileStorageService.uploadFile(largeFile, largeFileMetadata)
      ).rejects.toThrow('Arquivo excede o tamanho máximo');
    });

    it('deve lançar erro para tipo de arquivo não permitido', async () => {
      const invalidFile = Buffer.from('Conteúdo de teste');
      const invalidMetadata: FileMetadata = {
        fileName: 'invalid.txt',
        contentType: 'application/x-executable',
        size: invalidFile.length,
        bucketName: 'finance'
      };

      await expect(
        fileStorageService.uploadFile(invalidFile, invalidMetadata)
      ).rejects.toThrow('Tipo de arquivo não permitido');
    });
  });

  describe('Download de Arquivos', () => {
    let uploadedFileId: string;

    beforeEach(async () => {
      uploadedFileId = await fileStorageService.uploadFile(testFile, testMetadata);
    });

    it('deve fazer download de um arquivo com sucesso', async () => {
      const downloadedFile = await fileStorageService.downloadFile(uploadedFileId);
      
      expect(downloadedFile).toBeDefined();
      expect(downloadedFile).toEqual(testFile);
    });

    it('deve lançar erro para arquivo inexistente', async () => {
      await expect(
        fileStorageService.downloadFile('arquivo-inexistente')
      ).rejects.toThrow();
    });
  });

  describe('Exclusão de Arquivos', () => {
    let uploadedFileId: string;

    beforeEach(async () => {
      uploadedFileId = await fileStorageService.uploadFile(testFile, testMetadata);
    });

    it('deve excluir um arquivo com sucesso', async () => {
      await expect(
        fileStorageService.deleteFile(uploadedFileId)
      ).resolves.not.toThrow();

      // Tentar baixar arquivo excluído deve lançar erro
      await expect(
        fileStorageService.downloadFile(uploadedFileId)
      ).rejects.toThrow();
    });

    it('deve lançar erro ao tentar excluir arquivo inexistente', async () => {
      await expect(
        fileStorageService.deleteFile('arquivo-inexistente')
      ).rejects.toThrow();
    });
  });

  describe('Listagem de Arquivos', () => {
    beforeEach(async () => {
      // Upload de alguns arquivos de teste
      await fileStorageService.uploadFile(
        Buffer.from('Arquivo 1'), 
        { fileName: 'arquivo1.txt', contentType: 'text/plain', size: 9, bucketName: 'finance' }
      );
      await fileStorageService.uploadFile(
        Buffer.from('Arquivo 2'), 
        { fileName: 'arquivo2.txt', contentType: 'text/plain', size: 9, bucketName: 'finance' }
      );
    });

    it('deve listar arquivos com sucesso', async () => {
      const files = await fileStorageService.listFiles();
      
      expect(files).toBeDefined();
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(1);
    });

    it('deve listar arquivos com prefixo', async () => {
      const files = await fileStorageService.listFiles('arquivo', 'finance');
      
      expect(files).toBeDefined();
      expect(files.some(file => file.fileName.startsWith('arquivo'))).toBe(true);
    });
  });
});

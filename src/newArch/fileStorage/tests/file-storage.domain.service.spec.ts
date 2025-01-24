import { Test, TestingModule } from '@nestjs/testing';
import { FileStorageDomainService } from '../domain/services/file-storage.domain.service';
import { FileStorageAdapter } from '../infra/adapters/file-storage.adapter';
import { mock, MockProxy } from 'jest-mock-extended';

describe('FileStorageDomainService', () => {
  let service: FileStorageDomainService;
  let mockFileStorageAdapter: MockProxy<FileStorageAdapter>;

  beforeEach(async () => {
    mockFileStorageAdapter = mock<FileStorageAdapter>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileStorageDomainService,
        {
          provide: FileStorageAdapter,
          useValue: mockFileStorageAdapter
        }
      ]
    }).compile();

    service = module.get<FileStorageDomainService>(FileStorageDomainService);
  });

  describe('uploadFile', () => {
    it('deve fazer upload de arquivo válido', async () => {
      const mockBuffer = Buffer.from('test file content');
      const mockMetadata = {
        fileName: 'test.txt',
        contentType: 'text/plain',
        size: 1024,
        bucketName: 'test-bucket'
      };

      mockFileStorageAdapter.uploadFile.mockResolvedValue('file-id-123');

      const result = await service.uploadFile(mockBuffer, mockMetadata);

      expect(result).toBe('file-id-123');
      expect(mockFileStorageAdapter.uploadFile).toHaveBeenCalledWith(mockBuffer, mockMetadata);
    });

    it('deve lançar erro para arquivo muito grande', async () => {
      const mockBuffer = Buffer.from('large file content');
      const mockMetadata = {
        fileName: 'large.txt',
        contentType: 'text/plain',
        size: 20 * 1024 * 1024, // 20MB
        bucketName: 'test-bucket'
      };

      await expect(service.uploadFile(mockBuffer, mockMetadata))
        .rejects.toThrow('Arquivo excede o tamanho máximo de 10MB');
    });

    it('deve lançar erro para tipo de arquivo não permitido', async () => {
      const mockBuffer = Buffer.from('video content');
      const mockMetadata = {
        fileName: 'video.mp4',
        contentType: 'video/mp4',
        size: 1024,
        bucketName: 'test-bucket'
      };

      await expect(service.uploadFile(mockBuffer, mockMetadata))
        .rejects.toThrow('Tipo de arquivo não permitido');
    });
  });

  describe('downloadFile', () => {
    it('deve baixar arquivo existente', async () => {
      const mockBuffer = Buffer.from('file content');
      mockFileStorageAdapter.downloadFile.mockResolvedValue(mockBuffer);

      const result = await service.downloadFile('file-id-123');

      expect(result).toEqual(mockBuffer);
      expect(mockFileStorageAdapter.downloadFile).toHaveBeenCalledWith('file-id-123');
    });

    it('deve lançar erro para ID de arquivo não fornecido', async () => {
      await expect(service.downloadFile(''))
        .rejects.toThrow('ID do arquivo não fornecido');
    });
  });

  describe('deleteFile', () => {
    it('deve deletar arquivo existente', async () => {
      mockFileStorageAdapter.deleteFile.mockResolvedValue();

      await service.deleteFile('file-id-123');

      expect(mockFileStorageAdapter.deleteFile).toHaveBeenCalledWith('file-id-123');
    });

    it('deve lançar erro para ID de arquivo não fornecido', async () => {
      await expect(service.deleteFile(''))
        .rejects.toThrow('ID do arquivo não fornecido');
    });
  });

  describe('listFiles', () => {
    it('deve listar arquivos', async () => {
      const mockFiles = [
        {
          fileName: 'test1.txt',
          contentType: 'text/plain',
          size: 1024,
          bucketName: 'test-bucket'
        },
        {
          fileName: 'test2.txt',
          contentType: 'text/plain',
          size: 2048,
          bucketName: 'test-bucket'
        }
      ];

      mockFileStorageAdapter.listFiles.mockResolvedValue(mockFiles);

      const result = await service.listFiles();

      expect(result).toEqual(mockFiles);
      expect(mockFileStorageAdapter.listFiles).toHaveBeenCalled();
    });
  });
});

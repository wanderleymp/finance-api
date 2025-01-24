import { Test, TestingModule } from '@nestjs/testing';
import { FileStorageController } from '../application/controllers/file-storage.controller';
import { FileStorageDomainService } from '../domain/services/file-storage.domain.service';
import { mock, MockProxy } from 'jest-mock-extended';

describe('FileStorageController', () => {
  let controller: FileStorageController;
  let mockFileStorageService: MockProxy<FileStorageDomainService>;

  beforeEach(async () => {
    mockFileStorageService = mock<FileStorageDomainService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileStorageController],
      providers: [
        {
          provide: FileStorageDomainService,
          useValue: mockFileStorageService
        }
      ]
    }).compile();

    controller = module.get<FileStorageController>(FileStorageController);
  });

  describe('uploadFile', () => {
    it('deve fazer upload de arquivo', async () => {
      const mockFile = {
        buffer: Buffer.from('test content'),
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: 1024
      } as Express.Multer.File;

      const mockMetadata = {
        fileName: 'test.txt',
        contentType: 'text/plain',
        size: 1024,
        bucketName: 'agilefinance'
      };

      mockFileStorageService.uploadFile.mockResolvedValue('file-id-123');

      const result = await controller.uploadFile(mockFile, {});

      expect(result).toEqual({ fileId: 'file-id-123' });
      expect(mockFileStorageService.uploadFile).toHaveBeenCalledWith(
        mockFile.buffer, 
        expect.objectContaining(mockMetadata)
      );
    });

    it('deve lançar erro quando nenhum arquivo for enviado', async () => {
      await expect(controller.uploadFile(null, {}))
        .rejects.toThrow('Nenhum arquivo enviado');
    });
  });

  describe('listFiles', () => {
    it('deve listar arquivos', async () => {
      const mockFiles = [
        {
          fileName: 'test1.txt',
          contentType: 'text/plain',
          size: 1024,
          bucketName: 'agilefinance'
        }
      ];

      mockFileStorageService.listFiles.mockResolvedValue(mockFiles);

      const result = await controller.listFiles();

      expect(result).toEqual(mockFiles);
      expect(mockFileStorageService.listFiles).toHaveBeenCalled();
    });
  });

  describe('downloadFile', () => {
    it('deve baixar arquivo', async () => {
      const mockBuffer = Buffer.from('file content');
      mockFileStorageService.downloadFile.mockResolvedValue(mockBuffer);

      const result = await controller.downloadFile('file-id-123');

      expect(result).toEqual(mockBuffer);
      expect(mockFileStorageService.downloadFile).toHaveBeenCalledWith('file-id-123');
    });
  });

  describe('deleteFile', () => {
    it('deve deletar arquivo', async () => {
      mockFileStorageService.deleteFile.mockResolvedValue();

      const result = await controller.deleteFile('file-id-123');

      expect(result).toEqual({ message: 'Arquivo deletado com sucesso' });
      expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith('file-id-123');
    });
  });
});

const NfseService = require('../nfse.service');
import { FileStorageService } from '../../../services/fileStorageService';

describe('NfseService - Storage Integration', () => {
    let nfseService: any;
    let testPdfBuffer: Buffer;

    beforeAll(() => {
        // Criar um PDF de teste
        testPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
    });

    beforeEach(() => {
        nfseService = new NfseService();
    });

    describe('Upload de PDF', () => {
        it('deve fazer upload de um PDF com sucesso', async () => {
            // Arrange
            const metadata = {
                fileName: 'test-nfse.pdf',
                contentType: 'application/pdf',
                size: testPdfBuffer.length
            };

            // Act & Assert
            await expect(async () => {
                const fileId = await nfseService.fileStorageService.uploadFile(testPdfBuffer, metadata);
                expect(fileId).toBeDefined();
                expect(typeof fileId).toBe('string');
                return fileId;
            }).not.toThrow();
        });

        it('deve falhar ao fazer upload com metadata inválido', async () => {
            // Arrange
            const invalidMetadata = {
                // fileName é obrigatório
                contentType: 'application/pdf',
                size: testPdfBuffer.length
            };

            // Act & Assert
            await expect(
                nfseService.fileStorageService.uploadFile(testPdfBuffer, invalidMetadata as any)
            ).rejects.toThrow();
        });

        it('deve usar o bucket padrão quando não especificado', async () => {
            // Arrange
            const metadata = {
                fileName: 'test-nfse-default-bucket.pdf',
                contentType: 'application/pdf',
                size: testPdfBuffer.length
            };

            // Act
            const fileId = await nfseService.fileStorageService.uploadFile(testPdfBuffer, metadata);

            // Assert
            expect(fileId).toBeDefined();
            
            // Tenta baixar o arquivo para confirmar que está no bucket correto
            const downloadedFile = await nfseService.fileStorageService.downloadFile(fileId);
            expect(downloadedFile).toBeDefined();
            expect(downloadedFile.length).toBe(testPdfBuffer.length);
        });
    });

    describe('Download de PDF', () => {
        let uploadedFileId: string;

        beforeEach(async () => {
            // Upload um arquivo para testar o download
            const metadata = {
                fileName: 'test-nfse-download.pdf',
                contentType: 'application/pdf',
                size: testPdfBuffer.length
            };
            uploadedFileId = await nfseService.fileStorageService.uploadFile(testPdfBuffer, metadata);
        });

        it('deve fazer download de um PDF existente', async () => {
            // Act
            const downloadedFile = await nfseService.fileStorageService.downloadFile(uploadedFileId);

            // Assert
            expect(downloadedFile).toBeDefined();
            expect(downloadedFile.length).toBe(testPdfBuffer.length);
            expect(Buffer.compare(downloadedFile, testPdfBuffer)).toBe(0);
        });

        it('deve falhar ao tentar fazer download de um arquivo inexistente', async () => {
            // Act & Assert
            await expect(
                nfseService.fileStorageService.downloadFile('arquivo-inexistente')
            ).rejects.toThrow();
        });
    });

    // Limpar recursos após os testes
    afterAll(async () => {
        // Tentar remover os arquivos de teste se existirem
        try {
            await nfseService.fileStorageService.deleteFile('test-nfse.pdf');
            await nfseService.fileStorageService.deleteFile('test-nfse-default-bucket.pdf');
            await nfseService.fileStorageService.deleteFile('test-nfse-download.pdf');
        } catch (error) {
            console.log('Erro ao limpar arquivos de teste:', error);
        }
    });
});

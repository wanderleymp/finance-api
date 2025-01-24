const { FileStorageDomainService } = require('../newArch/fileStorage/domain/services/file-storage.domain.service');
const { FileStorageAdapter } = require('../newArch/fileStorage/infra/adapters/file-storage.adapter');
const { MinioStorageProvider } = require('../newArch/fileStorage/infra/providers/minio-storage.provider');
const { FileStorageLoggerService } = require('../newArch/fileStorage/infra/services/file-storage-logger.service');
const { FileStorageMetricsService } = require('../newArch/fileStorage/infra/services/file-storage-metrics.service');

const logger = require('../middlewares/logger').logger;

class FileStorageService {
    constructor() {
        const loggerService = new FileStorageLoggerService();
        const metricsService = new FileStorageMetricsService();
        const storageProvider = new MinioStorageProvider();
        const fileStorageAdapter = new FileStorageAdapter(storageProvider);
        
        this.domainService = new FileStorageDomainService(
            fileStorageAdapter, 
            loggerService, 
            metricsService
        );
    }

    async uploadFile(file, metadata) {
        try {
            logger.info('Iniciando upload de arquivo via serviço legado', { 
                fileName: metadata.fileName, 
                fileSize: file.length 
            });

            const fileId = await this.domainService.uploadFile(file, {
                fileName: metadata.fileName,
                contentType: metadata.contentType || 'application/octet-stream',
                size: file.length,
                bucketName: metadata.bucketName || 'finance'
            });

            logger.info('Upload de arquivo concluído', { fileId });
            return fileId;
        } catch (error) {
            logger.error('Erro no upload de arquivo', { error });
            throw error;
        }
    }

    async downloadFile(fileId, bucketName = 'finance') {
        try {
            logger.info('Iniciando download de arquivo via serviço legado', { fileId });

            const file = await this.domainService.downloadFile(fileId);

            logger.info('Download de arquivo concluído', { 
                fileId, 
                fileSize: file.length 
            });
            return file;
        } catch (error) {
            logger.error('Erro no download de arquivo', { error });
            throw error;
        }
    }

    async deleteFile(fileId, bucketName = 'finance') {
        try {
            logger.info('Iniciando exclusão de arquivo via serviço legado', { fileId });

            await this.domainService.deleteFile(fileId);

            logger.info('Exclusão de arquivo concluída', { fileId });
        } catch (error) {
            logger.error('Erro na exclusão de arquivo', { error });
            throw error;
        }
    }

    async listFiles(prefix, bucketName = 'finance', maxKeys = 100) {
        try {
            logger.info('Listando arquivos via serviço legado', { 
                prefix, 
                bucketName, 
                maxKeys 
            });

            const files = await this.domainService.listFiles(prefix, bucketName);

            logger.info('Listagem de arquivos concluída', { 
                fileCount: files.length 
            });
            return files;
        } catch (error) {
            logger.error('Erro na listagem de arquivos', { error });
            throw error;
        }
    }
}

module.exports = new FileStorageService();

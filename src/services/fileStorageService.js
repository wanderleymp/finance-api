const { FileStorageDomainService } = require('./services/file-storage.domain.service');
const { FileStorageAdapter } = require('./adapters/adapters/file-storage.adapter');
const { MinioStorageProvider } = require('./providers/minio-storage.provider');
const { FileStorageLoggerService } = require('./services/file-storage-logger.service');
const { FileStorageMetricsService } = require('./services/file-storage-metrics.service');

const logger = require('../middlewares/logger').logger;

/**
 * Serviço responsável pelo gerenciamento de arquivos usando MinIO como provider
 * Este serviço é um singleton que deve ser usado por todos os módulos da aplicação
 * para operações de armazenamento de arquivos.
 */
class FileStorageService {
    /**
     * Inicializa o serviço de armazenamento com todas as dependências necessárias
     * Configura o MinIO client e os serviços de log e métricas
     */
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

    /**
     * Faz upload de um arquivo para o storage
     * @param {Buffer} file - Buffer contendo os dados do arquivo
     * @param {Object} metadata - Metadados do arquivo
     * @param {string} metadata.fileName - Nome do arquivo
     * @param {string} [metadata.contentType] - Tipo de conteúdo do arquivo
     * @param {string} [metadata.bucketName] - Nome do bucket (default: 'finance')
     * @returns {Promise<string>} ID único do arquivo no storage
     * @throws {Error} Se houver falha no upload
     */
    async uploadFile(file, metadata) {
        try {
            logger.info('Iniciando upload de arquivo via serviço legado', { 
                fileName: metadata.fileName, 
                fileSize: file.length,
                contentType: metadata.contentType,
                bucketName: metadata.bucketName || 'finance'
            });

            // Log da configuração do MinIO
            logger.debug('Configuração do MinIO', {
                endpoint: process.env.MINIO_ENDPOINT,
                useSSL: process.env.MINIO_USE_SSL,
                bucketName: process.env.MINIO_BUCKET_NAME
            });

            const fileId = await this.domainService.uploadFile(file, {
                fileName: metadata.fileName,
                contentType: metadata.contentType || 'application/octet-stream',
                size: file.length,
                bucketName: metadata.bucketName || 'finance'
            });

            logger.info('Upload de arquivo concluído com sucesso', { 
                fileId,
                fileName: metadata.fileName,
                bucketName: metadata.bucketName || 'finance'
            });
            return fileId;
        } catch (error) {
            logger.error('Erro no upload de arquivo', { 
                error,
                errorCode: error.code,
                errorMessage: error.message,
                stack: error.stack,
                metadata
            });
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

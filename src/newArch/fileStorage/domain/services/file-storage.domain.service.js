const { Client } = require('minio');
const logger = require('./logger');

class FileStorageDomainService {
    constructor() {
        // Extrair hostname da URL
        const endpointUrl = process.env.MINIO_ENDPOINT || 'https://localhost:9000';
        const url = new URL(endpointUrl);
        
        // Configuração do Minio
        this.minioClient = new Client({
            endPoint: url.hostname,
            port: parseInt(url.port || (url.protocol === 'https:' ? 443 : 80)),
            useSSL: url.protocol === 'https:',
            accessKey: process.env.MINIO_ACCESS_KEY,
            secretKey: process.env.MINIO_SECRET_KEY
        });

        // Bucket padrão
        this.defaultBucket = process.env.MINIO_DEFAULT_BUCKET || 'nfse-pdfs';
    }

    /**
     * Faz upload de um arquivo para o Minio
     * @param {Buffer} file - Conteúdo do arquivo
     * @param {Object} metadata - Metadados do arquivo
     * @param {number} maxSizeInMB - Tamanho máximo do arquivo em MB
     * @returns {Promise<string>} ID do arquivo
     */
    async uploadFile(file, metadata, maxSizeInMB = 10) {
        // Validações de tamanho e tipo
        this.validateFileSize(file.length, maxSizeInMB);
        if (metadata.contentType) {
            this.validateFileType(metadata.contentType);
        }

        try {
            // Criar bucket se não existir antes do upload
            await this.createBucketIfNotExists(metadata.bucketName);

            // Gerar nome de arquivo único
            const fileName = metadata.originalName || 
                `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Bucket a ser usado (ou o padrão)
            const bucketName = metadata.bucketName || this.defaultBucket;

            // Extrair diretórios da originalName
            const pathParts = fileName.split('/');
            const objectName = pathParts.pop(); // Nome do arquivo
            const objectPath = pathParts.join('/'); // Caminho da pasta

            // Criar diretórios intermediários se não existirem
            if (objectPath) {
                const pathSegments = objectPath.split('/');
                let currentPath = '';
                for (const segment of pathSegments) {
                    currentPath += segment + '/';
                    try {
                        // Tenta criar o diretório como um objeto vazio
                        await this.minioClient.putObject(
                            bucketName, 
                            currentPath + '.keep', 
                            Buffer.from('')
                        );
                    } catch (dirError) {
                        // Se já existir, ignora o erro
                        if (dirError.code !== 'BucketAlreadyExists') {
                            console.warn(`Erro ao criar diretório ${currentPath}:`, dirError);
                        }
                    }
                }
            }

            // Fazer upload
            await this.minioClient.putObject(
                bucketName, 
                fileName, 
                file, 
                {
                    'Content-Type': metadata.contentType || 'application/octet-stream',
                    ...metadata.tags
                }
            );

            // Retornar caminho completo do arquivo
            return fileName;
        } catch (error) {
            console.error('Erro no upload do arquivo:', error);
            throw error;
        }
    }

    /**
     * Baixa um arquivo do Minio
     * @param {string} fileId - ID do arquivo
     * @param {string} [bucketName] - Nome do bucket (opcional)
     * @returns {Promise<Buffer>} Conteúdo do arquivo
     */
    async downloadFile(fileId, bucketName) {
        try {
            // Usar bucket padrão se não especificado
            const bucket = bucketName || this.defaultBucket;

            // Baixar arquivo
            const dataStream = await this.minioClient.getObject(bucket, fileId);
            
            return new Promise((resolve, reject) => {
                const chunks = [];
                dataStream.on('data', (chunk) => chunks.push(chunk));
                dataStream.on('end', () => resolve(Buffer.concat(chunks)));
                dataStream.on('error', reject);
            });
        } catch (error) {
            logger.error('Erro no download de arquivo do Minio', { 
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Gera URL pública para um arquivo
     * @param {string} fileId - ID do arquivo
     * @param {number} [expiresIn=3600] - Tempo de expiração em segundos
     * @param {string} [bucketName] - Nome do bucket (opcional)
     * @returns {Promise<string>} URL pública
     */
    async generatePresignedUrl(fileId, expiresIn = 3600, bucketName) {
        try {
            // Usar bucket padrão se não especificado
            const bucket = bucketName || this.defaultBucket;

            // Gerar URL pública
            const url = await this.minioClient.presignedGetObject(
                bucket, 
                fileId, 
                expiresIn
            );

            logger.info('URL pública gerada para arquivo', { 
                bucket, 
                fileId, 
                expiresIn 
            });

            return url;
        } catch (error) {
            logger.error('Erro na geração de URL pública do Minio', { 
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async createBucketIfNotExists(bucketName = this.defaultBucket) {
        try {
            const exists = await this.minioClient.bucketExists(bucketName);
            if (!exists) {
                await this.minioClient.makeBucket(bucketName);
                console.log(`Bucket ${bucketName} criado com sucesso`);
            }
        } catch (error) {
            console.error(`Erro ao criar bucket ${bucketName}:`, error);
            throw error;
        }
    }

    validateFileSize(size, maxSizeInMB) {
        if (size > (maxSizeInMB * 1024 * 1024)) {
            throw new Error(`Arquivo excede o tamanho máximo de ${maxSizeInMB}MB`);
        }
    }

    validateFileType(contentType) {
        // Implementar validação de tipo de arquivo
    }
}

module.exports = { FileStorageDomainService };

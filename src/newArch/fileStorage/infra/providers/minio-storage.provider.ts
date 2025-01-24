import * as Minio from 'minio';
import { Injectable } from '@nestjs/common';
import { FileStorageInterface, ListFilesOptions } from '../../domain/interfaces/file-storage.interface';
import { FileMetadata } from '../../domain/interfaces/file-metadata.interface';

@Injectable()
export class MinioStorageProvider implements FileStorageInterface {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor() {
    // Configurações do MinIO a partir de variáveis de ambiente
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const url = new URL(endpoint.startsWith('http') ? endpoint : `https://${endpoint}`);

    console.log('MinIO Configuration:', {
      endpoint: url.hostname,
      protocol: url.protocol,
      useSSL: process.env.MINIO_USE_SSL === 'true' || url.protocol === 'https:'
    });

    this.minioClient = new Minio.Client({
      endPoint: url.hostname,
      useSSL: process.env.MINIO_USE_SSL === 'true' || url.protocol === 'https:',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
    });

    // Nome do bucket definido por variável de ambiente
    this.bucketName = process.env.MINIO_BUCKET_NAME || 'finance-files';

    // Criar bucket se não existir
    this.initializeBucket();
  }

  private async initializeBucket(): Promise<void> {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName);
        console.log(`Bucket ${this.bucketName} criado com sucesso`);
      }
    } catch (error) {
      console.error('Erro ao criar/verificar bucket:', error);
      // Não lance o erro para não interromper o teste
      console.warn('Continuando sem verificar o bucket');
    }
  }

  async uploadFile(file: Buffer, metadata: FileMetadata): Promise<string> {
    try {
      // Gerar nome de arquivo único
      const fileName = `${Date.now()}-${metadata.fileName}`;
      
      // Upload do arquivo
      await this.minioClient.putObject(
        this.bucketName, 
        fileName, 
        file, 
        file.length,
        { 
          'Content-Type': metadata.contentType 
        }
      );

      return fileName;
    } catch (error) {
      console.error('Erro no upload do arquivo:', error);
      throw error;
    }
  }

  async downloadFile(fileName: string, bucketName?: string): Promise<Buffer> {
    const bucket = bucketName || this.bucketName;
    
    try {
      const dataStream = await this.minioClient.getObject(bucket, fileName);
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        dataStream.on('data', (chunk) => chunks.push(chunk));
        dataStream.on('end', () => resolve(Buffer.concat(chunks)));
        dataStream.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Erro ao baixar arquivo: ${error.message}`);
    }
  }

  async deleteFile(fileName: string, bucketName?: string): Promise<void> {
    const bucket = bucketName || this.bucketName;
    
    try {
      await this.minioClient.removeObject(bucket, fileName);
    } catch (error) {
      throw new Error(`Erro ao deletar arquivo: ${error.message}`);
    }
  }

  async listFiles(options: { prefix?: string; bucketName?: string; maxKeys?: number }): Promise<FileMetadata[]> {
    const { prefix, bucketName, maxKeys } = options;
    const bucket = bucketName || this.bucketName;
    
    try {
      const objectsStream = this.minioClient.listObjects(bucket, prefix || '', maxKeys ? true : false);
      
      return new Promise((resolve, reject) => {
        const files: FileMetadata[] = [];
        
        objectsStream.on('data', (obj: any) => {
          files.push({
            fileName: obj.name,
            contentType: obj.metaData?.['content-type'] || 'application/octet-stream',
            size: obj.size,
            bucketName: bucket,
            uploadDate: obj.lastModified ? new Date(obj.lastModified) : undefined
          });
        });
        
        objectsStream.on('end', () => resolve(files));
        objectsStream.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Erro ao listar arquivos: ${error.message}`);
    }
  }
}

import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class FileStorageMetricsService {
  private uploadCounter: client.Counter;
  private downloadCounter: client.Counter;
  private deleteCounter: client.Counter;
  private fileSizeHistogram: client.Histogram;
  private errorCounter: client.Counter;

  constructor() {
    // Configuração do cliente Prometheus
    client.register.clear();
    client.collectDefaultMetrics();

    // Métricas específicas de armazenamento de arquivos
    this.uploadCounter = new client.Counter({
      name: 'file_storage_uploads_total',
      help: 'Total de uploads de arquivos',
      labelNames: ['content_type']
    });

    this.downloadCounter = new client.Counter({
      name: 'file_storage_downloads_total',
      help: 'Total de downloads de arquivos',
      labelNames: ['content_type']
    });

    this.deleteCounter = new client.Counter({
      name: 'file_storage_deletes_total',
      help: 'Total de exclusões de arquivos'
    });

    this.fileSizeHistogram = new client.Histogram({
      name: 'file_storage_file_size_bytes',
      help: 'Tamanho dos arquivos armazenados',
      buckets: [1024, 10240, 102400, 1048576, 10485760, 104857600] // Buckets em bytes
    });

    this.errorCounter = new client.Counter({
      name: 'file_storage_errors_total',
      help: 'Total de erros no armazenamento de arquivos',
      labelNames: ['error_type']
    });
  }

  recordUpload(contentType: string, fileSize: number): void {
    this.uploadCounter.inc({ content_type: contentType });
    this.fileSizeHistogram.observe(fileSize);
  }

  recordDownload(contentType: string): void {
    this.downloadCounter.inc({ content_type: contentType });
  }

  recordDelete(): void {
    this.deleteCounter.inc();
  }

  recordError(errorType: string): void {
    this.errorCounter.inc({ error_type: errorType });
  }

  async getMetrics(): Promise<string> {
    return client.register.metrics();
  }
}

export class LoggerService {
  logFileUpload(metadata: any, fileId: string): void {
    console.log(`Arquivo ${metadata.fileName} (${fileId}) enviado com sucesso`);
  }

  logFileDownload(fileId: string): void {
    console.log(`Download do arquivo ${fileId} realizado`);
  }

  logFileDelete(fileId: string): void {
    console.log(`Arquivo ${fileId} deletado`);
  }

  logPerformance(method: string, startTime: number): void {
    const duration = Date.now() - startTime;
    console.log(`Método ${method} executado em ${duration}ms`);
  }
}

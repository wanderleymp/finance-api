import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FileStorageMetricsService } from '../../infra/services/file-storage-metrics.service';

@ApiTags('Métricas de Armazenamento de Arquivos')
@Controller('metrics')
export class FileStorageMetricsController {
  constructor(private readonly metricsService: FileStorageMetricsService) {}

  @Get('file-storage')
  @ApiOperation({ summary: 'Obter métricas de armazenamento de arquivos' })
  @ApiResponse({ 
    status: 200, 
    description: 'Métricas de armazenamento de arquivos em formato Prometheus' 
  })
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}

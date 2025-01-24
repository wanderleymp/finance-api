export class MetricsService {
  private metrics: Record<string, number> = {};

  recordUpload(contentType: string, size: number): void {
    if (!this.metrics[contentType]) {
      this.metrics[contentType] = 0;
    }
    this.metrics[contentType] += size;
  }

  getUploadMetrics(): Record<string, number> {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {};
  }
}

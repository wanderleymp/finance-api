const promClient = require('prom-client');
const { logger } = require('../middlewares/logger');

class MetricsService {
    constructor() {
        // Criar registro personalizado
        this.register = new promClient.Registry();

        // Configurar métricas padrão do Node.js
        promClient.collectDefaultMetrics({
            register: this.register,
            prefix: 'finance_api_'
        });

        // Contadores
        this.requestCounter = new promClient.Counter({
            name: 'finance_api_http_requests_total',
            help: 'Total de requisições HTTP',
            labelNames: ['method', 'path', 'status']
        });

        this.errorCounter = new promClient.Counter({
            name: 'finance_api_errors_total',
            help: 'Total de erros',
            labelNames: ['type', 'code']
        });

        // Histogramas
        this.requestDuration = new promClient.Histogram({
            name: 'finance_api_http_request_duration_seconds',
            help: 'Duração das requisições HTTP em segundos',
            labelNames: ['method', 'path', 'status'],
            buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
        });

        this.dbQueryDuration = new promClient.Histogram({
            name: 'finance_api_db_query_duration_seconds',
            help: 'Duração das queries no banco de dados em segundos',
            labelNames: ['operation', 'success'],
            buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
        });

        // Gauges
        this.activeConnections = new promClient.Gauge({
            name: 'finance_api_active_connections',
            help: 'Número de conexões ativas'
        });

        this.activeTasks = new promClient.Gauge({
            name: 'finance_api_active_tasks',
            help: 'Número de tasks em processamento'
        });

        // Registrar métricas
        this.register.registerMetric(this.requestCounter);
        this.register.registerMetric(this.errorCounter);
        this.register.registerMetric(this.requestDuration);
        this.register.registerMetric(this.dbQueryDuration);
        this.register.registerMetric(this.activeConnections);
        this.register.registerMetric(this.activeTasks);
    }

    /**
     * Middleware para coletar métricas de requisições HTTP
     */
    requestMiddleware() {
        return (req, res, next) => {
            const start = process.hrtime();

            // Incrementar contador de conexões ativas
            this.activeConnections.inc();

            // Quando a resposta for enviada
            res.on('finish', () => {
                // Decrementar contador de conexões ativas
                this.activeConnections.dec();

                // Calcular duração
                const duration = process.hrtime(start);
                const durationSeconds = duration[0] + duration[1] / 1e9;

                // Registrar métricas
                this.requestCounter.labels(req.method, req.route?.path || req.path, res.statusCode).inc();
                this.requestDuration.labels(req.method, req.route?.path || req.path, res.statusCode).observe(durationSeconds);

                // Se for erro, incrementar contador de erros
                if (res.statusCode >= 400) {
                    this.errorCounter.labels('http', res.statusCode).inc();
                }
            });

            next();
        };
    }

    /**
     * Middleware para coletar métricas de queries no banco
     */
    async measureDbQuery(operation, callback) {
        const start = process.hrtime();
        let success = true;

        try {
            const result = await callback();
            return result;
        } catch (error) {
            success = false;
            throw error;
        } finally {
            const duration = process.hrtime(start);
            const durationSeconds = duration[0] + duration[1] / 1e9;

            this.dbQueryDuration.labels(operation, success).observe(durationSeconds);
        }
    }

    /**
     * Atualizar contador de tasks ativas
     */
    updateActiveTasks(count) {
        this.activeTasks.set(count);
    }

    /**
     * Registrar erro
     */
    recordError(type, code = 'unknown') {
        this.errorCounter.labels(type, code).inc();
    }

    /**
     * Endpoint para expor métricas
     */
    async getMetrics() {
        try {
            return await this.register.metrics();
        } catch (error) {
            logger.error('Erro ao coletar métricas', {
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = new MetricsService();

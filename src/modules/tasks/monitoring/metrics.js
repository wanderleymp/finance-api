const client = require('prom-client');
const { logger } = require('../../../middlewares/logger');

class TaskMetrics {
    constructor() {
        // Contador de tasks criadas
        this.tasksCreated = new client.Counter({
            name: 'tasks_created_total',
            help: 'Total de tasks criadas',
            labelNames: ['type']
        });

        // Contador de tasks completadas
        this.tasksCompleted = new client.Counter({
            name: 'tasks_completed_total',
            help: 'Total de tasks completadas',
            labelNames: ['type']
        });

        // Contador de tasks com erro
        this.tasksFailed = new client.Counter({
            name: 'tasks_failed_total',
            help: 'Total de tasks com erro',
            labelNames: ['type']
        });

        // Gauge para tasks pendentes
        this.tasksPending = new client.Gauge({
            name: 'tasks_pending_current',
            help: 'Número atual de tasks pendentes',
            labelNames: ['type']
        });

        // Histograma para tempo de processamento
        this.processingTime = new client.Histogram({
            name: 'task_processing_duration_seconds',
            help: 'Tempo de processamento das tasks',
            labelNames: ['type'],
            buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300]
        });
    }

    register() {
        logger.info('Registrando métricas do módulo de tasks');
        // As métricas são registradas automaticamente ao criar as instâncias
    }

    recordTaskCreated(type) {
        this.tasksCreated.inc({ type });
    }

    recordTaskCompleted(type) {
        this.tasksCompleted.inc({ type });
    }

    recordTaskFailed(type) {
        this.tasksFailed.inc({ type });
    }

    setPendingTasks(type, count) {
        this.tasksPending.set({ type }, count);
    }

    recordProcessingTime(type, durationInSeconds) {
        this.processingTime.observe({ type }, durationInSeconds);
    }
}

module.exports = TaskMetrics;

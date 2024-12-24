const { logger } = require('../../../middlewares/logger');
const { EventEmitter } = require('events');

class TaskMonitor extends EventEmitter {
    constructor({ taskService, checkInterval = 60000, thresholds = {} }) {
        super();
        this.taskService = taskService;
        this.checkInterval = checkInterval;
        this.thresholds = {
            pendingTasks: thresholds.pendingTasks || 100,
            failedTasks: thresholds.failedTasks || 50,
            processingTime: thresholds.processingTime || 300000 // 5 minutos
        };
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) {
            logger.warn('Monitor já está em execução');
            return;
        }

        this.isRunning = true;
        logger.info('Iniciando monitor de tasks', {
            checkInterval: this.checkInterval,
            thresholds: this.thresholds
        });

        while (this.isRunning) {
            try {
                await this.checkMetrics();
                await this.sleep(this.checkInterval);
            } catch (error) {
                logger.error('Erro ao verificar métricas', {
                    error: error.message
                });
                await this.sleep(this.checkInterval);
            }
        }
    }

    async stop() {
        logger.info('Parando monitor de tasks');
        this.isRunning = false;
    }

    async checkMetrics() {
        try {
            const metrics = await this.taskService.getMetrics();
            
            // Verificar tasks pendentes
            if (metrics.pendingTasks > this.thresholds.pendingTasks) {
                this.emitAlert('high_pending_tasks', {
                    current: metrics.pendingTasks,
                    threshold: this.thresholds.pendingTasks
                });
            }

            // Verificar tasks falhas
            if (metrics.failedTasks > this.thresholds.failedTasks) {
                this.emitAlert('high_failed_tasks', {
                    current: metrics.failedTasks,
                    threshold: this.thresholds.failedTasks
                });
            }

            // Verificar taxa de falha
            if (metrics.failureRate > 0.1) { // 10%
                this.emitAlert('high_failure_rate', {
                    current: metrics.failureRate,
                    threshold: 0.1
                });
            }

            logger.debug('Métricas verificadas', { metrics });
        } catch (error) {
            logger.error('Erro ao verificar métricas', {
                error: error.message
            });
            throw error;
        }
    }

    emitAlert(type, data) {
        const alert = {
            type,
            timestamp: new Date(),
            data
        };

        logger.warn('Alerta de task emitido', alert);
        this.emit('alert', alert);
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = TaskMonitor;

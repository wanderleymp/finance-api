const os = require('os');
const { systemDatabase } = require('../../config/database');
const IHealthService = require('./interfaces/IHealthService');
const { version } = require('../../../package.json');
const { logger } = require('../../middlewares/logger');

class HealthService extends IHealthService {
    constructor() {
        super();
        this.startTime = Date.now();
    }

    async checkDatabases() {
        const databases = {};

        try {
            // System Database Check
            const sysStart = Date.now();
            const systemDbTest = await systemDatabase.testConnection();
            const sysEnd = Date.now();

            databases.AgileDB = {
                ...systemDbTest,
                responseTime: `${sysEnd - sysStart}ms`,
                version: (await systemDatabase.pool.query('SELECT version()')).rows[0].version,
                activeConnections: (await systemDatabase.pool.query('SELECT count(*) FROM pg_stat_activity')).rows[0].count
            };

            logger.info('Database health check concluído', { databases });
        } catch (error) {
            logger.error('Erro ao verificar saúde dos bancos', { error });
            throw error;
        }

        return databases;
    }

    async checkSystem() {
        try {
            const cpus = os.cpus();
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;

            const systemMetrics = {
                cpu: {
                    count: cpus.length,
                    model: cpus[0].model,
                    speed: `${cpus[0].speed} MHz`,
                    usage: this._getCpuUsage(cpus)
                },
                memory: {
                    total: this._formatBytes(totalMemory),
                    free: this._formatBytes(freeMemory),
                    used: this._formatBytes(usedMemory),
                    usagePercentage: ((usedMemory / totalMemory) * 100).toFixed(2) + '%'
                },
                os: {
                    platform: os.platform(),
                    type: os.type(),
                    release: os.release(),
                    arch: os.arch(),
                    uptime: this._formatUptime(os.uptime())
                },
                process: {
                    uptime: this._formatUptime(process.uptime()),
                    memoryUsage: this._formatProcessMemory(process.memoryUsage()),
                    version: process.version,
                    pid: process.pid
                },
                app: {
                    version,
                    uptime: this._formatUptime((Date.now() - this.startTime) / 1000)
                }
            };

            logger.info('System health check concluído', { 
                metrics: Object.keys(systemMetrics)
            });

            return systemMetrics;
        } catch (error) {
            logger.error('Erro ao coletar métricas do sistema', { error });
            throw error;
        }
    }

    async checkHealth() {
        try {
            const [dbStatus, systemMetrics] = await Promise.all([
                this.checkDatabases(),
                this.checkSystem()
            ]);

            const isHealthy = Object.values(dbStatus).every(db => db.success);

            const healthStatus = {
                status: isHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                version,
                databases: dbStatus,
                system: systemMetrics
            };

            logger.info('Health check completo', { 
                status: healthStatus.status,
                databasesChecked: Object.keys(dbStatus)
            });

            return healthStatus;
        } catch (error) {
            logger.error('Erro ao realizar health check completo', { error });
            throw error;
        }
    }

    _getCpuUsage(cpus) {
        return cpus.map(cpu => {
            const total = Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0);
            const idle = cpu.times.idle;
            return {
                usage: ((1 - idle / total) * 100).toFixed(2) + '%',
                times: cpu.times
            };
        });
    }

    _formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    _formatUptime(seconds) {
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
    }

    _formatProcessMemory(memory) {
        return Object.entries(memory).reduce((acc, [key, value]) => {
            acc[key] = this._formatBytes(value);
            return acc;
        }, {});
    }
}

module.exports = new HealthService();

const os = require('os');
const { devDatabase, systemDatabase } = require('../../config/database');
const redis = require('../../config/redis');
const IHealthService = require('./interfaces/IHealthService');
const { version } = require('../../../package.json');

class HealthService extends IHealthService {
    constructor() {
        super();
        this.startTime = Date.now();
    }

    async checkDatabases() {
        const databases = {};

        try {
            // Dev Database Check
            const devStart = Date.now();
            const devDbTest = await devDatabase.testConnection();
            const devEnd = Date.now();

            databases.dev_history = {
                ...devDbTest,
                responseTime: `${devEnd - devStart}ms`,
                version: (await devDatabase.query('SELECT version()')).rows[0].version,
                activeConnections: (await devDatabase.query('SELECT count(*) FROM pg_stat_activity')).rows[0].count
            };

            // System Database Check
            const sysStart = Date.now();
            const systemDbTest = await systemDatabase.testConnection();
            const sysEnd = Date.now();

            databases.AgileDB = {
                ...systemDbTest,
                responseTime: `${sysEnd - sysStart}ms`,
                version: (await systemDatabase.query('SELECT version()')).rows[0].version,
                activeConnections: (await systemDatabase.query('SELECT count(*) FROM pg_stat_activity')).rows[0].count
            };
        } catch (error) {
            console.error('Database health check error:', error);
        }

        return databases;
    }

    async checkSystem() {
        const cpus = os.cpus();
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        // Calcular uso de CPU
        const cpuUsage = process.cpuUsage();
        const totalCPUUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

        return {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            cpu: {
                cores: cpus.length,
                model: cpus[0].model,
                speed: cpus[0].speed,
                totalUsage: `${totalCPUUsage.toFixed(2)}s`
            },
            memory: {
                total: this.formatBytes(totalMemory),
                free: this.formatBytes(freeMemory),
                used: this.formatBytes(usedMemory),
                usagePercentage: ((usedMemory / totalMemory) * 100).toFixed(2) + '%'
            },
            disk: await this.getDiskUsage(),
            uptime: this.formatUptime(os.uptime())
        };
    }

    async checkApplication() {
        const redisStatus = await this.checkRedis();

        return {
            version,
            uptime: this.formatUptime((Date.now() - this.startTime) / 1000),
            nodeEnv: process.env.NODE_ENV || 'development',
            externalServices: {
                redis: redisStatus
            },
            processMemory: {
                heapTotal: this.formatBytes(process.memoryUsage().heapTotal),
                heapUsed: this.formatBytes(process.memoryUsage().heapUsed),
                external: this.formatBytes(process.memoryUsage().external),
                rss: this.formatBytes(process.memoryUsage().rss)
            }
        };
    }

    async checkHealth() {
        const [dbStatus, systemStatus, appStatus] = await Promise.all([
            this.checkDatabases(),
            this.checkSystem(),
            this.checkApplication()
        ]);

        // Verifica se todos os componentes estão saudáveis
        const isHealthy = 
            Object.values(dbStatus).every(db => db.success) &&
            systemStatus.cpu.totalUsage < 90 &&
            systemStatus.memory.usagePercentage < 90 &&
            appStatus.externalServices.redis.status === 'ok';

        return {
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            version,
            components: {
                databases: dbStatus,
                system: systemStatus,
                application: appStatus
            }
        };
    }

    async checkRedis() {
        try {
            const start = Date.now();
            await redis.ping();
            const responseTime = Date.now() - start;

            return {
                status: 'ok',
                responseTime: `${responseTime}ms`,
                info: await redis.info()
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    async getDiskUsage() {
        try {
            const { exec } = require('child_process');
            return new Promise((resolve) => {
                exec('df -h / | tail -1', (error, stdout) => {
                    if (error) {
                        resolve({
                            error: 'Unable to get disk usage'
                        });
                        return;
                    }
                    const [filesystem, size, used, available, percentage, mounted] = stdout.split(/\s+/);
                    resolve({
                        filesystem,
                        size,
                        used,
                        available,
                        percentage,
                        mounted
                    });
                });
            });
        } catch (error) {
            return { error: 'Unable to get disk usage' };
        }
    }

    formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
    }
}

module.exports = new HealthService();

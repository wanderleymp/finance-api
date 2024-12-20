const healthService = require('./health.service');

class HealthController {
    async check(req, res) {
        try {
            const healthStatus = await healthService.checkHealth();
            
            // Define HTTP status baseado na saúde geral do sistema
            const httpStatus = healthStatus.status === 'healthy' ? 200 : 503;

            res.status(httpStatus).json(healthStatus);
        } catch (error) {
            console.error('Health check error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Internal server error during health check',
                error: error.message
            });
        }
    }

    // Endpoint específico para status do banco de dados
    async checkDatabases(req, res) {
        try {
            const dbStatus = await healthService.checkDatabases();
            const isHealthy = Object.values(dbStatus).every(db => db.success);
            
            res.status(isHealthy ? 200 : 503).json({
                status: isHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                databases: dbStatus
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Error checking database status',
                error: error.message
            });
        }
    }

    // Endpoint específico para métricas do sistema
    async checkSystem(req, res) {
        try {
            const systemStatus = await healthService.checkSystem();
            res.status(200).json({
                status: 'success',
                timestamp: new Date().toISOString(),
                system: systemStatus
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Error checking system metrics',
                error: error.message
            });
        }
    }
}

module.exports = new HealthController();

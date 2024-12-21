const healthService = require('./health.service');
const { logger } = require('../../middlewares/logger');

class HealthController {
    async check(req, res) {
        try {
            logger.info('Controller: Verificando saúde do sistema');
            const healthStatus = await healthService.checkHealth();
            
            // Define HTTP status baseado na saúde geral do sistema
            const httpStatus = healthStatus.status === 'healthy' ? 200 : 503;

            logger.info('Health check concluído', { status: healthStatus.status });
            res.status(httpStatus).json(healthStatus);
        } catch (error) {
            logger.error('Erro ao verificar saúde do sistema', { error });
            res.status(500).json({
                status: 'error',
                message: 'Internal server error during health check',
                error: error.message
            });
        }
    }

    async checkDatabases(req, res) {
        try {
            logger.info('Controller: Verificando status dos bancos de dados');
            const dbStatus = await healthService.checkDatabases();
            const isHealthy = Object.values(dbStatus).every(db => db.success);
            
            logger.info('Database check concluído', { isHealthy });
            res.status(isHealthy ? 200 : 503).json({
                status: isHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                databases: dbStatus
            });
        } catch (error) {
            logger.error('Erro ao verificar status dos bancos', { error });
            res.status(500).json({
                status: 'error',
                message: 'Error checking database status',
                error: error.message
            });
        }
    }

    async checkSystem(req, res) {
        try {
            logger.info('Controller: Verificando métricas do sistema');
            const systemStatus = await healthService.checkSystem();
            
            logger.info('System check concluído', { metrics: Object.keys(systemStatus) });
            res.status(200).json({
                status: 'success',
                timestamp: new Date().toISOString(),
                system: systemStatus
            });
        } catch (error) {
            logger.error('Erro ao verificar métricas do sistema', { error });
            res.status(500).json({
                status: 'error',
                message: 'Error checking system metrics',
                error: error.message
            });
        }
    }
}

module.exports = new HealthController();

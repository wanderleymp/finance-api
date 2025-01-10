const { logger } = require('../../../middlewares/logger');

class LogsService {
    constructor({ logsRepository }) {
        this.repository = logsRepository;
    }

    async create(logData) {
        try {
            console.log('DEBUG: LogsService create chamado', { 
                logData: JSON.stringify(logData),
                repositoryExists: !!this.repository
            });

            if (!this.repository) {
                throw new Error('LogsRepository não definido');
            }

            const log = await this.repository.create(logData);

            logger.info('LogsService: Log de tarefa criado', {
                taskId: logData.task_id,
                status: logData.status
            });

            return log;
        } catch (error) {
            console.error('DEBUG: Erro crítico no LogsService', {
                error: error.message,
                errorStack: error.stack,
                logData: JSON.stringify(logData)
            });

            logger.error('LogsService: Erro ao criar log', {
                error: error.message,
                errorStack: error.stack,
                logData
            });
            throw error;
        }
    }

    async findByTaskId(taskId, limit = 50) {
        try {
            if (!this.repository) {
                throw new Error('LogsRepository não definido');
            }

            return await this.repository.findByTaskId(taskId, limit);
        } catch (error) {
            logger.error('LogsService: Erro ao buscar logs', {
                error: error.message,
                taskId
            });
            throw error;
        }
    }
}

module.exports = LogsService;

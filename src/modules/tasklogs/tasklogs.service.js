const { logger } = require('../../middlewares/logger');
const TaskLogsRepository = require('./tasklogs.repository');
const TaskLogsResponseDTO = require('./dto/tasklogs-response.dto');

class TaskLogsService {
    constructor() {
        this.repository = new TaskLogsRepository();
    }

    async create(data) {
        try {
            logger.info('Criando log de task', { data });
            const result = await this.repository.create(data);
            return new TaskLogsResponseDTO(result);
        } catch (error) {
            logger.error('Erro ao criar log de task', {
                error: error.message,
                data
            });
            throw error;
        }
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            // Se tiver filtros de data, usa findByDateRange
            if (filters.start_date || filters.end_date) {
                const startDate = filters.start_date || new Date(0);
                const endDate = filters.end_date || new Date();
                delete filters.start_date;
                delete filters.end_date;

                const result = await this.repository.findByDateRange(
                    startDate,
                    endDate,
                    filters,
                    page,
                    limit
                );
                return {
                    items: TaskLogsResponseDTO.toList(result.items),
                    total: result.total,
                    page,
                    limit
                };
            }

            // Caso contrário, usa findAll padrão
            const result = await this.repository.findAll(page, limit, filters);
            return {
                items: TaskLogsResponseDTO.toList(result.items),
                total: result.total,
                page,
                limit
            };
        } catch (error) {
            logger.error('Erro ao listar logs de tasks', {
                error: error.message,
                filters
            });
            throw error;
        }
    }

    async findById(id) {
        try {
            const result = await this.repository.findById(id);
            if (!result) {
                throw new Error('Log não encontrado');
            }
            return new TaskLogsResponseDTO(result);
        } catch (error) {
            logger.error('Erro ao buscar log', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            logger.info('Atualizando log de task', { id, data });
            const result = await this.repository.update(id, data);
            if (!result) {
                throw new Error('Log não encontrado');
            }
            return new TaskLogsResponseDTO(result);
        } catch (error) {
            logger.error('Erro ao atualizar log de task', {
                error: error.message,
                id,
                data
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            logger.info('Deletando log de task', { id });
            const result = await this.repository.delete(id);
            if (!result) {
                throw new Error('Log não encontrado');
            }
            return true;
        } catch (error) {
            logger.error('Erro ao deletar log de task', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async findByTaskId(taskId, page = 1, limit = 10) {
        try {
            logger.info('Buscando logs da task', { taskId });
            const result = await this.repository.findByTaskId(taskId, page, limit);
            return {
                items: TaskLogsResponseDTO.toList(result.items),
                total: result.total,
                page,
                limit
            };
        } catch (error) {
            logger.error('Erro ao buscar logs da task', {
                error: error.message,
                taskId
            });
            throw error;
        }
    }

    async getTaskMetrics(taskId) {
        try {
            return await this.repository.getTaskMetrics(taskId);
        } catch (error) {
            logger.error('Erro ao buscar métricas da task', {
                error: error.message,
                taskId
            });
            throw error;
        }
    }
}

module.exports = TaskLogsService;

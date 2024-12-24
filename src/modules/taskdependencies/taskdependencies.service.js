const { logger } = require('../../middlewares/logger');
const TaskDependenciesRepository = require('./taskdependencies.repository');
const TaskDependenciesResponseDTO = require('./dto/taskdependencies-response.dto');

class TaskDependenciesService {
    constructor() {
        this.repository = new TaskDependenciesRepository();
    }

    async create(data) {
        try {
            // Verifica se não está criando uma dependência para a própria task
            if (data.task_id === data.depends_on_task_id) {
                throw new Error('Uma task não pode depender dela mesma');
            }

            // Verifica se não criará uma dependência circular
            const hasCircular = await this.repository.checkCircularDependency(
                data.task_id,
                data.depends_on_task_id
            );
            if (hasCircular) {
                throw new Error('Não é possível criar uma dependência circular');
            }

            const result = await this.repository.create(data);
            return new TaskDependenciesResponseDTO(result);
        } catch (error) {
            logger.error('Erro ao criar dependência de task', {
                error: error.message,
                data
            });
            throw error;
        }
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const result = await this.repository.findAll(page, limit, filters);
            return {
                items: TaskDependenciesResponseDTO.toList(result.items),
                total: result.total,
                page,
                limit
            };
        } catch (error) {
            logger.error('Erro ao listar dependências de tasks', {
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
                throw new Error('Dependência não encontrada');
            }
            return new TaskDependenciesResponseDTO(result);
        } catch (error) {
            logger.error('Erro ao buscar dependência', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            const result = await this.repository.update(id, data);
            if (!result) {
                throw new Error('Dependência não encontrada');
            }
            return new TaskDependenciesResponseDTO(result);
        } catch (error) {
            logger.error('Erro ao atualizar dependência', {
                error: error.message,
                id,
                data
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            const result = await this.repository.delete(id);
            if (!result) {
                throw new Error('Dependência não encontrada');
            }
            return true;
        } catch (error) {
            logger.error('Erro ao deletar dependência', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async findByTaskId(taskId) {
        try {
            logger.info('Buscando dependências da task', { taskId });
            const result = await this.repository.findByTaskId(taskId);
            return TaskDependenciesResponseDTO.toList(result);
        } catch (error) {
            logger.error('Erro ao buscar dependências da task', {
                error: error.message,
                taskId
            });
            throw error;
        }
    }

    async findDependentTasks(taskId) {
        try {
            logger.info('Buscando tasks dependentes', { taskId });
            const result = await this.repository.findDependentTasks(taskId);
            return TaskDependenciesResponseDTO.toList(result);
        } catch (error) {
            logger.error('Erro ao buscar tasks dependentes', {
                error: error.message,
                taskId
            });
            throw error;
        }
    }
}

module.exports = TaskDependenciesService;

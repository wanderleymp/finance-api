const TasksRepository = require('../repositories/tasksRepository');
const { logger } = require('../middlewares/logger');
const { ValidationError } = require('../utils/errors');
const PaginationHelper = require('../utils/paginationHelper');
const BoletoProcessor = require('../processors/boletoProcessor'); // Adicione essa linha

class TasksService {
    async listTasks({ page = 1, limit = 10, status, type }) {
        try {
            const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);
            
            // Preparar filtros dinâmicos
            const filters = {};
            if (status) filters.status = status;
            if (type) filters.type = type;
            
            const tasks = await TasksRepository.findAll(validPage, validLimit, filters);
            
            logger.info('Serviço: Listagem de tarefas', {
                totalTasks: tasks.total,
                page: validPage,
                limit: validLimit,
                filters
            });

            return PaginationHelper.formatResponse(
                tasks.data, 
                tasks.total, 
                validPage, 
                validLimit
            );
        } catch (error) {
            logger.error('Erro no serviço ao listar tarefas', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async getTaskById(id) {
        try {
            const task = await TasksRepository.findById(id);
            if (!task) {
                throw new ValidationError('Tarefa não encontrada');
            }
            return task;
        } catch (error) {
            logger.error('Erro ao buscar tarefa por ID', {
                errorMessage: error.message,
                errorStack: error.stack,
                taskId: id
            });
            throw error;
        }
    }

    async listTasksByType(type, { page = 1, limit = 10, status }) {
        try {
            const { page: validPage, limit: validLimit } = PaginationHelper.validateParams(page, limit);
            
            // Preparar filtros
            const filters = { type };
            if (status) filters.status = status;
            
            const tasks = await TasksRepository.findAll(validPage, validLimit, filters);
            
            logger.info('Serviço: Listagem de tarefas por tipo', {
                type,
                totalTasks: tasks.total,
                page: validPage,
                limit: validLimit,
                filters
            });

            return PaginationHelper.formatResponse(
                tasks.data, 
                tasks.total, 
                validPage, 
                validLimit
            );
        } catch (error) {
            logger.error('Erro ao listar tarefas por tipo', {
                errorMessage: error.message,
                errorStack: error.stack,
                type
            });
            throw error;
        }
    }

    async listTaskTypes() {
        try {
            const types = await TasksRepository.findAllTypes();
            return types;
        } catch (error) {
            logger.error('Erro ao listar tipos de tarefas', {
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async createTask(typeName, resourceId, payload = {}) {
        try {
            // Buscar o tipo de tarefa
            const taskType = await TasksRepository.getTaskTypeByName(typeName);
            if (!taskType) {
                throw new ValidationError(`Tipo de tarefa '${typeName}' não encontrado`);
            }

            // Criar a tarefa
            const task = await TasksRepository.create(taskType.type_id, resourceId, payload);
            
            logger.info('Tarefa criada com sucesso', {
                taskId: task.task_id,
                typeName,
                resourceId
            });

            return task;
        } catch (error) {
            logger.error('Erro ao criar tarefa', {
                typeName,
                resourceId,
                error: error.message
            });
            throw error;
        }
    }

    async updateTaskStatus(taskId, status, errorMessage = null) {
        try {
            const validStatus = ['pending', 'processing', 'completed', 'failed'];
            if (!validStatus.includes(status)) {
                throw new ValidationError(`Status '${status}' inválido`);
            }

            const task = await TasksRepository.updateStatus(taskId, status, errorMessage);
            
            logger.info('Status da tarefa atualizado', {
                taskId,
                status,
                hasError: !!errorMessage
            });

            return task;
        } catch (error) {
            logger.error('Erro ao atualizar status da tarefa', {
                taskId,
                status,
                errorMessage: error.message
            });
            throw error;
        }
    }

    async getPendingTasks(limit = 10) {
        try {
            const { data } = await TasksRepository.findAll(1, limit, { status: 'pending' });
            return data;
        } catch (error) {
            logger.error('Erro ao buscar tarefas pendentes', {
                errorMessage: error.message,
                limit
            });
            throw error;
        }
    }

    async processQueue() {
        try {
            logger.info('Processando fila de tarefas');

            // Buscar tarefas pendentes
            const tasks = await this.getPendingTasks(10);
            if (!tasks || tasks.length === 0) {
                logger.info('Nenhuma tarefa pendente encontrada');
                return;
            }

            logger.info(`Processando ${tasks.length} tarefas`);

            // Processar cada tarefa
            for (const task of tasks) {
                try {
                    switch (task.type_name) {
                        case 'BOLETO':
                            await BoletoProcessor.process(task);
                            break;
                        // Adicionar outros tipos aqui
                        default:
                            logger.warn(`Tipo de tarefa não suportado: ${task.type_name}`);
                            continue;
                    }

                    await this.updateTaskStatus(task.task_id, 'completed');
                    logger.info('Tarefa processada com sucesso', { 
                        taskId: task.task_id,
                        type: task.type_name
                    });
                } catch (error) {
                    logger.error('Erro ao processar tarefa', {
                        taskId: task.task_id,
                        type: task.type_name,
                        error: error.message
                    });
                    await this.updateTaskStatus(task.task_id, 'failed', error.message);
                }
            }
        } catch (error) {
            logger.error('Erro ao processar fila de tarefas', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = new TasksService();
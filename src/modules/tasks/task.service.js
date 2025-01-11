const { logger } = require('../../middlewares/logger');
const TaskLogsService = require('../tasklogs/tasklogs.service');
const TaskDependenciesService = require('../taskdependencies/taskdependencies.service');

class TaskService {
    constructor({ taskRepository, taskLogsService, taskDependenciesService, taskTypesRepository }) {
        this.repository = taskRepository;
        this.logsService = taskLogsService instanceof TaskLogsService 
            ? taskLogsService 
            : new TaskLogsService();
        this.dependenciesService = taskDependenciesService;
        this.taskTypesRepository = taskTypesRepository;
    }

    async create(data) {
        try {
            logger.info('TaskService: Iniciando criação de task', { 
                payload: JSON.stringify(data.payload),
                name: data.name,
                description: data.description
            });

            // Sempre usa type_id = 1 para boleto
            const taskData = {
                type_id: 1,
                name: data.name || this.generateTaskName(data.payload),
                status: 'pending',
                payload: JSON.stringify(data.payload),
                created_at: new Date(),
                updated_at: new Date()
            };

            logger.info('TaskService: Dados da task preparados', { taskData });

            // Cria task
            const result = await this.repository.create(taskData);

            if (!result || !result.id) {
                throw new Error('Falha ao criar tarefa: resultado inválido');
            }

            logger.info('TaskService: Task criada com sucesso', { 
                taskId: result.id,
                taskName: taskData.name
            });

            // Cria log inicial
            await this.logsService.create({
                task_id: result.id,
                status: 'pending',
                metadata: { action: 'create' }
            });

            return result;
        } catch (error) {
            logger.error('TaskService: Erro ao criar task', {
                error: error.message,
                errorStack: error.stack,
                payload: JSON.stringify(data.payload)
            });
            throw error;
        }
    }

    generateTaskName(payload) {
        return `Boleto ${payload.boleto_id || 'sem número'}`;
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            logger.info('Buscando tasks', { filters, page, limit });
            return await this.repository.findAll(filters, page, limit);
        } catch (error) {
            logger.error('Erro ao buscar tasks', {
                error: error.message,
                filters,
                page,
                limit
            });
            throw error;
        }
    }

    async findById(id) {
        try {
            logger.info('Buscando task por ID', { id });
            const task = await this.repository.findById(id);
            if (!task) {
                throw new Error('Task não encontrada');
            }
            return task;
        } catch (error) {
            logger.error('Erro ao buscar task', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            logger.info('Atualizando task', { id, data });

            // Verifica se a task existe
            const existingTask = await this.repository.findById(id);
            if (!existingTask) {
                throw new Error('Task não encontrada');
            }

            // Se estiver alterando o status, registra no log
            if (data.status && data.status !== existingTask.status) {
                await this.logsService.create({
                    task_id: id,
                    status: data.status,
                    metadata: { 
                        action: 'status_change',
                        previous_status: existingTask.status
                    }
                });
            }

            return await this.repository.update(id, data);
        } catch (error) {
            logger.error('Erro ao atualizar task', {
                error: error.message,
                id,
                data
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            logger.info('Deletando task', { id });

            // Verifica se a task existe
            const task = await this.repository.findById(id);
            if (!task) {
                throw new Error('Task não encontrada');
            }

            // Verifica se existem tasks que dependem desta
            const dependentTasks = await this.dependenciesService.findDependentTasks(id);
            if (dependentTasks.length > 0) {
                throw new Error('Existem tasks que dependem desta task');
            }

            return await this.repository.delete(id);
        } catch (error) {
            logger.error('Erro ao deletar task', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    async findPendingTasks(limit = 10) {
        try {
            return await this.repository.findPendingTasks(limit);
        } catch (error) {
            logger.error('Erro ao buscar tasks pendentes', {
                error: error.message,
                limit
            });
            throw error;
        }
    }
}

module.exports = TaskService;

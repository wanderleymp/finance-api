const { logger } = require('../../middlewares/logger');
const ITaskService = require('./interfaces/ITaskService');

class TaskService extends ITaskService {
    constructor({ taskRepository }) {
        super();
        this.taskRepository = taskRepository;
    }

    async createTask(task) {
        try {
            logger.info('Service: Criando tarefa', { task });
            return await this.taskRepository.create(task);
        } catch (error) {
            logger.error('Service: Erro ao criar tarefa', {
                error: error.message,
                task
            });
            throw error;
        }
    }

    async updateTaskStatus(taskId, status) {
        try {
            logger.info('Service: Atualizando status da tarefa', { 
                taskId, 
                status 
            });
            return await this.taskRepository.update(taskId, { status });
        } catch (error) {
            logger.error('Service: Erro ao atualizar status da tarefa', {
                error: error.message,
                taskId,
                status
            });
            throw error;
        }
    }

    async findTasks(filters) {
        try {
            logger.info('Service: Buscando tarefas', { filters });
            return await this.taskRepository.findAll(filters);
        } catch (error) {
            logger.error('Service: Erro ao buscar tarefas', {
                error: error.message,
                filters
            });
            throw error;
        }
    }

    async findTaskById(taskId) {
        try {
            logger.info('Service: Buscando tarefa por ID', { taskId });
            return await this.taskRepository.findById(taskId);
        } catch (error) {
            logger.error('Service: Erro ao buscar tarefa por ID', {
                error: error.message,
                taskId
            });
            throw error;
        }
    }
}

module.exports = TaskService;

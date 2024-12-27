const { logger } = require('../middlewares/logger');
const TaskService = require('../modules/tasks/services/task.service');

class TasksController {
    constructor(taskService) {
        this.taskService = taskService;
    }

    async index(req, res) {
        try {
            const { page = 1, limit = 10, status, type } = req.query;
            
            logger.info('Iniciando listagem de tarefas', {
                query: req.query
            });
            
            const tasks = await this.taskService.findTasksByType(type, {
                page: parseInt(page),
                limit: parseInt(limit),
                status
            });
            
            logger.info('Listagem de tarefas concluída', { 
                count: tasks.data.length,
                currentPage: tasks.meta.current_page,
                totalRecords: tasks.meta.total
            });
            
            res.json(tasks);
        } catch (error) {
            logger.error('Erro na listagem de tarefas', { 
                error: error.message,
                query: req.query
            });
            res.status(500).json({ error: error.message });
        }
    }

    async show(req, res) {
        try {
            const { id } = req.params;
            
            logger.info('Buscando tarefa por ID', { id });
            
            const task = await this.taskService.getTaskById(id);
            
            if (!task) {
                return res.status(404).json({ message: 'Tarefa não encontrada' });
            }

            res.json(task);
        } catch (error) {
            logger.error('Erro ao buscar tarefa', { 
                error: error.message,
                taskId: req.params.id
            });
            res.status(500).json({ error: error.message });
        }
    }

    async listByType(req, res) {
        try {
            const { type } = req.params;
            const { page = 1, limit = 10, status } = req.query;
            
            logger.info('Listando tarefas por tipo', { 
                type,
                query: req.query
            });
            
            const tasks = await this.taskService.findTasksByType(type, {
                page: parseInt(page),
                limit: parseInt(limit),
                status
            });
            
            logger.info('Listagem de tarefas por tipo concluída', { 
                type,
                count: tasks.data.length
            });
            
            res.json(tasks);
        } catch (error) {
            logger.error('Erro ao listar tarefas por tipo', { 
                error: error.message,
                type: req.params.type,
                query: req.query
            });
            res.status(500).json({ error: error.message });
        }
    }

    async listTypes(req, res) {
        try {
            logger.info('Listando tipos de tarefas');
            
            const types = await this.taskService.listTaskTypes();
            
            logger.info('Listagem de tipos de tarefas concluída', { 
                count: types.length 
            });
            
            res.json(types);
        } catch (error) {
            logger.error('Erro ao listar tipos de tarefas', { 
                error: error.message
            });
            res.status(500).json({ error: error.message });
        }
    }

    async processTask(req, res) {
        try {
            const { id } = req.params;
            
            // Processar a tarefa usando o método do serviço
            const result = await this.taskService.processTask(id);

            res.status(200).json({ 
                message: 'Tarefa processada com sucesso', 
                result 
            });
        } catch (error) {
            logger.error('Erro ao processar tarefa', { 
                taskId: req.params.id,
                error: error.message 
            });

            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = TasksController;
